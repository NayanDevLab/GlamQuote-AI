// Shared create / status flow for YouCam generation tasks (Nail Transfer, Nail VTO, Hairstyle,
// Hair Color).
//
//   POST /<function>              multipart: idempotency_key + feature-specific parts
//                                 -> { taskId, status }
//   GET  /<function>?task_id=…    -> { taskId, status, resultUrl?, errorCode? }
//
// Each feature supplies only how to read its inputs and how to start its task. Everything
// that protects units and privacy lives here once: guest auth, idempotency, one in-flight
// task per guest, the daily cap, ownership checks and error mapping. The YouCam API key stays
// in the function's secrets; nothing here logs credentials, photo bytes or result URLs.

import type { SupabaseClient } from '@supabase/supabase-js';

import { authenticate, fail, json, sha256Hex, UUID_PATTERN } from './http.ts';
import { describeImageProblem, inspectImage, MAX_IMAGE_BYTES, type ImageLimits } from './image.ts';
import {
  createYouCamClient,
  YouCamError,
  type YouCamClient,
  type YouCamTaskFeature,
  type YouCamUpload,
} from './youcam.ts';

export type GenerationKind = 'nail_transfer' | 'nail_vto' | 'hairstyle' | 'hair_color';

export const FEATURE_FOR_KIND: Record<GenerationKind, YouCamTaskFeature> = {
  nail_transfer: 'ai-nail',
  nail_vto: 'nail-vto',
  hairstyle: 'hair-transfer',
  hair_color: 'hair-color',
};

/** A validated request, ready to be uploaded and started. */
export type Submission = {
  /** The user's own photo (hand or selfie); its hash identifies it for Compare Looks. */
  sourcePhoto: Uint8Array<ArrayBuffer>;
  uploads: YouCamUpload[];
  /** Extra columns recorded with the task (e.g. the validated customization). */
  record?: Record<string, unknown>;
  /** Creates the chargeable provider task from the uploaded file ids (same order as `uploads`). */
  start: (youcam: YouCamClient, fileIds: string[]) => Promise<string>;
};

export type GenerationDefinition = {
  kind: GenerationKind;
  /** Reads and validates the multipart inputs. Return a Response to reject the request. */
  prepare: (form: FormData) => Promise<Submission | Response>;
};

// A hand photo plus one reference image, each under 10 MB, plus multipart overhead.
const MAX_REQUEST_BYTES = 2 * MAX_IMAGE_BYTES + 64 * 1024;
// A 'creating' row older than this belongs to a request that died mid-flight.
const CREATING_STALE_MS = 2 * 60 * 1000;
const DEFAULT_DAILY_LIMIT = 10;

type TaskStatus = 'creating' | 'running' | 'success' | 'error';

type TaskRow = {
  id: string;
  kind: GenerationKind;
  status: TaskStatus;
  provider_task_id: string | null;
  error_code: string | null;
  created_at: string;
};

const TASK_COLUMNS = 'id, kind, status, provider_task_id, error_code, created_at';

/** Reads one image part and checks it against the feature's documented limits. */
export async function readImagePart(
  form: FormData,
  field: string,
  limits: ImageLimits,
): Promise<{ bytes: Uint8Array<ArrayBuffer> } | { problem: string }> {
  const part = form.get(field);
  if (!(part instanceof File)) return { problem: 'The file is missing.' };
  if (part.size >= MAX_IMAGE_BYTES) return { problem: 'The file must be smaller than 10 MB.' };
  const bytes = new Uint8Array(await part.arrayBuffer());
  const problem = describeImageProblem(bytes, limits);
  return problem ? { problem } : { bytes };
}

/** Builds a File API upload; the type comes from the bytes, which are already validated. */
export function youcamUpload(fileName: string, bytes: Uint8Array<ArrayBuffer>): YouCamUpload {
  const isPng = inspectImage(bytes)?.format === 'png';
  return {
    fileName: `${fileName}.${isPng ? 'png' : 'jpg'}`,
    contentType: isPng ? 'image/png' : 'image/jpg',
    bytes,
  };
}

