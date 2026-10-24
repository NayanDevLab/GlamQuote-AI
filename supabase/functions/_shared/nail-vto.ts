// Server-side validation for YouCam AI Nail Virtual Try-On requests.
//
// Verified against the official OpenAPI spec (ai_nail_vto, V1.0) and against the live API's
// own parameter validation on 2026-10-12. Only the colour sub-type is supported here; the
// design sub-type needs per-nail PNG artwork to the provider's template and is not offered.
//
// The app's request is never forwarded as-is: each effect is rebuilt from validated fields,
// so an unsupported option is rejected rather than silently replaced or passed through.

export type NailVtoEffectType = 'nail_polish' | 'press_on_nails';

export const FINGERS = ['thumb', 'index', 'middle', 'ring', 'pinky'] as const;

// Which extra properties each nail-polish texture requires (0–100 integers).
const POLISH_TEXTURE_EXTRAS: Record<string, readonly string[]> = {
  matte: ['transparency'],
  cream: ['transparency'],
  jelly: ['transparency'],
  sheer: ['transparency'],
  metallic: [],
  pearl: ['transparency', 'shimmer_opacity'],
  shimmer_coarse: ['transparency', 'shimmer_size'],
  shimmer_fine: ['transparency', 'shimmer_size'],
  textured: ['transparency', 'textured_size'],
};

const PRESS_ON_TEXTURES = ['matte', 'cream', 'metallic'];
const PRESS_ON_SHAPES = ['square', 'squoval', 'oval', 'almond', 'stiletto'].flatMap((tip) =>
  ['oval', 'square', 'squoval'].map((base) => `${tip}_${base}`),
);
const PRESS_ON_MIN_LENGTH = 0.8;
const PRESS_ON_MAX_LENGTH = 2.15;
const HEX_COLOR = /^#[A-Fa-f0-9]{6}$/;

export type NailVtoRequest = { effectType: NailVtoEffectType; effects: Record<string, unknown>[] };

export type NailVtoValidation = { ok: true; request: NailVtoRequest } | { ok: false; code: string; message: string };

const invalid = (code: string, message: string): NailVtoValidation => ({ ok: false, code, message });

function isPercent(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100;
}

/** Validates the app's customization and returns the exact effects to send to YouCam. */
export function validateNailVtoConfig(input: unknown): NailVtoValidation {
  if (typeof input !== 'object' || input === null) return invalid('invalid_request', 'config must be an object.');
  const { effectType, effects } = input as Record<string, unknown>;
  if (effectType !== 'nail_polish' && effectType !== 'press_on_nails') {
    return invalid('invalid_request', 'effectType must be "nail_polish" or "press_on_nails".');
  }
  if (!Array.isArray(effects) || effects.length < 1 || effects.length > FINGERS.length) {
    return invalid('invalid_request', 'effects must list one to five fingers.');
  }

  const seen = new Set<string>();
  const built: Record<string, unknown>[] = [];
  for (const raw of effects) {
    if (typeof raw !== 'object' || raw === null) return invalid('invalid_request', 'Each effect must be an object.');
    const effect = raw as Record<string, unknown>;
    const { finger, color, texture } = effect;

    if (typeof finger !== 'string' || !(FINGERS as readonly string[]).includes(finger) || seen.has(finger)) {
      return invalid('invalid_request', 'Each effect needs a distinct finger: thumb, index, middle, ring or pinky.');
    }
    seen.add(finger);
    if (typeof color !== 'string' || !HEX_COLOR.test(color)) {
      return invalid('invalid_color', 'Colors must be six-digit HEX values such as #70465B.');
    }
    for (const name of ['reflection', 'contrast', 'roughness']) {
      if (!isPercent(effect[name])) return invalid('unsupported_setting', `${name} must be a whole number from 0 to 100.`);
    }
    const common = {
      sub_type: 'color',
      finger,
      color: color.toUpperCase(),
      texture,
      reflection: effect.reflection,
      contrast: effect.contrast,
      roughness: effect.roughness,
    };

    if (effectType === 'nail_polish') {
      const extras = typeof texture === 'string' ? POLISH_TEXTURE_EXTRAS[texture] : undefined;
      if (!extras) return invalid('unsupported_setting', 'That finish is not supported for nail polish.');
      const extraValues: Record<string, number> = {};
      for (const name of extras) {
        const value = effect[name];
        if (!isPercent(value)) return invalid('unsupported_setting', `${name} must be a whole number from 0 to 100.`);
        extraValues[name] = value;
      }
      built.push({ ...common, ...extraValues });
    } else {
      if (typeof texture !== 'string' || !PRESS_ON_TEXTURES.includes(texture)) {
        return invalid('unsupported_setting', 'Press-on nails support Matte, Cream and Metallic finishes only.');
      }
      const { shape, length } = effect;
      if (typeof shape !== 'string' || !PRESS_ON_SHAPES.includes(shape)) {
        return invalid('unsupported_shape', 'That press-on shape is not supported.');
      }
      if (typeof length !== 'number' || !(length >= PRESS_ON_MIN_LENGTH && length <= PRESS_ON_MAX_LENGTH)) {
        return invalid('unsupported_shape', `Press-on length must be between ${PRESS_ON_MIN_LENGTH} and ${PRESS_ON_MAX_LENGTH}.`);
      }
      built.push({ ...common, shape, length: Math.round(length * 100) / 100 });
    }
  }
  return { ok: true, request: { effectType, effects: built } };
}
