import { PhotoUnavailableError } from '@/lib/photo';
import { EdgeFunctionError } from '@/lib/supabase';

/** Recovery states from the approved design (P4B-10), plus the shared generation cases. */
export type ColorErrorKind =
  | 'photo'
  | 'resolution'
  | 'shade'
  | 'custom'
  | 'content'
  | 'network'
  | 'processing'
  | 'unavailable'
  | 'limit'
  | 'timeout'
  | 'expired'
  | 'busy'
  | 'session'
  | 'photo_missing'
  | 'unexpected'
  | 'not_configured';

export type ColorErrorAction =
  'retry' | 'change_photo' | 'edit_colors' | 'use_custom' | 'use_preset' | 'studio' | 'lookbook' | 'keep_waiting';

type ColorErrorCopy = {
  tag: string;
  title: string;
  body: string;
  primary: ColorErrorAction;
  secondary: ColorErrorAction;
};

export const COLOR_ACTION_LABELS: Record<ColorErrorAction, string> = {
  retry: 'Retry',
  change_photo: 'Choose Another Photo',
  edit_colors: 'Edit Colors',
  use_custom: 'Use a Custom Color',
  use_preset: 'Use a Preset Instead',
  studio: 'Back to Hair Color Studio',
  lookbook: 'View Lookbook',
  keep_waiting: 'Keep Waiting',
};

export const COLOR_ERRORS: Record<ColorErrorKind, ColorErrorCopy> = {
  photo: {
    tag: 'Photo check',
    title: 'This photo can’t be used.',
    body: 'The file couldn’t be read or isn’t a supported photo. Choose a JPG or PNG under 10 MB — we resize it for you.',
    primary: 'change_photo',
    secondary: 'studio',
  },
  resolution: {
    tag: 'Photo too small',
    title: 'This photo is too small for a clear preview.',
    body: 'Use a photo at least 320 × 320 pixels — a recent phone photo is best. Larger photos are resized automatically.',
    primary: 'change_photo',
    secondary: 'studio',
  },
  shade: {
    tag: 'Shade unavailable',
    title: 'This shade isn’t available right now.',
    body: 'YouCam didn’t accept this preset. Your photo is kept — pick another shade or create a similar custom color.',
    primary: 'edit_colors',
    secondary: 'use_custom',
  },
  custom: {
    tag: 'Custom settings',
    title: 'Some custom settings need a fix.',
    body: 'One color or slider is outside what YouCam accepts. We kept your photo and every valid setting — check your colors.',
    primary: 'edit_colors',
    secondary: 'use_preset',
  },
  content: {
    tag: 'Image check',
    title: 'This photo can’t be processed.',
    body: 'YouCam declined the image. Try a different photo; nothing was created or saved.',
    primary: 'change_photo',
    secondary: 'studio',
  },
  network: {
    tag: 'No connection',
    title: 'You seem to be offline.',
    body: 'Check your connection, then retry. If a task was already created, we’ll pick up its result instead of starting a new one.',
    primary: 'retry',
    secondary: 'studio',
  },
  processing: {
    tag: 'Preview not created',
    title: 'Your preview didn’t come through.',
    body: 'YouCam couldn’t finish this task, so nothing was created or saved. You can retry, or adjust your colors.',
    primary: 'retry',
    secondary: 'edit_colors',
  },
  unavailable: {
    tag: 'Service busy',
    title: 'Hair color previews are briefly unavailable.',
    body: 'This is on our side, not your photo. Please try again in a few minutes — your selections are kept.',
    primary: 'retry',
    secondary: 'studio',
  },
  limit: {
    tag: 'Daily limit',
    title: 'You’ve reached today’s preview limit.',
    body: 'Your saved looks are still here, and your photo and colors stay selected for tomorrow.',
    primary: 'lookbook',
    secondary: 'studio',
  },
  timeout: {
    tag: 'Still working',
    title: 'This is taking longer than usual.',
    body: 'Your preview is still being created — nothing was lost and it won’t be requested twice. You can keep waiting or come back later.',
    primary: 'keep_waiting',
    secondary: 'studio',
  },
  expired: {
    tag: 'Preview unavailable',
    title: 'This preview is no longer available.',
    body: 'Unsaved previews are kept for a limited time. Your photo and colors are still selected if you’d like to create it again.',
    primary: 'studio',
    secondary: 'edit_colors',
  },
  busy: {
    tag: 'Preview in progress',
    title: 'A preview is already being created.',
    body: 'Only one preview is made at a time. Give it a moment, then try again.',
    primary: 'retry',
    secondary: 'studio',
  },
  session: {
    tag: 'Guest session',
    title: 'We couldn’t start your guest session.',
    body: 'Nothing was sent. Check your connection and try again.',
    primary: 'retry',
    secondary: 'studio',
  },
  photo_missing: {
    tag: 'Photo needed again',
    title: 'Please choose your photo again.',
    body: 'The copy of your photo on this phone was cleared, so nothing was sent and nothing was charged.',
    primary: 'change_photo',
    secondary: 'studio',
  },
  unexpected: {
    tag: 'Something went wrong',
    title: 'The app hit an unexpected problem.',
    body: 'This wasn’t a connection issue. Your photo and colors are kept; please try again, and tell us if it keeps happening.',
    primary: 'retry',
    secondary: 'studio',
  },
  not_configured: {
    tag: 'Not set up',
    title: 'Previews aren’t connected in this build.',
    body: 'This build has no preview service configured, so nothing was sent. Your photo and colors are kept.',
    primary: 'studio',
    secondary: 'edit_colors',
  },
};

