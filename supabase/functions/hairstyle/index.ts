// Hairstyle Edge Function — the only path from the app to YouCam AI Hairstyle Virtual Try-On
// (V2.1, predefined templates).
//
//   GET  /hairstyle?list=templates   -> { templates: [{ id, title, thumb, category }] }  (no units)
//   POST /hairstyle                  multipart: idempotency_key, selfie (JPEG file), template_id
//   GET  /hairstyle?task_id=…
//
// Auth, idempotency, the one-task-at-a-time rule, the daily cap and status polling are shared
// with the other generation features in ../_shared/generation.ts. A hairstyle task costs 2 units.

import { readImagePart, serveGeneration, youcamUpload } from '../_shared/generation.ts';
import { authenticate, fail, json } from '../_shared/http.ts';
import { HAIRSTYLE_LIMITS } from '../_shared/image.ts';
import { createYouCamClient, YouCamError, type HairstyleTemplate } from '../_shared/youcam.ts';

// Template ids are opaque provider strings; this only rejects obviously malformed input.
const TEMPLATE_ID_PATTERN = /^[\w.:\-]{1,128}$/;
// The gallery shows at most this many pages of 20.
const MAX_TEMPLATE_PAGES = 5;
// The list changes rarely; keep it per function instance to spare YouCam's rate limit.
const TEMPLATE_CACHE_MS = 30 * 60 * 1000;

let templateCache: { at: number; templates: HairstyleTemplate[] } | null = null;

async function listTemplates(req: Request): Promise<Response> {
  const caller = await authenticate(req);
  if (caller instanceof Response) return caller;

  if (templateCache && Date.now() - templateCache.at < TEMPLATE_CACHE_MS) {
    return json({ templates: templateCache.templates });
  }
  const apiKey = Deno.env.get('YOUCAM_API_KEY');
  if (!apiKey) return fail(502, 'provider_misconfigured', 'Previews are not configured correctly.');
  const youcam = createYouCamClient(apiKey);

  try {
    const templates: HairstyleTemplate[] = [];
    let token: string | undefined;
    for (let page = 0; page < MAX_TEMPLATE_PAGES; page++) {
      const result = await youcam.listHairstyleTemplates(token);
      templates.push(...result.templates);
      if (!result.nextToken) break;
      token = result.nextToken;
    }
    templateCache = { at: Date.now(), templates };
    return json({ templates });
  } catch (error) {
    const failure = error instanceof YouCamError ? error.failure : 'unexpected_response';
    console.error('hairstyle template list failed', { failure });
    if (failure === 'auth') return fail(502, 'provider_misconfigured', 'Previews are not configured correctly.');
    return fail(503, 'provider_unavailable', 'Hairstyles could not be loaded. Please try again shortly.');
  }
}

const generation = serveGeneration({
  kind: 'hairstyle',
  prepare: async (form) => {
    const templateId = form.get('template_id');
    if (typeof templateId !== 'string' || !TEMPLATE_ID_PATTERN.test(templateId)) {
      return fail(422, 'template_unavailable', 'Choose a hairstyle from the gallery.');
    }

    const selfie = await readImagePart(form, 'selfie', HAIRSTYLE_LIMITS);
    if ('problem' in selfie) return fail(422, 'invalid_selfie_image', selfie.problem);

    return {
      sourcePhoto: selfie.bytes,
      uploads: [youcamUpload('selfie', selfie.bytes)],
      record: { config: { templateId } },
      start: (youcam, [srcFileId]) => youcam.createHairstyleTask({ srcFileId, templateId }),
    };
  },
});

export default {
  fetch: (req: Request): Promise<Response> => {
    if (req.method === 'GET' && new URL(req.url).searchParams.get('list') === 'templates') {
      return listTemplates(req);
    }
    return generation.fetch(req);
  },
};
