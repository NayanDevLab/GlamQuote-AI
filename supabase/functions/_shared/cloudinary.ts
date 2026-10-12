// Minimal Cloudinary adapter for privately stored saved looks.
//
// Verified against the official docs on 2026-10-12:
//   https://cloudinary.com/documentation/authentication_signatures  (signed uploads)
//   https://cloudinary.com/documentation/delivery_url_signatures    (signed delivery URLs)
//   https://cloudinary.com/documentation/control_access_to_media    (`authenticated` type)
//
// Assets are uploaded with `type: authenticated`, so neither the original nor any derived
// version can be fetched without a URL signed with the API secret. Plain TypeScript with no
// runtime-specific APIs. Never logs the secret or signed URLs.

export type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string };

export type CloudinaryAsset = { publicId: string; format: string; width: number | null; height: number | null };

async function sha1(text: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text)));
}

/** Upload API signature: params sorted by name, joined `k=v&k=v`, secret appended, SHA-1 hex. */
export async function signUploadParams(params: Record<string, string>, apiSecret: string): Promise<string> {
  const serialized = Object.keys(params)
    .sort()
    .map((name) => `${name}=${params[name]}`)
    .join('&');
  return Array.from(await sha1(serialized + apiSecret), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/** Delivery signature: first 8 chars of the URL-safe base64 SHA-1 of the signed path + secret. */
export async function signDeliveryPath(path: string, apiSecret: string): Promise<string> {
  const base64 = btoa(String.fromCharCode(...(await sha1(path + apiSecret))));
  return base64.replaceAll('+', '-').replaceAll('/', '_').slice(0, 8);
}

export function createCloudinaryClient(config: CloudinaryConfig) {
  /** Stores one private image. A repeat with the same publicId replaces it. */
  async function uploadPrivateImage(input: {
    publicId: string;
    bytes: Uint8Array<ArrayBuffer>;
    contentType: string;
  }): Promise<CloudinaryAsset> {
    const params = {
      overwrite: 'true',
      public_id: input.publicId,
      timestamp: String(Math.floor(Date.now() / 1000)),
      type: 'authenticated',
    };
    const form = new FormData();
    for (const [name, value] of Object.entries(params)) form.append(name, value);
    form.append('api_key', config.apiKey);
    form.append('signature', await signUploadParams(params, config.apiSecret));
    form.append('file', new Blob([input.bytes], { type: input.contentType }));

    const response = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
      method: 'POST',
      body: form,
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) throw new Error(`Cloudinary upload failed with HTTP ${response.status}.`);
    const body: unknown = await response.json();
    if (typeof body !== 'object' || body === null) throw new Error('Cloudinary returned an unexpected response.');
    const asset = body as Record<string, unknown>;
    if (typeof asset.public_id !== 'string' || typeof asset.format !== 'string') {
      throw new Error('Cloudinary returned no public_id.');
    }
    return {
      publicId: asset.public_id,
      format: asset.format,
      width: typeof asset.width === 'number' ? asset.width : null,
      height: typeof asset.height === 'number' ? asset.height : null,
    };
  }

  /** Signed URL for the original image. Only ever returned to the look's owner. */
  async function signedImageUrl(publicId: string, format: string): Promise<string> {
    const path = `${publicId}.${format}`;
    const signature = await signDeliveryPath(path, config.apiSecret);
    return `https://res.cloudinary.com/${config.cloudName}/image/authenticated/s--${signature}--/${path}`;
  }

  return { uploadPrivateImage, signedImageUrl };
}
