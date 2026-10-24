import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

/** A photo prepared for upload: a JPEG in the app cache, already within the provider's limits. */
export type PickedImage = { uri: string; width: number; height: number };

// The default size, for the nail features: Nail Virtual Try-On rejects photos over 1920 x 1920 px
// (its docs say 2048, but the live API answers "larger than the maximum size (1920x1920px)").
// Nail Transfer allows 4096. 1920 px keeps nail detail and uploads quickly on mobile data.
const MAX_LONG_SIDE = 1920;

export type PickOptions = {
  /** Longest side of the prepared JPEG. Hairstyle Try-On, for example, accepts at most 1024 px. */
  maxLongSide?: number;
  /** Open the front (selfie) camera. */
  front?: boolean;
};

export type PickOutcome =
  | { kind: 'picked'; image: PickedImage }
  | { kind: 'canceled' }
  | { kind: 'camera_denied' }
  | { kind: 'failed' };

/**
 * Re-encodes the chosen photo as a JPEG in the app cache, downscaled if needed. Re-encoding
 * also drops EXIF metadata (such as location) before anything can be uploaded.
 */
async function prepare(asset: ImagePicker.ImagePickerAsset, maxLongSide: number): Promise<PickedImage> {
  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > maxLongSide) {
    context.resize(asset.width >= asset.height ? { width: maxLongSide } : { height: maxLongSide });
  }
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.9 });
  return { uri: saved.uri, width: saved.width, height: saved.height };
}

async function finish(result: ImagePicker.ImagePickerResult, maxLongSide: number): Promise<PickOutcome> {
  if (result.canceled || !result.assets[0]) return { kind: 'canceled' };
  try {
    return { kind: 'picked', image: await prepare(result.assets[0], maxLongSide) };
  } catch {
    return { kind: 'failed' };
  }
}

/** A selected photo whose file can no longer be read (e.g. the app cache was cleared). */
export class PhotoUnavailableError extends Error {
  readonly photo: 'hand' | 'reference' | 'selfie';

  constructor(photo: 'hand' | 'reference' | 'selfie') {
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
 * The URI to upload for a selected photo: the photo itself if it fits within `maxLongSide`,
 * otherwise a downscaled copy. Photos chosen before a limit was lowered stay untouched.
 */
export async function uploadUriFor(image: PickedImage, maxLongSide = MAX_LONG_SIDE): Promise<string> {
  if (Math.max(image.width, image.height) <= maxLongSide) return image.uri;
  const context = ImageManipulator.manipulate(image.uri);
  context.resize(image.width >= image.height ? { width: maxLongSide } : { height: maxLongSide });
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.9 });
  return saved.uri;
}

/** Opens the system photo picker. Needs no storage permission on Android. */
export async function chooseFromGallery({ maxLongSide = MAX_LONG_SIDE }: PickOptions = {}): Promise<PickOutcome> {
  try {
    return await finish(
      await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 }),
      maxLongSide,
    );
  } catch {
    return { kind: 'failed' };
  }
}

/** Asks for the camera only when the user taps Take Photo. */
export async function takePhoto({ maxLongSide = MAX_LONG_SIDE, front = false }: PickOptions = {}): Promise<PickOutcome> {
  try {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return { kind: 'camera_denied' };
    return await finish(
      await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 1,
        cameraType: front ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
      }),
      maxLongSide,
    );
  } catch {
    return { kind: 'failed' };
  }
}
