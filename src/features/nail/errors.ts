import { EdgeFunctionError } from '@/lib/supabase';

import { PhotoUnavailableError } from './photo';

/** Recovery states from the approved design (NailErrors-Catalog), plus the cases it left out. */
export type NailErrorKind =
  | 'hand'
  | 'nails_small'
  | 'setting'
  | 'photo'
  | 'reference'
  | 'content'
  | 'network'
  | 'processing'
  | 'unavailable'
  | 'limit'
  | 'timeout'
  | 'expired'
  | 'busy'
  | 'session'
  | 'not_configured'
  | 'hand_missing'
  | 'reference_missing'
  | 'unexpected';

export type NailErrorAction = 'retry' | 'change_photo' | 'change_design' | 'studio' | 'keep_waiting';

type NailErrorCopy = {
  tag: string;
  title: string;
  body: string;
  primary: NailErrorAction;
  secondary: NailErrorAction;
};

export const ACTION_LABELS: Record<NailErrorAction, string> = {
  retry: 'Retry',
  change_photo: 'Change Photo',
  change_design: 'Choose Another Design',
  studio: 'Back to Nail Studio',
  keep_waiting: 'Keep Waiting',
};

export const NAIL_ERRORS: Record<NailErrorKind, NailErrorCopy> = {
  hand: {
    tag: 'Photo check',
    title: 'We couldn’t find your nails in this photo.',
    body: 'Try a well-lit photo with one hand flat and all five nails visible. Your design is still selected.',
    primary: 'change_photo',
    secondary: 'change_design',
  },
  nails_small: {
    tag: 'Photo check',
    title: 'Your nails look too small in this photo.',
    body: 'Move closer so your hand fills at least half the frame, with every nail in view. Your customization is kept.',
    primary: 'change_photo',
    secondary: 'change_design',
  },
  setting: {
    tag: 'Setting not supported',
    title: 'This combination isn’t supported.',
    body: 'YouCam didn’t accept one of these settings, so nothing was created. Adjust your customization and try again — your photo is kept.',
    primary: 'change_design',
    secondary: 'studio',
  },
  photo: {
    tag: 'Photo check',
    title: 'This photo can’t be used.',
    body: 'YouCam needs a JPEG or PNG under 10 MB, no larger than 1920 px and at least 256 px on its shorter side. Nothing was created. Choose the photo again or pick another — your choices are kept.',
    primary: 'change_photo',
    secondary: 'studio',
  },
  reference: {
    tag: 'Reference check',
    title: 'This reference image won’t work.',
    body: 'Use a clear close-up of nails as a JPEG or PNG under 10 MB — no text, logos or other people’s faces.',
    primary: 'change_design',
    secondary: 'change_photo',
  },
  content: {
    tag: 'Image check',
    title: 'These images can’t be processed.',
    body: 'YouCam declined one of the images. Try a different photo or reference; nothing was created or saved.',
    primary: 'change_photo',
    secondary: 'change_design',
  },
  network: {
    tag: 'No connection',
    title: 'You seem to be offline.',
    body: 'Check your connection, then retry — your photo and design are kept, and retrying won’t create a second preview.',
    primary: 'retry',
    secondary: 'studio',
  },
  processing: {
    tag: 'Preview not created',
    title: 'The preview didn’t come through.',
    body: 'YouCam couldn’t finish this preview, so no result was created or saved. If retrying fails again, try a different photo.',
    primary: 'retry',
    secondary: 'change_design',
  },
  unavailable: {
    tag: 'Service paused',
    title: 'Nail previews are briefly unavailable.',
    body: 'The preview service isn’t available right now. Please try again in a few minutes — your choices are kept.',
    primary: 'retry',
    secondary: 'studio',
  },
  limit: {
    tag: 'Daily limit',
    title: 'You’ve reached today’s preview limit.',
    body: 'Your saved looks are still here, and your photo and design stay selected. You can create more previews tomorrow.',
    primary: 'studio',
    secondary: 'change_design',
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
    body: 'Unsaved previews are kept for a limited time. Your photo and design are still selected if you’d like to create it again.',
    primary: 'studio',
    secondary: 'change_design',
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
  hand_missing: {
    tag: 'Photo needed again',
    title: 'Please choose your hand photo again.',
    body: 'The copy of your photo on this phone was cleared, so nothing was sent and nothing was charged.',
    primary: 'change_photo',
    secondary: 'studio',
  },
  reference_missing: {
    tag: 'Design needed again',
    title: 'Please choose your nail design again.',
    body: 'The copy of your reference photo on this phone was cleared, so nothing was sent and nothing was charged.',
    primary: 'change_design',
    secondary: 'studio',
  },
  unexpected: {
    tag: 'Something went wrong',
    title: 'The app hit an unexpected problem.',
    body: 'This wasn’t a connection issue. Your photo and choices are kept; please try again, and tell us if it keeps happening.',
    primary: 'retry',
    secondary: 'studio',
  },
  not_configured: {
    tag: 'Not set up',
    title: 'Previews aren’t connected in this build.',
    body: 'This build has no preview service configured, so nothing was sent. Your photo and choices are kept.',
    primary: 'studio',
    secondary: 'change_design',
  },
};

const CODE_TO_KIND: Record<string, NailErrorKind> = {
  // Task outcomes reported by YouCam.
  no_hand_detected: 'hand',
  nail_too_small: 'nails_small',
  unsupported_setting: 'setting',
  unsupported_shape: 'setting',
  invalid_color: 'setting',
  invalid_image: 'photo',
  content_rejected: 'content',
  inference_failed: 'processing',
  submit_failed: 'processing',
  provider_error: 'processing',
  expired: 'expired',
  // Request-time errors from the Edge Function.
  invalid_hand_image: 'photo',
  invalid_reference_image: 'reference',
  payload_too_large: 'photo',
  daily_limit: 'limit',
  task_in_progress: 'busy',
  provider_unavailable: 'unavailable',
  // Missing credits or a bad API key are ours to fix; guests just see the service as paused.
  provider_quota: 'unavailable',
  provider_misconfigured: 'unavailable',
  unauthorized: 'session',
};

/** Maps a failed task's `errorCode` to its recovery state. */
export function errorKindForCode(code: string | undefined): NailErrorKind {
  return (code && CODE_TO_KIND[code]) || 'processing';
}

/** Maps anything thrown while creating or polling a task to its recovery state. */
export function errorKindForThrown(error: unknown): NailErrorKind {
  if (error instanceof EdgeFunctionError) return errorKindForCode(error.code);
  if (error instanceof PhotoUnavailableError) return error.photo === 'hand' ? 'hand_missing' : 'reference_missing';
  if (error instanceof Error) {
    if (error.message.startsWith('Supabase is not configured')) return 'not_configured';
    // Only a request that never got a response is "offline". A plain TypeError is usually a bug,
    // except React Native's own fetch failure message.
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
export function shouldKeepAttempt(kind: NailErrorKind): boolean {
  return kind === 'network' || kind === 'timeout' || kind === 'busy' || kind === 'session';
}