/** Maps YouCam task error codes to the app's recovery states. */
function taskErrorCode(providerCode: string | null): string {
  switch (providerCode) {
    case 'no_hand_detected':
    case 'error_no_nail':
      return 'no_hand_detected';
    case 'error_nail_too_small':
      return 'nail_too_small';
    case 'exceed_max_filesize':
    case 'error_exceed_max_image_size':
    case 'error_decode_image':
    case 'error_download_image':
      return 'invalid_image';
    case 'invalid_parameter':
      return 'unsupported_setting';
    case 'error_nsfw_content_detected':
    case 'exceed_nsfw_retry_limits':
      return 'content_rejected';
    case 'error_inference':
      return 'inference_failed';
    // AI Hairstyle Virtual Try-On.
    case 'error_no_shoulder':
      return 'selfie_framing';
    case 'error_large_face_angle':
    case 'error_face_pose':
      return 'face_angle';
    case 'error_insufficient_landmarks':
    case 'error_no_face':
      return 'selfie_unclear';
    case 'error_multiple_people':
      return 'multiple_faces';
    case 'error_hair_too_short':
      return 'hair_too_short';
    case 'error_below_min_image_size':
      return 'image_too_small';
    case 'error_unsupport_ratio':
      return 'invalid_image';
    default:
      // Some failures arrive as a sentence rather than a code, e.g. Nail VTO's
      // "The input image is larger than the maximum size (1920x1920px)."
      if (providerCode && /larger than the maximum size/i.test(providerCode)) return 'invalid_image';
      return 'provider_error';
  }
}

/** Turns a failed provider call into an HTTP response without leaking provider details. */
function providerFailure(error: unknown): { response: Response; code: string; providerCode: string | null } {
  if (!(error instanceof YouCamError)) {
    return {
      response: fail(502, 'provider_error', 'The preview service returned an unexpected error.'),
      code: 'provider_error',
      providerCode: null,
    };
  }
  const { failure, providerCode } = error;
  if (failure === 'quota') {
    return { response: fail(503, 'provider_quota', 'Previews are temporarily unavailable.'), code: 'provider_quota', providerCode };
  }
  if (failure === 'rate_limited' || failure === 'unavailable') {
    return { response: fail(503, 'provider_unavailable', 'The preview service is busy. Please try again shortly.'), code: 'provider_unavailable', providerCode };
  }
  if (failure === 'auth') {
    return { response: fail(502, 'provider_misconfigured', 'Previews are not configured correctly.'), code: 'provider_misconfigured', providerCode };
  }
  if (providerCode === 'InvalidTemplate') {
    return { response: fail(422, 'template_unavailable', 'That hairstyle is no longer available.'), code: 'template_unavailable', providerCode };
  }
  if (providerCode === 'InvalidParameters' || providerCode === 'InvalidStyle') {
    return { response: fail(422, 'unsupported_setting', 'That combination of settings is not supported.'), code: 'unsupported_setting', providerCode };
  }
  return { response: fail(502, 'provider_error', 'The preview service could not accept this request.'), code: 'provider_error', providerCode };
}

function publicTask(row: TaskRow, extra: Record<string, unknown> = {}) {
  // 'creating' is an internal state (submission in progress); the app sees it as running.
  return { taskId: row.id, status: row.status === 'creating' ? 'running' : row.status, ...extra };
}

async function updateTask(db: SupabaseClient, id: string, patch: Record<string, unknown>): Promise<void> {
  const { error } = await db
    .from('generation_tasks')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) console.error('generation_tasks update failed', { taskId: id, code: error.code });
}

