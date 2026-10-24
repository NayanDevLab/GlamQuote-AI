// Server-side validation for YouCam AI Hair Color Virtual Try-On (V1.0) requests.
//
// Verified against the official OpenAPI spec (ai_hair_color, V1.0) and the live API's own
// parameter validation on 2026-10-24. The live API checks preset names, HEX format and value
// ranges, but not palette counts or the ombre-only pattern fields, so those are enforced here.
//
// The app's request is never forwarded as-is. A preset request carries only `preset`; a custom
// request carries only `pattern` + `palettes` (the API lets a preset silently win otherwise).

export type HairColorMode = 'full' | 'ombre';

/** Documented presets, per mode (exact spelling and case). */
export const HAIR_COLOR_PRESETS: Record<HairColorMode, readonly string[]> = {
  full: [
    'Jet Black',
    'Chocolate Brown',
    'Honey Blonde',
    'Platinum Blonde',
    'Ash Gray',
    'Rose Gold',
    'Burgundy',
    'Copper Red',
    'Lavender',
    'Teal Blue',
  ],
  ombre: [
    'Dark Brown/Caramel Blonde',
    'Jet Black/Silver Gray',
    'Ash Brown/Lavender',
    'Rose Gold/Peach Blonde',
    'Burgundy/Magenta Pink',
    'Deep Blue/Teal Green',
    'Plum Purple/Pastel Lilac',
    'Copper Red/Golden Blonde',
    'Dark Gray/Ice Blonde',
    'Midnight Blue/Denim Blue',
  ],
};

const HEX_COLOR = /^#[A-Fa-f0-9]{6}$/;

type Palette = {
  color: string;
  color_intensity: number;
  shine_intensity: number;
};

/** Exactly the body fields sent to YouCam besides `src_file_id`. */
export type HairColorRequest =
  | { preset: string }
  | {
      pattern:
        | { name: 'full' }
        | {
            name: 'ombre';
            blend_strength: number;
            line_offset: number;
            coloring_section: 'top';
          };
      palettes: Palette[];
    };

export type HairColorValidation =
  { ok: true; mode: HairColorMode; request: HairColorRequest } | { ok: false; code: string; message: string };

const invalid = (code: string, message: string): HairColorValidation => ({
  ok: false,
  code,
  message,
});

function isPercent(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 100;
}

function palette(raw: unknown): Palette | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const { color, colorIntensity, shineIntensity } = raw as Record<string, unknown>;
  if (typeof color !== 'string' || !HEX_COLOR.test(color)) return null;
  if (!isPercent(colorIntensity) || !isPercent(shineIntensity)) return null;
  return {
    color: color.toUpperCase(),
    color_intensity: colorIntensity,
    shine_intensity: shineIntensity,
  };
}

/**
 * Validates the app's choice and returns the exact request to send. Accepts
 * `{ mode, preset }` or `{ mode, palettes: [{ color, colorIntensity, shineIntensity }], blendStrength?, lineOffset? }`.
 */
export function validateHairColorConfig(input: unknown): HairColorValidation {
  if (typeof input !== 'object' || input === null) return invalid('invalid_request', 'config must be an object.');
  const { mode, preset, palettes, blendStrength, lineOffset } = input as Record<string, unknown>;
  if (mode !== 'full' && mode !== 'ombre') return invalid('invalid_request', 'mode must be "full" or "ombre".');

  if (preset !== undefined) {
    if (typeof preset !== 'string' || !HAIR_COLOR_PRESETS[mode].includes(preset)) {
      return invalid('unsupported_setting', `That ${mode} preset is not available.`);
    }
    if (palettes !== undefined) return invalid('invalid_request', 'Send a preset or custom palettes, not both.');
    return { ok: true, mode, request: { preset } };
  }

  const expected = mode === 'full' ? 1 : 2;
  if (!Array.isArray(palettes) || palettes.length !== expected) {
    return invalid(
      'invalid_custom_color',
      `${mode === 'full' ? 'Full' : 'Ombre'} color needs ${expected} color${expected > 1 ? 's' : ''}.`,
    );
  }
  const built = palettes.map(palette);
  if (built.some((item) => item === null)) {
    return invalid('invalid_custom_color', 'Each color needs a 6-digit HEX code and 0–100 intensity and shine.');
  }
  const colors = built as Palette[];

  if (mode === 'full')
    return {
      ok: true,
      mode,
      request: { pattern: { name: 'full' }, palettes: colors },
    };

  if (colors[0].color === colors[1].color) {
    return invalid('invalid_custom_color', 'Choose two different colors for an ombre.');
  }
  if (!isPercent(blendStrength)) return invalid('invalid_custom_color', 'Blend strength must be 0–100.');
  if (typeof lineOffset !== 'number' || !Number.isFinite(lineOffset) || lineOffset < -0.99 || lineOffset > 0.99) {
    return invalid('invalid_custom_color', 'Blend position must be between -0.99 and 0.99.');
  }
  return {
    ok: true,
    mode,
    request: {
      pattern: {
        name: 'ombre',
        blend_strength: blendStrength,
        line_offset: Math.round(lineOffset * 100) / 100,
        coloring_section: 'top',
      },
      palettes: colors,
    },
  };
}
