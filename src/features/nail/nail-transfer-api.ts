import { invokeEdgeFunction } from '@/lib/supabase';

/**
 * Client for the `nail-transfer` Edge Function (YouCam AI Nail Transfer).
 *
 * Inputs must already meet the provider limits, which the function re-checks:
 * JPEG or PNG, under 10 MB, longest side 4096 px or less. Call these only after the
 * user has consented to YouCam processing on the Review screen.
 */

/** A locally stored image (camera or gallery), referenced by its file URI. */
export type LocalImage = {
  uri: string;
  mimeType: 'image/jpeg' | 'image/png';
};

/** Only the states YouCam actually reports. There is no progress percentage. */
export type NailTransferStatus = 'running' | 'success' | 'error';

export type NailTransferErrorCode =
  | 'no_hand_detected'
  | 'invalid_image'
  | 'content_rejected'
  | 'inference_failed'
  | 'submit_failed'
  | 'expired'
  | 'provider_error';

export type NailTransferTask = {
  taskId: string;
  status: NailTransferStatus;
  /** Present only on success. A temporary download link (about 2 hours) — never persist it. */
  resultUrl?: string;
  /** Present only on error. */
  errorCode?: NailTransferErrorCode;
};

function filePart(image: LocalImage, name: string): Blob {
  const extension = image.mimeType === 'image/png' ? 'png' : 'jpg';
  // React Native's FormData takes a { uri, name, type } descriptor in place of a Blob.
  return { uri: image.uri, name: `${name}.${extension}`, type: image.mimeType } as unknown as Blob;
}

/**
 * Starts one Nail Transfer preview (1 YouCam unit).
 *
 * `idempotencyKey` is a UUID generated once per Generate tap: sending the same key again
 * returns the task that tap already created instead of starting — and paying for — another.
 * Throws `EdgeFunctionError`; code `task_in_progress` carries the running task's id in
 * `details.taskId`.
 */
export function createNailTransferTask(input: {
  hand: LocalImage;
  reference: LocalImage;
  idempotencyKey: string;
}): Promise<NailTransferTask> {
  const form = new FormData();
  form.append('idempotency_key', input.idempotencyKey);
  form.append('hand', filePart(input.hand, 'hand'));
  form.append('reference', filePart(input.reference, 'reference'));
  return invokeEdgeFunction<NailTransferTask>('nail-transfer', { method: 'POST', body: form });
}

/** Reads the current state of a task this guest created. YouCam suggests polling about every 10 s. */
export function getNailTransferTask(taskId: string): Promise<NailTransferTask> {
  return invokeEdgeFunction<NailTransferTask>(
    `nail-transfer?task_id=${encodeURIComponent(taskId)}`,
    { method: 'GET' },
  );
}