/** Asks YouCam for the latest state of a running task and records any terminal outcome. */
async function refreshTask(db: SupabaseClient, youcam: YouCamClient, row: TaskRow): Promise<{ row: TaskRow; resultUrl?: string }> {
  if (!row.provider_task_id) return { row };
  const state = await youcam.getTask(FEATURE_FOR_KIND[row.kind], row.provider_task_id);
  if (state.status === 'running') return { row };
  if (state.status === 'success') {
    if (row.status !== 'success') await updateTask(db, row.id, { status: 'success' });
    return { row: { ...row, status: 'success' }, resultUrl: state.resultUrl };
  }
  const errorCode = taskErrorCode(state.providerCode);
  await updateTask(db, row.id, { status: 'error', error_code: errorCode, provider_error_code: state.providerCode });
  return { row: { ...row, status: 'error', error_code: errorCode } };
}

async function createTask(
  req: Request,
  definition: GenerationDefinition,
  db: SupabaseClient,
  youcam: YouCamClient,
  userId: string,
): Promise<Response> {
  const declaredLength = Number(req.headers.get('content-length') ?? '0');
  if (declaredLength > MAX_REQUEST_BYTES) {
    return fail(413, 'payload_too_large', 'Each image must be smaller than 10 MB.');
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail(400, 'invalid_request', 'Send the request as multipart form data.');
  }

  const idempotencyKey = form.get('idempotency_key');
  if (typeof idempotencyKey !== 'string' || !UUID_PATTERN.test(idempotencyKey)) {
    return fail(400, 'invalid_request', 'idempotency_key must be a UUID.');
  }

  // 1. The same Generate tap, retried or double-fired, returns the task it already created.
  const { data: sameKey, error: sameKeyError } = await db
    .from('generation_tasks')
    .select(TASK_COLUMNS)
    .eq('user_id', userId)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle<TaskRow>();
  if (sameKeyError) return fail(500, 'server_error', 'Could not check for an existing preview.');
  if (sameKey) return json(publicTask(sameKey, { reused: true }));

  // 2. Only one in-flight task per guest, across every feature. A finished or abandoned one
  //    is settled first.
  const { data: active, error: activeError } = await db
    .from('generation_tasks')
    .select(TASK_COLUMNS)
    .eq('user_id', userId)
    .in('status', ['creating', 'running'])
    .maybeSingle<TaskRow>();
  if (activeError) return fail(500, 'server_error', 'Could not check for a preview in progress.');
  if (active) {
    let stillActive = true;
    if (active.status === 'creating') {
      if (Date.now() - Date.parse(active.created_at) > CREATING_STALE_MS) {
        await updateTask(db, active.id, { status: 'error', error_code: 'submit_failed' });
        stillActive = false;
      }
    } else {
      try {
        stillActive = (await refreshTask(db, youcam, active)).row.status === 'running';
      } catch (error) {
        return providerFailure(error).response;
      }
    }
    if (stillActive) {
      return fail(409, 'task_in_progress', 'A preview is already being created.', { taskId: active.id });
    }
  }

  // 3. Per-guest daily cap on chargeable requests, shared by every feature.
  const dailyLimit =
    Number(Deno.env.get('GENERATION_DAILY_LIMIT') ?? Deno.env.get('NAIL_TRANSFER_DAILY_LIMIT')) || DEFAULT_DAILY_LIMIT;
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count, error: countError } = await db
    .from('generation_tasks')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('provider_task_id', 'is', null)
    .gte('created_at', since);
  if (countError) return fail(500, 'server_error', 'Could not check the daily preview limit.');
  if ((count ?? 0) >= dailyLimit) {
    return fail(429, 'daily_limit', 'You have reached today\'s preview limit.');
  }

  // 4. Validate every input before anything is sent to the provider.
  const submission = await definition.prepare(form);
  if (submission instanceof Response) return submission;

  // 5. Reserve the task. The unique indexes make a concurrent duplicate lose here, before any spend.
  const { data: inserted, error: insertError } = await db
    .from('generation_tasks')
    .insert({
      user_id: userId,
      kind: definition.kind,
      idempotency_key: idempotencyKey,
      // Identifies the original photo for Compare Looks without storing the photo itself.
      source_photo_hash: await sha256Hex(submission.sourcePhoto),
      ...submission.record,
    })
    .select(TASK_COLUMNS)
    .single<TaskRow>();
  if (insertError || !inserted) {
    if (insertError?.code === '23505') {
      return fail(409, 'task_in_progress', 'A preview is already being created.');
    }
    return fail(500, 'server_error', 'Could not start the preview.');
  }

  // 6. Upload to YouCam and create the (chargeable) task.
  try {
    const fileIds = await youcam.uploadFiles(submission.uploads);
    const providerTaskId = await submission.start(youcam, fileIds);
    await updateTask(db, inserted.id, { status: 'running', provider_task_id: providerTaskId });
    return json({ taskId: inserted.id, status: 'running' });
  } catch (error) {
    const failure = providerFailure(error);
    console.error('generation submit failed', { taskId: inserted.id, kind: definition.kind, code: failure.code, providerCode: failure.providerCode });
    await updateTask(db, inserted.id, {
      status: 'error',
      error_code: 'submit_failed',
      provider_error_code: failure.providerCode,
    });
    return failure.response;
  }
}

