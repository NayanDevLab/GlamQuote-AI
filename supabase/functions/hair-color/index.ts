// Hair Color Edge Function — the only path from the app to YouCam AI Hair Color Virtual Try-On
// (V1.0, Full and Ombre).
//
//   POST /hair-color          multipart: idempotency_key, photo (JPEG/PNG file), config (JSON string)
//   GET  /hair-color?task_id=…
//
// `config` is { mode, preset } or { mode, palettes, blendStrength?, lineOffset? }. It is validated
// and rebuilt server-side (see ../_shared/hair-color.ts) and stored with the task. Auth,
// idempotency, the one-task-at-a-time rule, the daily cap and polling are shared with the other
// generation features in ../_shared/generation.ts. A hair color task costs 1 unit.

import { validateHairColorConfig } from '../_shared/hair-color.ts';
import { readImagePart, serveGeneration, youcamUpload } from '../_shared/generation.ts';
import { fail } from '../_shared/http.ts';
import { HAIR_COLOR_LIMITS } from '../_shared/image.ts';

export default serveGeneration({
  kind: 'hair_color',
  prepare: async (form) => {
    const rawConfig = form.get('config');
    let parsed: unknown = null;
    try {
      parsed = typeof rawConfig === 'string' ? JSON.parse(rawConfig) : null;
    } catch {
      // Handled below as an invalid config.
    }
    const validation = validateHairColorConfig(parsed);
    if (!validation.ok) return fail(422, validation.code, validation.message);
    const { mode, request } = validation;

    const photo = await readImagePart(form, 'photo', HAIR_COLOR_LIMITS);
    if ('problem' in photo) return fail(422, 'invalid_hair_color_image', photo.problem);

    return {
      sourcePhoto: photo.bytes,
      uploads: [youcamUpload('photo', photo.bytes)],
      record: { effect_type: mode, config: request },
      start: (youcam, [srcFileId]) => youcam.createHairColorTask({ srcFileId, request }),
    };
  },
});
