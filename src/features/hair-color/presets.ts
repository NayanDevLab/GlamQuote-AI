// Hair Color presets, drafts and request builders.
//
// Preset names are YouCam's documented values (sent exactly as written). Swatch HEX values are
// GlamQuote approximations from the approved design, used only for sample swatches — YouCam
// renders the real preset. Custom defaults are GlamQuote's (the API defines none).

export type HairColorMode = 'full' | 'ombre';
export type ColorSource = 'preset' | 'custom';

type Swatch = { name: string; hex: string };

export const FULL_PRESETS: readonly Swatch[] = [
  { name: 'Jet Black', hex: '#1B1718' },
  { name: 'Chocolate Brown', hex: '#4A2C21' },
  { name: 'Honey Blonde', hex: '#C69257' },
  { name: 'Platinum Blonde', hex: '#E3D6C1' },
  { name: 'Ash Gray', hex: '#9A9690' },
  { name: 'Rose Gold', hex: '#C98A80' },
  { name: 'Burgundy', hex: '#6D1F2E' },
  { name: 'Copper Red', hex: '#A8482A' },
  { name: 'Lavender', hex: '#B39CC8' },
  { name: 'Teal Blue', hex: '#2F6F7A' },
];

/** Ombre presets: YouCam's value is `${top.name}/${bottom.name}`. */
export const OMBRE_PRESETS: readonly { top: Swatch; bottom: Swatch }[] = [
  {
    top: { name: 'Dark Brown', hex: '#3B2519' },
    bottom: { name: 'Caramel Blonde', hex: '#B9844F' },
  },
  {
    top: { name: 'Jet Black', hex: '#1B1718' },
    bottom: { name: 'Silver Gray', hex: '#B7B6B4' },
  },
  {
    top: { name: 'Ash Brown', hex: '#6B5A50' },
    bottom: { name: 'Lavender', hex: '#B39CC8' },
  },
  {
    top: { name: 'Rose Gold', hex: '#C98A80' },
    bottom: { name: 'Peach Blonde', hex: '#E8B89A' },
  },
  {
    top: { name: 'Burgundy', hex: '#6D1F2E' },
    bottom: { name: 'Magenta Pink', hex: '#C2457E' },
  },
  {
    top: { name: 'Deep Blue', hex: '#1F2E5A' },
    bottom: { name: 'Teal Green', hex: '#2E8079' },
  },
  {
    top: { name: 'Plum Purple', hex: '#5B2A55' },
    bottom: { name: 'Pastel Lilac', hex: '#CDB6DA' },
  },
  {
    top: { name: 'Copper Red', hex: '#A8482A' },
    bottom: { name: 'Golden Blonde', hex: '#D9A54E' },
  },
  {
    top: { name: 'Dark Gray', hex: '#4A4848' },
    bottom: { name: 'Ice Blonde', hex: '#E6E2D6' },
  },
  {
    top: { name: 'Midnight Blue', hex: '#1A2140' },
    bottom: { name: 'Denim Blue', hex: '#4A6A94' },
  },
];

export const ombrePresetName = (index: number) =>
  `${OMBRE_PRESETS[index].top.name}/${OMBRE_PRESETS[index].bottom.name}`;

/** Curated starting points for a custom full color. */
export const FULL_QUICK_PICKS: readonly Swatch[] = [
  { name: 'Espresso', hex: '#2B1B17' },
  { name: 'Mocha', hex: '#5A3A2C' },
  { name: 'Chestnut', hex: '#7B3F24' },
  { name: 'Caramel', hex: '#B9844F' },
  { name: 'Golden Wheat', hex: '#D2A766' },
  { name: 'Strawberry', hex: '#C46A4E' },
  { name: 'Mulberry', hex: '#6E2D4B' },
  { name: 'Rose Quartz', hex: '#D49A9C' },
  { name: 'Smoky Lilac', hex: '#9C8AB0' },
  { name: 'Silver Mist', hex: '#B8B6B2' },
];

export const OMBRE_TOP_PICKS: readonly Swatch[] = [
  { name: 'Soft Black', hex: '#1B1718' },
  { name: 'Dark Brown', hex: '#3B2519' },
  { name: 'Ash Brown', hex: '#6B5A50' },
  { name: 'Burgundy', hex: '#6D1F2E' },
  { name: 'Plum', hex: '#5B2A55' },
  { name: 'Midnight', hex: '#1A2140' },
];

export const OMBRE_BOTTOM_PICKS: readonly Swatch[] = [
  { name: 'Caramel', hex: '#B9844F' },
  { name: 'Golden Blonde', hex: '#D9A54E' },
  { name: 'Ice Blonde', hex: '#E6E2D6' },
  { name: 'Peach', hex: '#E8B89A' },
  { name: 'Magenta', hex: '#C2457E' },
  { name: 'Lavender', hex: '#B39CC8' },
];

export const HEX_COLOR = /^#[A-Fa-f0-9]{6}$/;

/** A friendly name for a custom HEX: a curated pick's name, or "Custom". */
export function colorName(
  hex: string,
  picks: readonly Swatch[] = [...FULL_QUICK_PICKS, ...OMBRE_TOP_PICKS, ...OMBRE_BOTTOM_PICKS],
) {
  return picks.find((pick) => pick.hex.toUpperCase() === hex.toUpperCase())?.name ?? 'Custom';
}

