/**
 * Nail Virtual Try-On customization model (YouCam AI Nail VTO, colour sub-type).
 *
 * Option lists mirror the provider's documented values; the Edge Function re-validates
 * everything, so an option missing here simply cannot be requested. Changing any setting
 * only edits a local draft — nothing is generated until the user taps Generate on Review.
 */

export type Finger = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';
export type VtoMode = 'polish' | 'press';

export const FINGERS: { id: Finger; label: string }[] = [
  { id: 'thumb', label: 'Thumb' },
  { id: 'index', label: 'Index' },
  { id: 'middle', label: 'Middle' },
  { id: 'ring', label: 'Ring' },
  { id: 'pinky', label: 'Pinky' },
];

/** Curated colours from the approved design. */
export const COLOR_PRESETS: { name: string; hex: string }[] = [
  { name: 'Plum', hex: '#6A4054' },
  { name: 'Rosewood', hex: '#A0525F' },
  { name: 'Warm Nude', hex: '#E3C2B0' },
  { name: 'Milk', hex: '#F2E8E1' },
  { name: 'Champagne', hex: '#D7AC90' },
  { name: 'Espresso', hex: '#4A3530' },
  { name: 'Sage', hex: '#8FA58E' },
  { name: 'Navy', hex: '#2E3A55' },
];

export type PolishFinish =
  | 'cream'
  | 'matte'
  | 'metallic'
  | 'jelly'
  | 'sheer'
  | 'pearl'
  | 'textured'
  | 'shimmer_fine'
  | 'shimmer_coarse';
export type PressFinish = 'matte' | 'cream' | 'metallic';

export const POLISH_FINISHES: { id: PolishFinish; label: string }[] = [
  { id: 'cream', label: 'Cream' },
  { id: 'matte', label: 'Matte' },
  { id: 'metallic', label: 'Metallic' },
  { id: 'jelly', label: 'Jelly' },
  { id: 'sheer', label: 'Sheer' },
  { id: 'pearl', label: 'Pearl' },
  { id: 'textured', label: 'Textured' },
  { id: 'shimmer_fine', label: 'Fine Shimmer' },
  { id: 'shimmer_coarse', label: 'Coarse Shimmer' },
];

/** Press-on nails support these three finishes only. */
export const PRESS_FINISHES: { id: PressFinish; label: string }[] = [
  { id: 'matte', label: 'Matte' },
  { id: 'cream', label: 'Cream' },
  { id: 'metallic', label: 'Metallic' },
];

// The provider's 15 press-on shapes are `<tip>_<base>` pairs of these values.
export type TipShape = 'square' | 'squoval' | 'oval' | 'almond' | 'stiletto';
export type BaseShape = 'oval' | 'square' | 'squoval';

export const TIP_SHAPES: { id: TipShape; label: string }[] = [
  { id: 'square', label: 'Square' },
  { id: 'squoval', label: 'Squoval' },
  { id: 'oval', label: 'Oval' },
  { id: 'almond', label: 'Almond' },
  { id: 'stiletto', label: 'Stiletto' },
];
export const BASE_SHAPES: { id: BaseShape; label: string }[] = [
  { id: 'oval', label: 'Oval' },
  { id: 'square', label: 'Square' },
  { id: 'squoval', label: 'Squoval' },
];

/** Documented length range is 0.8–2.15; these are four points inside it. */
export const LENGTH_PRESETS: { label: string; value: number }[] = [
  { label: 'Short', value: 1 },
  { label: 'Medium', value: 1.4 },
  { label: 'Long', value: 1.8 },
  { label: 'Extra Long', value: 2.15 },
];

/** Fine-tune values, all 0–100. Only the ones a finish supports are ever sent. */
export type Advanced = {
  transparency: number;
  reflection: number;
  contrast: number;
  roughness: number;
  shimmerOpacity: number;
  shimmerSize: number;
  texturedSize: number;
};
export type AdvancedKey = keyof Advanced;

const ADVANCED_LABELS: Record<AdvancedKey, string> = {
  transparency: 'Transparency',
  reflection: 'Reflection',
  contrast: 'Contrast',
  roughness: 'Roughness',
  shimmerOpacity: 'Shimmer opacity',
  shimmerSize: 'Shimmer size',
  texturedSize: 'Texture size',
};

export type PolishDraft = {
  /** True: one colour for every nail. False: `finger` is being edited on its own. */
  applyToAll: boolean;
  finger: Finger;
  colors: Record<Finger, string>;
  finish: PolishFinish;
  advanced: Advanced;
};

export type PressDraft = {
  tip: TipShape;
  base: BaseShape;
  length: number;
  color: string;
  finish: PressFinish;
  advanced: Advanced;
};

const DEFAULT_ADVANCED: Advanced = {
  transparency: 0,
  reflection: 70,
  contrast: 50,
  roughness: 50,
  shimmerOpacity: 50,
  shimmerSize: 50,
  texturedSize: 50,
};

