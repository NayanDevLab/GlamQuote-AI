// Look Battle data: one shape for saved looks and eligible unsaved session previews, plus the
// factual "What's different" rows. Every value comes from what the server validated and sent
// to YouCam (or the saved look's own title) — nothing is inferred or invented.

import { colorName as hairColorName } from '@/features/hair-color/presets';
import type { SavedLook } from '@/features/lookbook/lookbook-api';
import {
  BASE_SHAPES,
  colorName as nailColorName,
  LENGTH_PRESETS,
  POLISH_FINISHES,
  PRESS_FINISHES,
  TIP_SHAPES,
} from '@/features/nail/vto';

export type BattleCategory = 'nails' | 'hair';
export type LookKind = SavedLook['kind'];

/** Where an unsaved preview lives on this device, so Save can update it there too. */
export type LookOrigin = 'nail' | 'hair' | 'hairColor';

export type BattleLook = {
  /** The generation task id — unique per preview, never shown in the UI. */
  key: string;
  category: BattleCategory;
  kind: LookKind;
  effectType: string | null;
  config: unknown;
  title: string;
  /** The source photo's hash: only looks sharing it can be paired. */
  photoHash: string;
  /** A genuine YouCam result: the private saved copy, or the task's temporary link. */
  imageUrl: string;
  aspectRatio: number;
  createdAt: number;
  savedLookId: string | null;
  note: string | null;
  /** The user's original photo, when it is still on this device (never uploaded or stored). */
  originalUri: string | null;
  /** How to save it if it is not saved yet. */
  save: { title: string; designSource: SavedLook['designSource']; designId?: string; origin: LookOrigin } | null;
};

export const categoryOf = (kind: LookKind): BattleCategory =>
  kind === 'hairstyle' || kind === 'hair_color' ? 'hair' : 'nails';

/** "Nail VTO · Polish", "Hair Color · Ombre", … */
export function typeLabel(look: Pick<BattleLook, 'kind' | 'effectType'>): string {
  switch (look.kind) {
    case 'nail_transfer':
      return 'Nail Transfer';
    case 'nail_vto':
      return look.effectType === 'press_on_nails' ? 'Nail VTO · Press-On' : 'Nail VTO · Polish';
    case 'hairstyle':
      return 'Hairstyle';
    case 'hair_color':
      return look.effectType === 'ombre' ? 'Hair Color · Ombre' : 'Hair Color · Full';
  }
}

export type DetailRow = { label: string; value: string };

type Json = Record<string, unknown>;
const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const unique = <T>(items: T[]) => [...new Set(items)];
const labelFor = (list: { id: string; label: string }[], id: unknown) =>
  list.find((item) => item.id === id)?.label ?? (typeof id === 'string' ? id : null);
