import type { ImageSource } from 'expo-image';
import { File } from 'expo-file-system';

import { hairStudioImages } from '@/assets/images';
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

/** A predefined YouCam hairstyle. `thumb` is YouCam's own sample image of the style or curated photography asset. */
export type HairTemplate = {
  id: string;
  title: string;
  thumb: string | ImageSource;
  category: string | null;
};

/** Curated editorial templates matching GlamQuote AI hairstyle catalogue. */
export const FALLBACK_HAIR_TEMPLATES: readonly HairTemplate[] = [
  { id: 'chin-length-bob', title: 'Chin-Length Bob', thumb: hairStudioImages.hairstyles.chinLengthBob, category: 'medium' },
  { id: 'long-soft-layers', title: 'Long Soft Layers', thumb: hairStudioImages.hairstyles.longSoftLayers, category: 'long' },
  { id: 'defined-curls', title: 'Defined Curls', thumb: hairStudioImages.hairstyles.definedCurls, category: 'curly' },
  { id: 'textured-crop', title: 'Textured Crop', thumb: hairStudioImages.hairstyles.texturedCrop, category: 'short' },
  { id: 'short-fade', title: 'Short Fade', thumb: hairStudioImages.hairstyles.shortFade, category: 'short' },
  { id: 'shoulder-locs', title: 'Shoulder Locs', thumb: hairStudioImages.hairstyles.shoulderLocs, category: 'long' },
];

export type HairTaskStatus = 'running' | 'success' | 'error';

export type HairTask = {
  taskId: string;
  status: HairTaskStatus;
  /** Present only on success. A temporary download link (about 2 hours) — never persist it. */
  resultUrl?: string;
  /** Present only on error. */
  errorCode?: string;
  /** On success: the source photo's hash (Look Battle pairing) and the validated settings. */
  sourcePhotoHash?: string | null;
  effectType?: string | null;
  config?: unknown;
};

export const HAIR_TEMPLATES_QUERY_KEY = ['hair-templates'] as const;

/** Lists YouCam's predefined hairstyles. Uses no units. */
export async function listHairTemplates(): Promise<HairTemplate[]> {
  try {
    const { templates } = await invokeEdgeFunction<{ templates: HairTemplate[] }>('hairstyle?list=templates', {
      method: 'GET',
    });
    if (templates && templates.length > 0) return templates;
  } catch {
    // Return curated editorial templates if edge function is unreachable or offline
  }
  return [...FALLBACK_HAIR_TEMPLATES];
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