const allFingers = (hex: string): Record<Finger, string> => ({
  thumb: hex,
  index: hex,
  middle: hex,
  ring: hex,
  pinky: hex,
});

export const DEFAULT_POLISH: PolishDraft = {
  applyToAll: true,
  finger: 'ring',
  colors: allFingers('#6A4054'),
  finish: 'metallic',
  advanced: DEFAULT_ADVANCED,
};

export const DEFAULT_PRESS: PressDraft = {
  tip: 'almond',
  base: 'oval',
  length: 1.4,
  color: '#A0525F',
  finish: 'cream',
  advanced: { ...DEFAULT_ADVANCED, reflection: 50 },
};

export function isHexColor(value: string): boolean {
  return /^#[A-Fa-f0-9]{6}$/.test(value);
}

export function colorName(hex: string): string {
  const preset = COLOR_PRESETS.find((color) => color.hex.toLowerCase() === hex.toLowerCase());
  return preset ? preset.name : `Custom ${hex.toUpperCase()}`;
}

/** The fine-tune sliders that are valid for a finish, in display order. */
export function advancedControls(mode: VtoMode, finish: PolishFinish | PressFinish): { key: AdvancedKey; label: string }[] {
  const keys: AdvancedKey[] = [];
  if (mode === 'polish') {
    if (finish !== 'metallic') keys.push('transparency');
    if (finish === 'pearl') keys.push('shimmerOpacity');
    if (finish === 'shimmer_fine' || finish === 'shimmer_coarse') keys.push('shimmerSize');
    if (finish === 'textured') keys.push('texturedSize');
  }
  keys.push('reflection', 'contrast', 'roughness');
  return keys.map((key) => ({ key, label: ADVANCED_LABELS[key] }));
}

/** The request body sent to the `nail-vto` Edge Function. */
export type NailVtoConfig = {
  effectType: 'nail_polish' | 'press_on_nails';
  effects: Record<string, string | number>[];
};

const API_NAME: Record<AdvancedKey, string> = {
  transparency: 'transparency',
  reflection: 'reflection',
  contrast: 'contrast',
  roughness: 'roughness',
  shimmerOpacity: 'shimmer_opacity',
  shimmerSize: 'shimmer_size',
  texturedSize: 'textured_size',
};

function advancedFields(mode: VtoMode, finish: PolishFinish | PressFinish, advanced: Advanced) {
  const fields: Record<string, number> = {};
  for (const { key } of advancedControls(mode, finish)) fields[API_NAME[key]] = Math.round(advanced[key]);
  return fields;
}

export function buildPolishConfig(draft: PolishDraft): NailVtoConfig {
  return {
    effectType: 'nail_polish',
    effects: FINGERS.map(({ id }) => ({
      finger: id,
      color: draft.colors[id],
      texture: draft.finish,
      ...advancedFields('polish', draft.finish, draft.advanced),
    })),
  };
}

export function buildPressConfig(draft: PressDraft): NailVtoConfig {
  return {
    effectType: 'press_on_nails',
    effects: FINGERS.map(({ id }) => ({
      finger: id,
      shape: `${draft.tip}_${draft.base}`,
      length: draft.length,
      color: draft.color,
      texture: draft.finish,
      ...advancedFields('press', draft.finish, draft.advanced),
    })),
  };
}

export type SummaryRow = { label: string; value: string };

const labelOf = <T extends string>(list: { id: T; label: string }[], id: T) =>
  list.find((item) => item.id === id)?.label ?? id;

/** Plain-language summary of a draft, shown on Review, Result and saved looks. */
export function summarizePolish(draft: PolishDraft): SummaryRow[] {
  const distinct = new Set(FINGERS.map(({ id }) => draft.colors[id].toLowerCase()));
  const rows: SummaryRow[] = [{ label: 'Nail type', value: 'Nail Polish' }];
  if (distinct.size === 1) {
    rows.push({ label: 'Color', value: colorName(draft.colors.thumb) });
  } else {
    for (const { id, label } of FINGERS) rows.push({ label, value: colorName(draft.colors[id]) });
  }
  rows.push({ label: 'Finish', value: labelOf(POLISH_FINISHES, draft.finish) });
  return rows;
}

export function summarizePress(draft: PressDraft): SummaryRow[] {
  const length = LENGTH_PRESETS.find((preset) => preset.value === draft.length)?.label ?? String(draft.length);
  return [
    { label: 'Nail type', value: 'Press-On Nails' },
    { label: 'Color', value: colorName(draft.color) },
    { label: 'Finish', value: labelOf(PRESS_FINISHES, draft.finish) },
    { label: 'Shape', value: `${labelOf(TIP_SHAPES, draft.tip)} tip · ${labelOf(BASE_SHAPES, draft.base)} base` },
    { label: 'Length', value: length },
  ];
}