async function getTask(
  req: Request,
  kind: GenerationKind,
  db: SupabaseClient,
  youcam: YouCamClient,
  userId: string,
): Promise<Response> {
  const taskId = new URL(req.url).searchParams.get('task_id') ?? '';
  if (!UUID_PATTERN.test(taskId)) return fail(400, 'invalid_request', 'task_id must be a UUID.');

  // Filtering by user_id is what stops one guest reading another guest's task.
  const { data: row, error } = await db
    .from('generation_tasks')
    .select(TASK_COLUMNS)
    .eq('id', taskId)
    .eq('user_id', userId)
    .eq('kind', kind)
    .maybeSingle<TaskRow>();
  if (error) return fail(500, 'server_error', 'Could not load the preview.');
  if (!row) return fail(404, 'not_found', 'No preview was found for this task.');

  if (row.status === 'error') return json(publicTask(row, { errorCode: row.error_code ?? 'provider_error' }));
  if (row.status === 'creating') return json(publicTask(row));

  // Running, or success (the 2-hour download URL is re-issued on each call and never stored).
  try {
    const refreshed = await refreshTask(db, youcam, row);
    if (refreshed.row.status === 'success') return json(publicTask(refreshed.row, { resultUrl: refreshed.resultUrl }));
    if (refreshed.row.status === 'error') return json(publicTask(refreshed.row, { errorCode: refreshed.row.error_code }));
    return json(publicTask(refreshed.row));
  } catch (caught) {
    // YouCam answers InvalidTaskId once a task can no longer be queried.
    if (caught instanceof YouCamError && caught.failure === 'rejected') {
      await updateTask(db, row.id, { status: 'error', error_code: 'expired', provider_error_code: caught.providerCode });
      return json(publicTask({ ...row, status: 'error' }, { errorCode: 'expired' }));
    }
    return providerFailure(caught).response;
  }
}

/** Builds the Edge Function handler for one generation feature. */
export function serveGeneration(definition: GenerationDefinition) {
  return {
    fetch: async (req: Request): Promise<Response> => {
      const caller = await authenticate(req);
      if (caller instanceof Response) return caller;

      const apiKey = Deno.env.get('YOUCAM_API_KEY');
      if (!apiKey) {
        console.error('YOUCAM_API_KEY is not set for this function');
        return fail(502, 'provider_misconfigured', 'Previews are not configured correctly.');
      }
      const youcam = createYouCamClient(apiKey);

      // caller.db bypasses RLS, so every query above filters by the caller's user id.
      if (req.method === 'POST') return createTask(req, definition, caller.db, youcam, caller.userId);
      if (req.method === 'GET') return getTask(req, definition.kind, caller.db, youcam, caller.userId);
      return fail(405, 'method_not_allowed', 'Use POST to create a preview or GET to check one.');
    },
  };
}
