// My Lookbook Edge Function.
//
//   POST /lookbook   { taskId, title, designSource, designId? }  -> { look }   (explicit Save)
//   GET  /lookbook                                               -> { looks }
//
// Save copies the genuine YouCam result for one of the caller's own successful tasks into
// private Cloudinary storage and records it. It never creates a YouCam task, so saving and
// listing use no units. The original hand photo is never stored.

import { createCloudinaryClient } from '../_shared/cloudinary.ts';
import { authenticate, fail, json, UUID_PATTERN, type Caller } from '../_shared/http.ts';
import { inspectImage, MAX_IMAGE_BYTES } from '../_shared/image.ts';
import { createYouCamClient, YouCamError } from '../_shared/youcam.ts';

type LookRow = {
  id: string;
  task_id: string;
  kind: string;
  title: string;
  design_source: string;
  design_id: string | null;
  source_photo_hash: string | null;
  image_public_id: string;
  image_format: string;
  image_width: number | null;
  image_height: number | null;
  created_at: string;
};

type TaskRow = { id: string; status: string; provider_task_id: string | null; source_photo_hash: string | null };

const LOOK_COLUMNS =
  'id, task_id, kind, title, design_source, design_id, source_photo_hash, image_public_id, image_format, image_width, image_height, created_at';

type Cloudinary = ReturnType<typeof createCloudinaryClient>;

function cloudinaryFromEnv(): Cloudinary | null {
  const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME');
  const apiKey = Deno.env.get('CLOUDINARY_API_KEY');
  const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET');
  if (!cloudName || !apiKey || !apiSecret) return null;
  return createCloudinaryClient({ cloudName, apiKey, apiSecret });
}

async function publicLook(row: LookRow, cloudinary: Cloudinary) {
  return {
    id: row.id,
    taskId: row.task_id,
    kind: row.kind,
    title: row.title,
    designSource: row.design_source,
    designId: row.design_id,
    // Looks with the same hash came from the same original photo (Compare Looks eligibility).
    sourcePhotoHash: row.source_photo_hash,
    imageUrl: await cloudinary.signedImageUrl(row.image_public_id, row.image_format),
    imageWidth: row.image_width,
    imageHeight: row.image_height,
    createdAt: row.created_at,
  };
}

async function listLooks({ userId, db }: Caller, cloudinary: Cloudinary): Promise<Response> {
  const { data, error } = await db
    .from('saved_looks')
    .select(LOOK_COLUMNS)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)
    .returns<LookRow[]>();
  if (error) return fail(500, 'server_error', 'Could not load your Lookbook.');
  return json({ looks: await Promise.all((data ?? []).map((row) => publicLook(row, cloudinary))) });
}