const CODE_TO_KIND: Record<string, ColorErrorKind> = {
  // Task outcomes reported by YouCam (mapped by the Edge Function).
  invalid_image: 'photo',
  image_too_small: 'resolution',
  content_rejected: 'content',
  unsupported_setting: 'shade',
  inference_failed: 'processing',
  submit_failed: 'processing',
  provider_error: 'processing',
  expired: 'expired',
  // Request-time errors from the Edge Function.
  invalid_hair_color_image: 'photo',
  payload_too_large: 'photo',
  invalid_custom_color: 'custom',
  daily_limit: 'limit',
  task_in_progress: 'busy',
  provider_unavailable: 'unavailable',
  // Missing credits or a bad API key are ours to fix; guests just see the service as paused.
  provider_quota: 'unavailable',
  provider_misconfigured: 'unavailable',
  unauthorized: 'session',
};

/** Maps a failed task's `errorCode` to its recovery state. */
export function colorErrorKindForCode(code: string | undefined): ColorErrorKind {
  return (code && CODE_TO_KIND[code]) || 'processing';
}

/** Maps anything thrown while creating or polling a task to its recovery state. */
export function colorErrorKindForThrown(error: unknown): ColorErrorKind {
  if (error instanceof EdgeFunctionError) return colorErrorKindForCode(error.code);
  if (error instanceof PhotoUnavailableError) return 'photo_missing';
  if (error instanceof Error) {
    if (error.message.startsWith('Supabase is not configured')) return 'not_configured';
    // Only a request that never got a response is "offline".
    if (
      error.name === 'FunctionsFetchError' ||
      error.name === 'AuthRetryableFetchError' ||
      (error.name === 'TypeError' && error.message === 'Network request failed')
    ) {
      return 'network';
    }
    if (error.name.startsWith('Auth')) return 'session';
  }
  return 'unexpected';
}

/** Whether the server may already hold a task for this attempt, so Retry must reuse its key. */
export function shouldKeepColorAttempt(kind: ColorErrorKind): boolean {
  return kind === 'network' || kind === 'timeout' || kind === 'busy' || kind === 'session';
}

/** Errors caused by the photo itself: it is not offered back as "kept". */
export const PHOTO_ERRORS: readonly ColorErrorKind[] = ['photo', 'resolution', 'content', 'photo_missing'];