const signed = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(2)}`;

function nailDetails(look: BattleLook): DetailRow[] {
  if (look.kind === 'nail_transfer') {
    return [
      { label: 'Nail type', value: 'Nail Transfer' },
      { label: 'Design', value: 'From your reference photo' },
    ];
  }
  const effects =
    isObject(look.config) && Array.isArray(look.config.effects) ? look.config.effects.filter(isObject) : [];
  const press = look.effectType === 'press_on_nails';
  const rows: DetailRow[] = [{ label: 'Nail type', value: press ? 'Press-On Nails' : 'Nail Polish' }];
  const colors = unique(
    effects.map((effect) => effect.color).filter((color): color is string => typeof color === 'string'),
  );
  // colorName() already returns "Custom #HEX" for unnamed colors.
  const named = (hex: string) => (nailColorName(hex).startsWith('Custom') ? hex : `${nailColorName(hex)} ${hex}`);
  if (colors.length === 1) rows.push({ label: 'Color', value: named(colors[0]) });
  else if (colors.length > 1) rows.push({ label: 'Color', value: `${colors.length} colors · ${colors.join(', ')}` });
  const finishes = unique(effects.map((effect) => labelFor(press ? PRESS_FINISHES : POLISH_FINISHES, effect.texture)));
  if (finishes.length > 0 && finishes.every(Boolean)) rows.push({ label: 'Finish', value: finishes.join(', ') });
  if (press) {
    const shapes = unique(
      effects.map((effect) => effect.shape).filter((shape): shape is string => typeof shape === 'string'),
    );
    if (shapes.length === 1) {
      const [tip, base] = shapes[0].split('_');
      rows.push({ label: 'Shape', value: `${labelFor(TIP_SHAPES, tip)} tip · ${labelFor(BASE_SHAPES, base)} base` });
    }
    const lengths = unique(
      effects.map((effect) => effect.length).filter((length): length is number => typeof length === 'number'),
    );
    if (lengths.length === 1) {
      const preset = LENGTH_PRESETS.find((item) => item.value === lengths[0]);
      rows.push({ label: 'Length', value: preset ? preset.label : `${lengths[0]}` });
    }
  }
  return rows;
}

function hairDetails(look: BattleLook): DetailRow[] {
  if (look.kind === 'hairstyle') {
    return [
      { label: 'Change', value: 'Hairstyle — changes the cut' },
      { label: 'Style', value: look.title },
    ];
  }
  const ombre = look.effectType === 'ombre';
  const rows: DetailRow[] = [
    {
      label: 'Change',
      value: ombre ? 'Hair color · Ombre — your cut stays the same' : 'Hair color · Full — your cut stays the same',
    },
  ];
  const config = isObject(look.config) ? look.config : {};
  if (typeof config.preset === 'string') {
    rows.push({ label: 'Colors', value: config.preset.replace('/', ' → ') });
    rows.push({ label: 'Preset or custom', value: 'YouCam preset' });
    rows.push({ label: 'Strength & shine', value: 'Set by the preset' });
    if (ombre) rows.push({ label: 'Blend', value: 'Set by the preset' });
    return rows;
  }
  const palettes = Array.isArray(config.palettes) ? config.palettes.filter(isObject) : [];
  const named = palettes
    .map((palette) => (typeof palette.color === 'string' ? `${hairColorName(palette.color)} ${palette.color}` : null))
    .filter(Boolean);
  if (named.length > 0) rows.push({ label: 'Colors', value: named.join(' → ') });
  rows.push({ label: 'Preset or custom', value: 'Custom' });
  const strengths = palettes
    .filter((palette) => typeof palette.color_intensity === 'number' && typeof palette.shine_intensity === 'number')
    .map((palette) => `strength ${palette.color_intensity} · shine ${palette.shine_intensity}`);
  if (strengths.length === palettes.length && strengths.length > 0) {
    rows.push({
      label: 'Strength & shine',
      value: strengths.length === 2 ? `Top ${strengths[0]}; bottom ${strengths[1]}` : strengths[0],
    });
  }
  const pattern = isObject(config.pattern) ? config.pattern : {};
  if (ombre && typeof pattern.line_offset === 'number' && typeof pattern.blend_strength === 'number') {
    rows.push({
      label: 'Blend',
      value: `Position ${signed(pattern.line_offset)} · strength ${pattern.blend_strength}`,
    });
  }
  return rows;
}

/** The look's own settings, as shown on its card and the Favorite screen. */
export function lookDetails(look: BattleLook): DetailRow[] {
  return look.category === 'nails' ? nailDetails(look) : hairDetails(look);
}

/**
 * "What's different" between two looks: every row either look has; "—" where a row isn't part
 * of one look. Rows that apply to neither are never shown.
 */
export function comparisonRows(
  a: BattleLook,
  b: BattleLook,
): { label: string; a: string; b: string; differs: boolean }[] {
  const rowsA = lookDetails(a);
  const rowsB = lookDetails(b);
  const labels = unique([...rowsA, ...rowsB].map((row) => row.label));
  return labels.map((label) => {
    const valueA = rowsA.find((row) => row.label === label)?.value ?? '—';
    const valueB = rowsB.find((row) => row.label === label)?.value ?? '—';
    return { label, a: valueA, b: valueB, differs: valueA !== valueB };
  });
}

export type PhotoGroup = { photoHash: string; looks: BattleLook[]; newest: number; originalUri: string | null };

/** Looks of one category, grouped by source photo, newest group first and newest look first. */
export function groupByPhoto(looks: BattleLook[], category: BattleCategory): PhotoGroup[] {
  const groups = new Map<string, BattleLook[]>();
  for (const look of looks) {
    if (look.category !== category) continue;
    groups.set(look.photoHash, [...(groups.get(look.photoHash) ?? []), look]);
  }
  return [...groups.entries()]
    .map(([photoHash, items]) => {
      const sorted = [...items].sort((x, y) => y.createdAt - x.createdAt);
      return {
        photoHash,
        looks: sorted,
        newest: sorted[0].createdAt,
        originalUri: sorted.find((look) => look.originalUri)?.originalUri ?? null,
      };
    })
    .sort((x, y) => y.newest - x.newest);
}

/** Whether two looks may be compared: different results, same category and same source photo. */
export function canPair(a: BattleLook | undefined, b: BattleLook | undefined): boolean {
  return Boolean(a && b && a.key !== b.key && a.category === b.category && a.photoHash === b.photoHash);
}
