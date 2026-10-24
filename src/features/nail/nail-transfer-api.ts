import { File } from 'expo-file-system';

import { invokeEdgeFunction } from '@/lib/supabase';

import type { NailVtoConfig } from './vto';

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
  | 'nail_too_small'
  | 'unsupported_setting'
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

/**
 * The photo as an upload part. Since SDK 57, `fetch` is Expo's implementation, which cannot send
 * React Native's `{ uri, name, type }` descriptor (it fails before any request is made); it reads
 * the bytes of an expo-file-system `File` instead.
 */
function filePart(image: LocalImage): File {
  return new File(image.uri);
}

const fileName = (image: LocalImage, name: string) =>
  `${name}.${image.mimeType === 'image/png' ? 'png' : 'jpg'}`;

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
  form.append('hand', filePart(input.hand), fileName(input.hand, 'hand'));
  form.append('reference', filePart(input.reference), fileName(input.reference, 'reference'));
  return invokeEdgeFunction<NailTransferTask>('nail-transfer', { method: 'POST', body: form });
}

/** Which YouCam feature produced a task: AI Nail Transfer or AI Nail Virtual Try-On. */
export type NailTaskKind = 'nail_transfer' | 'nail_vto';

const FUNCTION_FOR_KIND: Record<NailTaskKind, string> = {
  nail_transfer: 'nail-transfer',
  nail_vto: 'nail-vto',
};

/**
 * Starts one Nail Virtual Try-On preview (1 YouCam unit) for a Nail Polish or Press-On
 * customization. Same idempotency rules as `createNailTransferTask`.
 */
export function createNailVtoTask(input: {
  hand: LocalImage;
  config: NailVtoConfig;
  idempotencyKey: string;
}): Promise<NailTransferTask> {
  const form = new FormData();
  form.append('idempotency_key', input.idempotencyKey);
  form.append('hand', filePart(input.hand), fileName(input.hand, 'hand'));
  form.append('config', JSON.stringify(input.config));
  return invokeEdgeFunction<NailTransferTask>('nail-vto', { method: 'POST', body: form });
}

/** Reads the current state of a task this guest created. YouCam suggests polling about every 10 s. */
export function getNailTask(kind: NailTaskKind, taskId: string): Promise<NailTransferTask> {
  return invokeEdgeFunction<NailTransferTask>(
    `${FUNCTION_FOR_KIND[kind]}?task_id=${encodeURIComponent(taskId)}`,
    { method: 'GET' },
  );
}
