import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

/** A photo prepared for upload: a JPEG in the app cache, already within the provider's limits. */
export type PickedImage = { uri: string; width: number; height: number };

// The default size, for the nail features: Nail Virtual Try-On rejects photos over 1920 x 1920 px
// (its docs say 2048, but the live API answers "larger than the maximum size (1920x1920px)").
// Nail Transfer allows 4096. 1920 px keeps nail detail and uploads quickly on mobile data.
const MAX_LONG_SIDE = 1920;

/** The box a prepared photo must fit in. Aspect ratio is always preserved. */
export type Fit = {
  /** Longest side. Hairstyle Try-On, for example, accepts at most 1024 px. */
  maxLongSide?: number;
  /** Per-axis limits, for providers whose limit depends on orientation (e.g. Hair Color). */
  maxWidth?: number;
  maxHeight?: number;
};

export type PickOptions = Fit & {
  /** Open the front (selfie) camera. */
  front?: boolean;
};

/** The width to resize to so an image fits `fit`, or null if it already fits. */
function fittedWidth(width: number, height: number, fit: Fit): number | null {
  const scale = Math.min(
    1,
    (fit.maxLongSide ?? Infinity) / Math.max(width, height),
    (fit.maxWidth ?? Infinity) / width,
    (fit.maxHeight ?? Infinity) / height,
  );
  // Flooring the width keeps the proportional height within its limit too.
  return scale < 1 ? Math.floor(width * scale) : null;
}

/** Renders `uri` as a JPEG within `fit`, measuring the decoded (correctly oriented) image. */
async function renderJpeg(uri: string, fit: Fit): Promise<PickedImage> {
  const original = await ImageManipulator.manipulate(uri).renderAsync();
  const width = fittedWidth(original.width, original.height, fit);
  const rendered = width ? await ImageManipulator.manipulate(uri).resize({ width }).renderAsync() : original;
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.9 });
  return { uri: saved.uri, width: saved.width, height: saved.height };
}

export type PickOutcome =
  | { kind: 'picked'; image: PickedImage }
  | { kind: 'canceled' }
  | { kind: 'camera_denied' }
  | { kind: 'failed' };

/**
 * Re-encodes the chosen photo as a JPEG in the app cache, downscaled if needed. Re-encoding
 * also drops EXIF metadata (such as location) before anything can be uploaded.
 */
async function finish(result: ImagePicker.ImagePickerResult, fit: Fit): Promise<PickOutcome> {
  if (result.canceled || !result.assets[0]) return { kind: 'canceled' };
  try {
    return { kind: 'picked', image: await renderJpeg(result.assets[0].uri, fit) };
  } catch {
    return { kind: 'failed' };
  }
}

/** A selected photo whose file can no longer be read (e.g. the app cache was cleared). */
export class PhotoUnavailableError extends Error {
  readonly photo: 'hand' | 'reference' | 'selfie' | 'hair';

  constructor(photo: 'hand' | 'reference' | 'selfie' | 'hair') {
    super(`The ${photo} photo file is no longer available on this device.`);
    this.name = 'PhotoUnavailableError';
    this.photo = photo;
  }
}

/** Resolves true if the photo file still exists. Prepared photos live in the app cache. */
export async function isPhotoReadable(uri: string): Promise<boolean> {
  try {
    const file = new File(uri);
    return file.exists && (file.size ?? 0) > 0;
  } catch {
    return false;
  }
}

/**
 * The URI to upload for a selected photo: the photo itself if it fits, otherwise a downscaled
 * copy. Photos chosen before a limit was lowered (or for another feature) stay untouched.
 */
export async function uploadUriFor(image: PickedImage, fit: number | Fit = MAX_LONG_SIDE): Promise<string> {
  const box = typeof fit === 'number' ? { maxLongSide: fit } : fit;
  if (!fittedWidth(image.width, image.height, box)) return image.uri;
  return (await renderJpeg(image.uri, box)).uri;
}

/** Opens the system photo picker. Needs no storage permission on Android. */
export async function chooseFromGallery(fit: Fit = {}): Promise<PickOutcome> {
  try {
    return await finish(
      await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 }),
      { maxLongSide: MAX_LONG_SIDE, ...fit },
    );
  } catch {
    return { kind: 'failed' };
  }
}

/** Asks for the camera only when the user taps Take Photo. */
export async function takePhoto({ front = false, ...fit }: PickOptions = {}): Promise<PickOutcome> {
  try {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return { kind: 'camera_denied' };
    return await finish(
      await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 1,
        cameraType: front ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
      }),
      { maxLongSide: MAX_LONG_SIDE, ...fit },
    );
  } catch {
    return { kind: 'failed' };
  }
}
