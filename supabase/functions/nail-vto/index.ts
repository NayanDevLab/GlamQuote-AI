// Nail Virtual Try-On Edge Function — the only path from the app to YouCam AI Nail VTO
// (Nail Polish and Press-On Nails, colour sub-type).
//
//   POST /nail-vto              multipart: idempotency_key, hand (file), config (JSON string)
//   GET  /nail-vto?task_id=…
//
// `config` is { effectType, effects[] }. It is validated and rebuilt server-side before
// anything is sent to YouCam, and the validated version is stored with the task.

import { readImagePart, serveGeneration, youcamUpload } from '../_shared/generation.ts';
import { fail } from '../_shared/http.ts';
import { NAIL_VTO_LIMITS } from '../_shared/image.ts';
import { validateNailVtoConfig } from '../_shared/nail-vto.ts';

export default serveGeneration({
  kind: 'nail_vto',
  prepare: async (form) => {
    const rawConfig = form.get('config');
    let parsed: unknown = null;
    try {
      parsed = typeof rawConfig === 'string' ? JSON.parse(rawConfig) : null;
    } catch {
      // Handled below as an invalid config.
    }
    const validation = validateNailVtoConfig(parsed);
    if (!validation.ok) return fail(422, validation.code, validation.message);
    const { effectType, effects } = validation.request;

    const hand = await readImagePart(form, 'hand', NAIL_VTO_LIMITS);
    if ('problem' in hand) return fail(422, 'invalid_hand_image', hand.problem);

    return {
      hand: hand.bytes,
      uploads: [youcamUpload('hand', hand.bytes)],
      record: { effect_type: effectType, config: { effects } },
      start: (youcam, [srcFileId]) => youcam.createNailVtoTask({ srcFileId, effectType, effects }),
    };
  },
});
