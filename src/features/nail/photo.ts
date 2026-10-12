import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import type { PickedImage } from './nail-session';

// YouCam accepts a long side up to 4096 px and files under 10 MB. 2048 px keeps nail detail,
// stays far inside both limits and uploads quickly on mobile data.
const MAX_LONG_SIDE = 2048;

export type PickOutcome =
  | { kind: 'picked'; image: PickedImage }
  | { kind: 'canceled' }
  | { kind: 'camera_denied' }
  | { kind: 'failed' };

/**
 * Re-encodes the chosen photo as a JPEG in the app cache, downscaled if needed. Re-encoding
 * also drops EXIF metadata (such as location) before anything can be uploaded.
 */
async function prepare(asset: ImagePicker.ImagePickerAsset): Promise<PickedImage> {
  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > MAX_LONG_SIDE) {
    context.resize(asset.width >= asset.height ? { width: MAX_LONG_SIDE } : { height: MAX_LONG_SIDE });
  }
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.9 });
  return { uri: saved.uri, width: saved.width, height: saved.height };
}

async function finish(result: ImagePicker.ImagePickerResult): Promise<PickOutcome> {
  if (result.canceled || !result.assets[0]) return { kind: 'canceled' };
  try {
    return { kind: 'picked', image: await prepare(result.assets[0]) };
  } catch {
    return { kind: 'failed' };
  }
}

/** Opens the system photo picker. Needs no storage permission on Android. */
export async function chooseFromGallery(): Promise<PickOutcome> {
  try {
    return await finish(await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 }));
  } catch {
    return { kind: 'failed' };
  }
}

/** Asks for the camera only when the user taps Take Photo. */
export async function takePhoto(): Promise<PickOutcome> {
  try {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return { kind: 'camera_denied' };
    return await finish(await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 }));
  } catch {
    return { kind: 'failed' };
  }
}
