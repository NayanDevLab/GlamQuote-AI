import { PhotoUnavailableError } from '@/lib/photo';
import { EdgeFunctionError } from '@/lib/supabase';

/** Recovery states from the approved design (P4A-10), plus the shared generation cases. */
export type HairErrorKind =
  | 'selfie'
  | 'multiple_faces'
  | 'head_angle'
  | 'obscured'
  | 'hair_too_short'
  | 'template'
  | 'content'
  | 'network'
  | 'processing'
  | 'unavailable'
  | 'limit'
  | 'timeout'
  | 'expired'
  | 'busy'
  | 'session'
  | 'selfie_missing'
  | 'unexpected'
  | 'not_configured';

export type HairErrorAction =
  | 'retry'
  | 'change_photo'
  | 'retake'
  | 'gallery'
  | 'change_style'
  | 'studio'
  | 'lookbook'
  | 'keep_waiting';

type HairErrorCopy = {
  tag: string;
  title: string;
  body: string;
  primary: HairErrorAction;
  secondary: HairErrorAction;
};

export const HAIR_ACTION_LABELS: Record<HairErrorAction, string> = {
  retry: 'Retry',
  change_photo: 'Change Photo',
  retake: 'Retake Photo',
  gallery: 'Choose from Gallery',
  change_style: 'Choose Another Hairstyle',
  studio: 'Back to Hair Studio',
  lookbook: 'View Lookbook',
  keep_waiting: 'Keep Waiting',
};

export const HAIR_ERRORS: Record<HairErrorKind, HairErrorCopy> = {
  selfie: {
    tag: 'Photo check',
    title: 'This photo won’t work for hair try-on.',
    body: 'Use a clear photo with your face and shoulders visible. Any common format works — we convert and resize it for you.',
    primary: 'change_photo',
    secondary: 'studio',
  },
  multiple_faces: {
    tag: 'More than one person',
    title: 'We found more than one face.',
    body: 'Hair try-on works with one person per photo. Choose or crop a photo of just you.',
    primary: 'change_photo',
    secondary: 'studio',
  },
  head_angle: {
    tag: 'Head angle',
    title: 'Try facing the camera.',
    body: 'Your head is turned or tilted too far. Look straight ahead with your head level, then take the photo again.',
    primary: 'retake',
    secondary: 'gallery',
  },
  obscured: {
    tag: 'Face or hair hidden',
    title: 'We can’t see your face or hair clearly.',
    body: 'Remove hats, sunglasses or hands, and keep your whole hairstyle in the frame.',
    primary: 'change_photo',
    secondary: 'studio',
  },
  hair_too_short: {
    tag: 'Preview not created',
    title: 'This style needs more length to work with.',
    body: 'YouCam reported that the hair in your photo is too short for this style, so nothing was created. Try a shorter hairstyle — your photo is kept.',
    primary: 'change_style',
    secondary: 'change_photo',
  },
  template: {
    tag: 'Style unavailable',
    title: 'This hairstyle isn’t available right now.',
    body: 'YouCam didn’t accept this style, so nothing was created. Pick another one from the gallery — your photo is kept.',
    primary: 'change_style',
    secondary: 'studio',
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
    body: 'Check your connection, then retry — your photo and hairstyle are kept, and retrying won’t create a second preview.',
    primary: 'retry',
    secondary: 'studio',
  },
  processing: {
    tag: 'Preview not created',
    title: 'Your preview didn’t come through.',
    body: 'YouCam couldn’t finish this task, so nothing was created or saved. You can retry, or try a different style.',
    primary: 'retry',
    secondary: 'change_style',
  },
  unavailable: {
    tag: 'Service paused',
    title: 'Hair previews are briefly unavailable.',
    body: 'The preview service isn’t available right now. Please try again in a few minutes — your choices are kept.',
    primary: 'retry',
    secondary: 'studio',
  },
  limit: {
    tag: 'Daily limit',
    title: 'You’ve reached today’s preview limit.',
    body: 'Your saved looks are still here, and your photo and hairstyle stay selected. You can create more previews tomorrow.',
    primary: 'studio',
    secondary: 'lookbook',
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
    body: 'Unsaved previews are kept for a limited time. Your photo and hairstyle are still selected if you’d like to create it again.',
    primary: 'studio',
    secondary: 'change_style',
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
  selfie_missing: {
    tag: 'Photo needed again',
    title: 'Please choose your photo again.',
    body: 'The copy of your photo on this phone was cleared, so nothing was sent and nothing was charged.',
    primary: 'change_photo',
    secondary: 'studio',
  },
  unexpected: {
    tag: 'Something went wrong',
    title: 'The app hit an unexpected problem.',
    body: 'This wasn’t a connection issue. Your photo and hairstyle are kept; please try again, and tell us if it keeps happening.',
    primary: 'retry',
    secondary: 'studio',
  },
  not_configured: {
    tag: 'Not set up',
    title: 'Previews aren’t connected in this build.',
    body: 'This build has no preview service configured, so nothing was sent. Your photo and hairstyle are kept.',
    primary: 'studio',
    secondary: 'change_style',
  },
};

const CODE_TO_KIND: Record<string, HairErrorKind> = {
  // Task outcomes reported by YouCam (mapped by the Edge Function).
  selfie_framing: 'selfie',
  face_angle: 'head_angle',
  selfie_unclear: 'obscured',
  multiple_faces: 'multiple_faces',
  hair_too_short: 'hair_too_short',
  invalid_image: 'selfie',
  content_rejected: 'content',
  inference_failed: 'processing',
  submit_failed: 'processing',
  provider_error: 'processing',
  expired: 'expired',
  // Request-time errors from the Edge Function.
  invalid_selfie_image: 'selfie',
  payload_too_large: 'selfie',
  template_unavailable: 'template',
  unsupported_setting: 'template',
  daily_limit: 'limit',
  task_in_progress: 'busy',
  provider_unavailable: 'unavailable',
  // Missing credits or a bad API key are ours to fix; guests just see the service as paused.
  provider_quota: 'unavailable',
  provider_misconfigured: 'unavailable',
  unauthorized: 'session',
};

/** Maps a failed task's `errorCode` to its recovery state. */
export function hairErrorKindForCode(code: string | undefined): HairErrorKind {
  return (code && CODE_TO_KIND[code]) || 'processing';
}

/** Maps anything thrown while creating or polling a task to its recovery state. */
export function hairErrorKindForThrown(error: unknown): HairErrorKind {
  if (error instanceof EdgeFunctionError) return hairErrorKindForCode(error.code);
  if (error instanceof PhotoUnavailableError) return 'selfie_missing';
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
export function shouldKeepHairAttempt(kind: HairErrorKind): boolean {
  return kind === 'network' || kind === 'timeout' || kind === 'busy' || kind === 'session';
}

/** Errors caused by the selfie itself: it is not offered back as "kept". */
export const SELFIE_ERRORS: readonly HairErrorKind[] = [
  'selfie',
  'multiple_faces',
  'head_angle',
  'obscured',
  'content',
  'selfie_missing',
];
