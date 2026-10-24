import { File } from 'expo-file-system';

import { invokeEdgeFunction } from '@/lib/supabase';

import type { HairColorConfig } from './presets';

/**
 * Client for the `hair-color` Edge Function (YouCam AI Hair Color Virtual Try-On V1.0).
 *
 * The photo must already meet the provider limits, which the function re-checks: JPEG or PNG
 * under 10 MB, at least 320 x 320, width < 1920 and height < 1080. Create a task only after the
 * user has consented on the Review screen. Each task costs 1 YouCam unit.
 */

/** Both documented maximums: the spec table's "long side < 1920" and the error text's "height < 1080". */
export const HAIR_COLOR_MAX_WIDTH = 1919;
export const HAIR_COLOR_MAX_HEIGHT = 1079;
export const HAIR_COLOR_MIN_SIDE = 320;

export type HairColorTask = {
  taskId: string;
  status: 'running' | 'success' | 'error';
  /** Present only on success. A temporary download link (about 2 hours) — never persist it. */
  resultUrl?: string;
  /** Present only on error. */
  errorCode?: string;
};

/**
 * Starts one hair color preview (1 YouCam unit). `idempotencyKey` is a UUID generated once per
 * Generate tap: sending it again returns the task that tap already created.
 */
export function createHairColorTask(input: {
  photoUri: string;
  config: HairColorConfig;
  idempotencyKey: string;
}): Promise<HairColorTask> {
  const form = new FormData();
  form.append('idempotency_key', input.idempotencyKey);
  // Photos are re-encoded as JPEG on the device. SDK 57's fetch sends an expo-file-system File.
  form.append('photo', new File(input.photoUri), 'photo.jpg');
  form.append('config', JSON.stringify(input.config));
  return invokeEdgeFunction<HairColorTask>('hair-color', {
    method: 'POST',
    body: form,
  });
}

/** Reads the current state of a hair color task this guest created. Creates nothing. */
export function getHairColorTask(taskId: string): Promise<HairColorTask> {
  return invokeEdgeFunction<HairColorTask>(`hair-color?task_id=${encodeURIComponent(taskId)}`, { method: 'GET' });
}