async function saveLook(req: Request, { userId, db }: Caller, cloudinary: Cloudinary): Promise<Response> {
  const body: unknown = await req.json().catch(() => null);
  const input = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const { taskId, designSource } = input;
  const title = typeof input.title === 'string' ? input.title.trim() : '';
  const designId = typeof input.designId === 'string' ? input.designId.slice(0, 80) : null;
  if (typeof taskId !== 'string' || !UUID_PATTERN.test(taskId)) {
    return fail(400, 'invalid_request', 'taskId must be a UUID.');
  }
  if (title.length < 1 || title.length > 80) return fail(400, 'invalid_request', 'title must be 1–80 characters.');
  if (designSource !== 'reference' && designSource !== 'catalogue') {
    return fail(400, 'invalid_request', 'designSource must be "reference" or "catalogue".');
  }

  // Saving the same preview again returns the look that already exists.
  const findExisting = () =>
    db.from('saved_looks').select(LOOK_COLUMNS).eq('user_id', userId).eq('task_id', taskId).maybeSingle<LookRow>();
  const existing = await findExisting();
  if (existing.error) return fail(500, 'server_error', 'Could not check your Lookbook.');
  if (existing.data) return json({ look: await publicLook(existing.data, cloudinary), alreadySaved: true });

  // Only a genuine, successful preview that belongs to this guest can be saved.
  const { data: task, error: taskError } = await db
    .from('generation_tasks')
    .select('id, status, provider_task_id, source_photo_hash')
    .eq('id', taskId)
    .eq('user_id', userId)
    .eq('kind', 'nail_transfer')
    .maybeSingle<TaskRow>();
  if (taskError) return fail(500, 'server_error', 'Could not load the preview.');
  if (!task) return fail(404, 'not_found', 'No preview was found for this task.');
  if (task.status !== 'success' || !task.provider_task_id) {
    return fail(409, 'not_saveable', 'Only a finished preview can be saved.');
  }

  const youcamKey = Deno.env.get('YOUCAM_API_KEY');
  if (!youcamKey) return fail(502, 'provider_misconfigured', 'Saving is not configured correctly.');

  // Re-read the task for a fresh download link (they expire after about 2 hours).
  let bytes: Uint8Array<ArrayBuffer>;
  try {
    const state = await createYouCamClient(youcamKey).getNailTransferTask(task.provider_task_id);
    if (state.status !== 'success') {
      return fail(409, 'result_unavailable', 'This preview is no longer available to save.');
    }
    const download = await fetch(state.resultUrl, { signal: AbortSignal.timeout(30_000) });
    if (!download.ok) return fail(409, 'result_unavailable', 'This preview is no longer available to save.');
    bytes = new Uint8Array(await download.arrayBuffer());
  } catch (error) {
    if (error instanceof YouCamError && error.failure === 'rejected') {
      return fail(409, 'result_unavailable', 'This preview is no longer available to save.');
    }
    return fail(503, 'provider_unavailable', 'Could not fetch the preview to save. Please try again.');
  }
  const info = inspectImage(bytes);
  if (!info || bytes.byteLength > 2 * MAX_IMAGE_BYTES) {
    return fail(502, 'result_unavailable', 'The preview image could not be read.');
  }

  // The public id is derived from the task, so a retry after a partial failure overwrites
  // the same asset instead of creating a second one.
  let asset;
  try {
    asset = await cloudinary.uploadPrivateImage({
      publicId: `glamquote/${userId}/${task.id}`,
      bytes,
      contentType: info.format === 'png' ? 'image/png' : 'image/jpeg',
    });
  } catch {
    console.error('lookbook image upload failed', { taskId: task.id });
    return fail(503, 'storage_unavailable', 'Could not store the image. Nothing was saved — please try again.');
  }

  const { data: inserted, error: insertError } = await db
    .from('saved_looks')
    .insert({
      user_id: userId,
      task_id: task.id,
      kind: 'nail_transfer',
      title,
      design_source: designSource,
      design_id: designId,
      source_photo_hash: task.source_photo_hash,
      image_public_id: asset.publicId,
      image_format: asset.format,
      image_width: asset.width,
      image_height: asset.height,
    })
    .select(LOOK_COLUMNS)
    .single<LookRow>();
  if (insertError || !inserted) {
    // A concurrent Save for the same task won the race: return its row.
    if (insertError?.code === '23505') {
      const raced = await findExisting();
      if (raced.data) return json({ look: await publicLook(raced.data, cloudinary), alreadySaved: true });
    }
    console.error('saved_looks insert failed', { taskId: task.id, code: insertError?.code });
    return fail(500, 'server_error', 'The image was stored but the look was not recorded. Please try Save again.');
  }
  return json({ look: await publicLook(inserted, cloudinary) });
}

export default {
  fetch: async (req: Request): Promise<Response> => {
    const caller = await authenticate(req);
    if (caller instanceof Response) return caller;

    const cloudinary = cloudinaryFromEnv();
    if (!cloudinary) {
      console.error('Cloudinary secrets are not set for this function');
      return fail(502, 'storage_misconfigured', 'Saving is not configured correctly.');
    }

    if (req.method === 'GET') return listLooks(caller, cloudinary);
    if (req.method === 'POST') return saveLook(req, caller, cloudinary);
    return fail(405, 'method_not_allowed', 'Use GET to list looks or POST to save one.');
  },
};
