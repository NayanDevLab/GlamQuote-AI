import { File } from 'expo-file-system';

import { invokeEdgeFunction } from '@/lib/supabase';

/**
 * Client for the `hairstyle` Edge Function (YouCam AI Hairstyle Virtual Try-On V2.1).
 *
 * The selfie must already meet the provider limits, which the function re-checks: JPEG only,
 * under 10 MB, longest side 1024 px or less. Create a task only after the user has consented
 * on the Review screen. Each task costs 2 YouCam units; listing templates costs none.
 */

/** YouCam accepts at most 1024 px on the selfie's longest side. */
export const HAIR_MAX_LONG_SIDE = 1024;

/** A predefined YouCam hairstyle. `thumb` is YouCam's own sample image of the style. */
export type HairTemplate = { id: string; title: string; thumb: string; category: string | null };

export type HairTaskStatus = 'running' | 'success' | 'error';

export type HairTask = {
  taskId: string;
  status: HairTaskStatus;
  /** Present only on success. A temporary download link (about 2 hours) — never persist it. */
  resultUrl?: string;
  /** Present only on error. */
  errorCode?: string;
};

export const HAIR_TEMPLATES_QUERY_KEY = ['hair-templates'] as const;

/** Lists YouCam's predefined hairstyles. Uses no units. */
export async function listHairTemplates(): Promise<HairTemplate[]> {
  const { templates } = await invokeEdgeFunction<{ templates: HairTemplate[] }>('hairstyle?list=templates', {
    method: 'GET',
  });
  return templates;
}

/**
 * Starts one hairstyle preview (2 YouCam units).
 *
 * `idempotencyKey` is a UUID generated once per Generate tap: sending the same key again returns
 * the task that tap already created instead of starting — and paying for — another.
 */
export function createHairstyleTask(input: {
  selfieUri: string;
  templateId: string;
  idempotencyKey: string;
}): Promise<HairTask> {
  const form = new FormData();
  form.append('idempotency_key', input.idempotencyKey);
  // SDK 57's fetch sends an expo-file-system File (see nail-transfer-api.ts).
  form.append('selfie', new File(input.selfieUri), 'selfie.jpg');
  form.append('template_id', input.templateId);
  return invokeEdgeFunction<HairTask>('hairstyle', { method: 'POST', body: form });
}

/** Reads the current state of a hairstyle task this guest created. Creates nothing. */
export function getHairstyleTask(taskId: string): Promise<HairTask> {
  return invokeEdgeFunction<HairTask>(`hairstyle?task_id=${encodeURIComponent(taskId)}`, { method: 'GET' });
}
