// Nail Transfer Edge Function — the only path from the app to YouCam AI Nail Transfer.
//
//   POST /nail-transfer              multipart: idempotency_key, hand (file), reference (file)
//   GET  /nail-transfer?task_id=…
//
// Auth, idempotency, the one-task-at-a-time rule, the daily cap and status polling are shared
// with the other generation features in ../_shared/generation.ts.

import { readImagePart, serveGeneration, youcamUpload } from '../_shared/generation.ts';
import { fail } from '../_shared/http.ts';
import { NAIL_TRANSFER_LIMITS } from '../_shared/image.ts';

export default serveGeneration({
  kind: 'nail_transfer',
  prepare: async (form) => {
    const hand = await readImagePart(form, 'hand', NAIL_TRANSFER_LIMITS);
    if ('problem' in hand) return fail(422, 'invalid_hand_image', hand.problem);
    const reference = await readImagePart(form, 'reference', NAIL_TRANSFER_LIMITS);
    if ('problem' in reference) return fail(422, 'invalid_reference_image', reference.problem);

    return {
      hand: hand.bytes,
      uploads: [youcamUpload('hand', hand.bytes), youcamUpload('reference', reference.bytes)],
      start: (youcam, [srcFileId, refFileId]) => youcam.createNailTransferTask({ srcFileId, refFileId }),
    };
  },
});
