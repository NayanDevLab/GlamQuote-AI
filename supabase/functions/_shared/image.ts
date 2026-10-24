// Server-side checks against the documented AI Nail Transfer input limits
// (jpg/jpeg/png, file size < 10 MB, long side <= 4096 px). The type is read from the
// file's own bytes, never from the client-supplied name or content type.

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_IMAGE_LONG_SIDE = 4096;

export type ImageInfo = { format: 'jpeg' | 'png'; width: number; height: number };

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function readUint16(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function readUint32(bytes: Uint8Array, offset: number): number {
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
}

function inspectPng(bytes: Uint8Array): ImageInfo | null {
  // 8-byte signature, then the IHDR chunk: length(4) "IHDR"(4) width(4) height(4).
  if (bytes.length < 24 || !PNG_SIGNATURE.every((byte, index) => bytes[index] === byte)) return null;
  return { format: 'png', width: readUint32(bytes, 16), height: readUint32(bytes, 20) };
}

function inspectJpeg(bytes: Uint8Array): ImageInfo | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1];
    if (marker === 0xff) {
      offset += 1; // fill byte
      continue;
    }
    // Markers without a length field.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) {
      offset += 2;
      continue;
    }
    // Start-of-frame markers carry the dimensions (C4, C8 and CC are not frames).
    const isFrame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isFrame) {
      return { format: 'jpeg', height: readUint16(bytes, offset + 5), width: readUint16(bytes, offset + 7) };
    }
    offset += 2 + readUint16(bytes, offset + 2);
  }
  return null;
}

/** Returns the real format and pixel size, or null if the bytes are not a readable JPEG/PNG. */
export function inspectImage(bytes: Uint8Array): ImageInfo | null {
  return inspectPng(bytes) ?? inspectJpeg(bytes);
}

export type ImageLimits = { maxLongSide: number; minShortSide: number };

/** AI Nail Transfer: long side <= 4096. */
export const NAIL_TRANSFER_LIMITS: ImageLimits = { maxLongSide: MAX_IMAGE_LONG_SIDE, minShortSide: 1 };
/** AI Nail Virtual Try-On user photo: long side <= 2048, short side >= 256. */
export const NAIL_VTO_LIMITS: ImageLimits = { maxLongSide: 2048, minShortSide: 256 };

/** Returns a human-readable reason the image is unusable, or null if it meets the limits. */
export function describeImageProblem(bytes: Uint8Array, limits: ImageLimits = NAIL_TRANSFER_LIMITS): string | null {
  if (bytes.length === 0) return 'The file is empty.';
  if (bytes.length >= MAX_IMAGE_BYTES) return 'The file must be smaller than 10 MB.';
  const info = inspectImage(bytes);
  if (!info) return 'The file must be a JPEG or PNG image.';
  if (info.width < 1 || info.height < 1) return 'The image has no readable dimensions.';
  if (Math.max(info.width, info.height) > limits.maxLongSide) {
    return `The image's longest side must be ${limits.maxLongSide} px or less.`;
  }
  if (Math.min(info.width, info.height) < limits.minShortSide) {
    return `The image's shortest side must be at least ${limits.minShortSide} px.`;
  }
  return null;
}