// Hue and depth only help pick a HEX value; they are never sent to YouCam.
export function hslToHex(hue: number, saturation: number, lightness: number): string {
  const s = saturation / 100;
  const l = lightness / 100;
  const k = (n: number) => (n + hue / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const x = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${x(f(0))}${x(f(8))}${x(f(4))}`.toUpperCase();
}

export function hexToHueDepth(hex: string): { hue: number; depth: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let hue = 0;
  if (d) {
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue = Math.round(hue * 60);
    if (hue < 0) hue += 360;
  }
  return {
    hue,
    depth: Math.max(8, Math.min(88, Math.round(((max + min) / 2) * 100))),
  };
}

export type FullDraft = {
  source: ColorSource;
  presetIndex: number;
  hex: string;
  intensity: number;
  shine: number;
};

export type OmbreDraft = {
  source: ColorSource;
  presetIndex: number;
  top: string;
  bottom: string;
  /** -99…99 in the editor; sent as line_offset / 100. */
  offset: number;
  blend: number;
  topIntensity: number;
  topShine: number;
  bottomIntensity: number;
  bottomShine: number;
};

export const DEFAULT_FULL: FullDraft = {
  source: 'preset',
  presetIndex: 2,
  hex: '#6E2D4B',
  intensity: 70,
  shine: 40,
};

export const DEFAULT_OMBRE: OmbreDraft = {
  source: 'preset',
  presetIndex: 0,
  top: '#3B2519',
  bottom: '#B9844F',
  offset: 20,
  blend: 60,
  topIntensity: 80,
  topShine: 40,
  bottomIntensity: 75,
  bottomShine: 50,
};

/** What the hair-color Edge Function accepts (it rebuilds the YouCam request from this). */
export type HairColorConfig =
  | { mode: HairColorMode; preset: string }
  | {
      mode: HairColorMode;
      palettes: {
        color: string;
        colorIntensity: number;
        shineIntensity: number;
      }[];
      blendStrength?: number;
      lineOffset?: number;
    };

export type SummaryRow = { label: string; value: string };

/** One generation's color choice, snapshotted when Generate is tapped. */
export type ColorChoice = {
  mode: HairColorMode;
  source: ColorSource;
  name: string;
  /** Sample swatch colors (top first); never shown as a result. */
  swatch: string[];
  config: HairColorConfig;
  summary: SummaryRow[];
};

const signed = (value: number) => `${value > 0 ? '+' : ''}${(value / 100).toFixed(2)}`;

export function fullChoice(draft: FullDraft): ColorChoice {
  if (draft.source === 'preset') {
    const preset = FULL_PRESETS[draft.presetIndex];
    return {
      mode: 'full',
      source: 'preset',
      name: preset.name,
      swatch: [preset.hex],
      config: { mode: 'full', preset: preset.name },
      summary: [
        { label: 'Mode', value: 'Full Hair Color · Preset' },
        { label: 'Shade', value: preset.name },
        { label: 'Intensity & shine', value: 'Set by the YouCam preset' },
      ],
    };
  }
  const name = colorName(draft.hex, FULL_QUICK_PICKS);
  return {
    mode: 'full',
    source: 'custom',
    name: name === 'Custom' ? `Custom ${draft.hex}` : name,
    swatch: [draft.hex],
    config: {
      mode: 'full',
      palettes: [
        {
          color: draft.hex,
          colorIntensity: draft.intensity,
          shineIntensity: draft.shine,
        },
      ],
    },
    summary: [
      { label: 'Mode', value: 'Full Hair Color · Custom' },
      { label: 'Shade', value: `${name} · ${draft.hex}` },
      { label: 'Color strength', value: String(draft.intensity) },
      { label: 'Shine', value: String(draft.shine) },
    ],
  };
}

/** Null while the custom ombre is not sendable (both colors must differ). */
export function ombreChoice(draft: OmbreDraft): ColorChoice | null {
  if (draft.source === 'preset') {
    const { top, bottom } = OMBRE_PRESETS[draft.presetIndex];
    return {
      mode: 'ombre',
      source: 'preset',
      name: `${top.name} → ${bottom.name}`,
      swatch: [top.hex, bottom.hex],
      config: { mode: 'ombre', preset: ombrePresetName(draft.presetIndex) },
      summary: [
        { label: 'Mode', value: 'Ombre Hair Color · Preset' },
        { label: 'Top', value: top.name },
        { label: 'Bottom', value: bottom.name },
        { label: 'Blend & split', value: 'Set by the YouCam preset' },
      ],
    };
  }
  if (draft.top.toUpperCase() === draft.bottom.toUpperCase()) return null;
  const topName = colorName(draft.top);
  const bottomName = colorName(draft.bottom);
  return {
    mode: 'ombre',
    source: 'custom',
    name: `${topName} → ${bottomName}`,
    swatch: [draft.top, draft.bottom],
    config: {
      mode: 'ombre',
      palettes: [
        {
          color: draft.top,
          colorIntensity: draft.topIntensity,
          shineIntensity: draft.topShine,
        },
        {
          color: draft.bottom,
          colorIntensity: draft.bottomIntensity,
          shineIntensity: draft.bottomShine,
        },
      ],
      blendStrength: draft.blend,
      lineOffset: draft.offset / 100,
    },
    summary: [
      { label: 'Mode', value: 'Ombre Hair Color · Custom' },
      {
        label: 'Top',
        value: `${topName} ${draft.top} · strength ${draft.topIntensity} · shine ${draft.topShine}`,
      },
      {
        label: 'Bottom',
        value: `${bottomName} ${draft.bottom} · strength ${draft.bottomIntensity} · shine ${draft.bottomShine}`,
      },
      { label: 'Blend position', value: signed(draft.offset) },
      { label: 'Blend strength', value: String(draft.blend) },
    ],
  };
}

export const offsetLabel = (offset: number) =>
  Math.abs(offset) < 10
    ? `Even split · ${signed(offset)}`
    : `${offset > 0 ? 'More top color' : 'More bottom color'} · ${signed(offset)}`;
