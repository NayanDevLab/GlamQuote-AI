// GlamQuote's Look Finder catalogue — the only styles Look Finder can recommend. Shared by the
// look-finder Edge Function (allowlist sent to Gemini + response validation) and the app (cards,
// rule-based fallback and the Studio each style opens). Plain TypeScript with no imports, so both
// Deno and Metro can load it.
//
// Every entry maps to something the existing Studios really accept:
//  - Hairstyles: real YouCam AI Hairstyle V2.1 template ids (listed from the live template API).
//  - Hair Color: YouCam's documented Full and Ombre preset names, exactly as sent.
//  - Nail Polish / Press-On: colours, finishes, shapes and lengths the nail-vto validator accepts.
// Nail Transfer has no curated, licensed references yet, so it is not a recommendable style; the
// results screen links to its upload-your-own-inspiration flow instead.
//
// `tags` are GlamQuote editorial curation labels (look, how noticeable the change is, occasions).
// They are not provider facts and say nothing about upkeep — no maintenance data exists here.

export type LfCategory = 'hair' | 'nails';
export type LfOccasion = 'everyday' | 'office' | 'party' | 'new';
export type LfStyle = 'natural' | 'classic' | 'bold' | 'trendy';
export type LfChange = 'subtle' | 'moderate' | 'dramatic';
export type LfEffort = 'low' | 'flexible' | 'none';

export type StyleType = 'hairstyle' | 'hair_color_full' | 'hair_color_ombre' | 'nail_polish' | 'press_on';

export type Destination =
  | { studio: 'hairstyle'; templateId: string }
  | { studio: 'hair_color'; mode: 'full' | 'ombre'; preset: string }
  | {
      studio: 'nail_polish';
      color: string;
      finish: 'cream' | 'sheer' | 'metallic' | 'pearl' | 'matte' | 'jelly' | 'shimmer_fine';
    }
  | {
      studio: 'press_on';
      tip: 'square' | 'squoval' | 'oval' | 'almond' | 'stiletto';
      base: 'oval' | 'square' | 'squoval';
      length: 1 | 1.4 | 1.8 | 2.15;
      color: string;
      finish: 'matte' | 'cream' | 'metallic';
    };

export type CatalogueStyle = {
  id: string;
  category: LfCategory;
  type: StyleType;
  name: string;
  /** Short factual description of what the Studio will apply. */
  details: string;
  tags: { looks: LfStyle[]; change: LfChange; occasions: LfOccasion[] };
  /** Sample swatch colours for illustrations (approximate; never a result). */
  swatch?: string[];
  destination: Destination;
  enabled: boolean;
};

export const TYPE_LABEL: Record<StyleType, string> = {
  hairstyle: 'Hairstyle',
  hair_color_full: 'Hair Color · Full',
  hair_color_ombre: 'Hair Color · Ombre',
  nail_polish: 'Nail Polish',
  press_on: 'Press-On Nails',
};

const hairstyle = (
  templateId: string,
  name: string,
  details: string,
  looks: LfStyle[],
  change: LfChange,
  occasions: LfOccasion[],
): CatalogueStyle => ({
  // Named by style, not by the provider id (whose gender prefix must never reach Gemini).
  id: `hairstyle.${name.toLowerCase().replace(/\W+/g, '_')}`,
  category: 'hair',
  type: 'hairstyle',
  name,
  details: `YouCam hairstyle template — ${details}`,
  tags: { looks, change, occasions },
  destination: { studio: 'hairstyle', templateId },
  enabled: true,
});

const fullColor = (
  preset: string,
  hex: string,
  looks: LfStyle[],
  change: LfChange,
  occasions: LfOccasion[],
): CatalogueStyle => ({
  id: `hair_color_full.${preset.toLowerCase().replace(/\W+/g, '_')}`,
  category: 'hair',
  type: 'hair_color_full',
  name: preset,
  details: `YouCam Full Hair Color preset, one all-over ${preset} shade; the cut stays the same`,
  tags: { looks, change, occasions },
  swatch: [hex],
  destination: { studio: 'hair_color', mode: 'full', preset },
  enabled: true,
});

const ombre = (
  top: string,
  bottom: string,
  hexes: [string, string],
  looks: LfStyle[],
  change: LfChange,
  occasions: LfOccasion[],
): CatalogueStyle => ({
  id: `hair_color_ombre.${`${top}_${bottom}`.toLowerCase().replace(/\W+/g, '_')}`,
  category: 'hair',
  type: 'hair_color_ombre',
  name: `${top} → ${bottom}`,
  details: `YouCam Ombre preset, ${top} at the top blending into ${bottom}; the cut stays the same`,
  tags: { looks, change, occasions },
  swatch: hexes,
  destination: { studio: 'hair_color', mode: 'ombre', preset: `${top}/${bottom}` },
  enabled: true,
});

const polish = (
  colorName: string,
  color: string,
  finish: Extract<Destination, { studio: 'nail_polish' }>['finish'],
  finishLabel: string,
  looks: LfStyle[],
  change: LfChange,
  occasions: LfOccasion[],
): CatalogueStyle => ({
  id: `nail_polish.${colorName.toLowerCase().replace(/\W+/g, '_')}_${finish}`,
  category: 'nails',
  type: 'nail_polish',
  name: `${colorName} · ${finishLabel}`,
  details: `Nail polish on natural nails, ${colorName} colour with a ${finishLabel.toLowerCase()} finish on all five nails`,
  tags: { looks, change, occasions },
  swatch: [color],
  destination: { studio: 'nail_polish', color, finish },
  enabled: true,
});

const LENGTH_LABEL = { 1: 'Short', 1.4: 'Medium', 1.8: 'Long', 2.15: 'Extra Long' } as const;
const pressOn = (
  d: Extract<Destination, { studio: 'press_on' }>,
  colorName: string,
  looks: LfStyle[],
  change: LfChange,
  occasions: LfOccasion[],
): CatalogueStyle => {
  const shape = d.tip[0].toUpperCase() + d.tip.slice(1);
  const finish = d.finish[0].toUpperCase() + d.finish.slice(1);
  return {
    id: `press_on.${d.tip}_${d.base}_${String(d.length).replace('.', '_')}_${colorName.toLowerCase().replace(/\W+/g, '_')}_${d.finish}`,
    category: 'nails',
    type: 'press_on',
    name: `${LENGTH_LABEL[d.length]} ${shape} · ${colorName} ${finish}`,
    details: `Press-on nails, ${LENGTH_LABEL[d.length].toLowerCase()} length, ${d.tip} tip on a ${d.base} base, ${colorName} colour, ${d.finish} finish`,
    tags: { looks, change, occasions },
    swatch: [d.color],
    destination: d,
    enabled: true,
  };
};

export const STYLE_CATALOGUE: CatalogueStyle[] = [
  // ---- Hairstyles (real YouCam V2.1 template ids; the provider's gender categories are not used)
  hairstyle('all_gentle_waves', 'Gentle Waves', 'soft, loose waves', ['natural'], 'subtle', ['everyday', 'office']),
  hairstyle('female_long_straight', 'Long Straight', 'long, straight hair', ['natural', 'classic'], 'subtle', [
    'everyday',
    'office',
  ]),
  hairstyle('all_loose_waves', 'Loose Waves', 'relaxed, open waves', ['natural'], 'subtle', ['everyday', 'party']),
  hairstyle(
    'female_sleek_middle_part',
    'Sleek Middle Part',
    'smooth hair with a centre parting',
    ['classic'],
    'moderate',
    ['office', 'party'],
  ),
  hairstyle(
    'all_modern_mid_part_bob',
    'Modern Mid-Part Bob',
    'a bob with a centre parting',
    ['classic', 'trendy'],
    'moderate',
    ['office', 'everyday'],
  ),
  hairstyle('female_modern_wavy_lob', 'Modern Wavy Lob', 'a long bob with waves', ['trendy', 'natural'], 'moderate', [
    'everyday',
    'office',
  ]),
  hairstyle('female_casual_updo', 'Casual Updo', 'hair gathered up loosely', ['classic'], 'moderate', [
    'office',
    'party',
  ]),
  hairstyle('all_curtain_wavy', 'Curtain Wavy', 'waves with curtain bangs', ['trendy'], 'moderate', [
    'everyday',
    'party',
  ]),
  hairstyle('male_textured_crop', 'Textured Crop', 'a short, textured cut', ['natural', 'trendy'], 'moderate', [
    'everyday',
    'office',
  ]),
  hairstyle(
    'all_messy_tapered_fade',
    'Messy Tapered Fade',
    'short tousled top with tapered sides',
    ['trendy'],
    'moderate',
    ['everyday', 'new'],
  ),
  hairstyle('all_wavy_shag', 'Wavy Shag', 'a layered, wavy shag', ['trendy'], 'moderate', ['everyday', 'new']),
  hairstyle(
    'female_brunette_wolf_cut',
    'Brunette Wolf Cut',
    'a choppy, layered wolf cut',
    ['trendy', 'bold'],
    'dramatic',
    ['new', 'party'],
  ),
  hairstyle('all_pixie', 'Pixie', 'a very short pixie cut', ['bold', 'classic'], 'dramatic', ['new']),
  hairstyle('female_bouncy_curls', 'Bouncy Curls', 'full, bouncy curls', ['bold', 'trendy'], 'dramatic', [
    'party',
    'new',
  ]),
  hairstyle('female_afro', 'Afro', 'a full, rounded afro', ['bold', 'natural'], 'dramatic', ['party', 'new']),
  hairstyle(
    'all_hime_cut',
    'Hime Cut',
    'straight hair with blunt side sections and bangs',
    ['bold', 'trendy'],
    'dramatic',
    ['new', 'party'],
  ),
  hairstyle('all_split_rainbow', 'Split Rainbow', 'a two-tone rainbow-coloured style', ['bold'], 'dramatic', [
    'party',
    'new',
  ]),
  hairstyle(
    'all_high_pony_tail',
    'High Pony Tail',
    'hair pulled into a high ponytail',
    ['classic', 'trendy'],
    'moderate',
    ['party', 'everyday'],
  ),

  // ---- Full Hair Color (YouCam presets)
  fullColor('Chocolate Brown', '#4A2C21', ['natural', 'classic'], 'subtle', ['everyday', 'office']),
  fullColor('Jet Black', '#1B1718', ['classic'], 'moderate', ['office', 'everyday']),
  fullColor('Honey Blonde', '#C69257', ['natural', 'trendy'], 'moderate', ['everyday']),
  fullColor('Burgundy', '#6D1F2E', ['bold', 'classic'], 'moderate', ['party']),
  fullColor('Rose Gold', '#C98A80', ['trendy'], 'moderate', ['party', 'new']),
  fullColor('Copper Red', '#A8482A', ['bold'], 'dramatic', ['new', 'party']),
  fullColor('Ash Gray', '#9A9690', ['trendy', 'bold'], 'dramatic', ['new']),
  fullColor('Platinum Blonde', '#E3D6C1', ['bold'], 'dramatic', ['party', 'new']),
  fullColor('Lavender', '#B39CC8', ['bold', 'trendy'], 'dramatic', ['party', 'new']),
  fullColor('Teal Blue', '#2F6F7A', ['bold'], 'dramatic', ['party', 'new']),

  // ---- Ombre Hair Color (YouCam presets)
  ombre('Dark Brown', 'Caramel Blonde', ['#3B2519', '#B9844F'], ['natural', 'trendy'], 'moderate', ['everyday']),
  ombre('Rose Gold', 'Peach Blonde', ['#C98A80', '#E8B89A'], ['trendy'], 'moderate', ['party', 'everyday']),
  ombre('Ash Brown', 'Lavender', ['#6B5A50', '#B39CC8'], ['trendy'], 'moderate', ['new']),
  ombre('Copper Red', 'Golden Blonde', ['#A8482A', '#D9A54E'], ['bold'], 'dramatic', ['new']),
  ombre('Jet Black', 'Silver Gray', ['#1B1718', '#B7B6B4'], ['bold', 'trendy'], 'dramatic', ['new']),
  ombre('Dark Gray', 'Ice Blonde', ['#4A4848', '#E6E2D6'], ['trendy', 'bold'], 'dramatic', ['new']),
  ombre('Burgundy', 'Magenta Pink', ['#6D1F2E', '#C2457E'], ['bold'], 'dramatic', ['party']),
  ombre('Plum Purple', 'Pastel Lilac', ['#5B2A55', '#CDB6DA'], ['bold', 'trendy'], 'dramatic', ['party']),
  ombre('Deep Blue', 'Teal Green', ['#1F2E5A', '#2E8079'], ['bold'], 'dramatic', ['party', 'new']),
  ombre('Midnight Blue', 'Denim Blue', ['#1A2140', '#4A6A94'], ['bold'], 'dramatic', ['new']),

  // ---- Nail Polish (colours from the editor's palette; finishes the validator accepts)
  polish('Milk', '#F2E8E1', 'cream', 'Cream', ['natural', 'classic'], 'subtle', ['everyday', 'office']),
  polish('Warm Nude', '#E3C2B0', 'sheer', 'Sheer', ['natural'], 'subtle', ['everyday', 'office']),
  polish('Rosewood', '#A0525F', 'cream', 'Cream', ['classic'], 'moderate', ['office', 'everyday']),
  polish('Champagne', '#D7AC90', 'pearl', 'Pearl', ['classic', 'trendy'], 'moderate', ['party', 'office']),
  polish('Sage', '#8FA58E', 'jelly', 'Jelly', ['trendy'], 'moderate', ['new', 'everyday']),
  polish('Espresso', '#4A3530', 'matte', 'Matte', ['trendy', 'bold'], 'moderate', ['new', 'everyday']),
  polish('Plum', '#6A4054', 'metallic', 'Metallic', ['bold', 'trendy'], 'moderate', ['party']),
  polish('Navy', '#2E3A55', 'shimmer_fine', 'Fine Shimmer', ['bold'], 'dramatic', ['party']),

  // ---- Press-On Nails (shapes and lengths the validator accepts)
  pressOn(
    { studio: 'press_on', tip: 'squoval', base: 'squoval', length: 1, color: '#F2E8E1', finish: 'cream' },
    'Milk',
    ['natural', 'classic'],
    'subtle',
    ['everyday', 'office'],
  ),
  pressOn(
    { studio: 'press_on', tip: 'square', base: 'square', length: 1, color: '#4A3530', finish: 'matte' },
    'Espresso',
    ['trendy', 'classic'],
    'moderate',
    ['everyday', 'new'],
  ),
  pressOn(
    { studio: 'press_on', tip: 'almond', base: 'oval', length: 1.4, color: '#A0525F', finish: 'cream' },
    'Rosewood',
    ['classic'],
    'moderate',
    ['office', 'party'],
  ),
  pressOn(
    { studio: 'press_on', tip: 'oval', base: 'oval', length: 1.4, color: '#D7AC90', finish: 'metallic' },
    'Champagne',
    ['trendy'],
    'moderate',
    ['party'],
  ),
  pressOn(
    { studio: 'press_on', tip: 'almond', base: 'oval', length: 1.8, color: '#6A4054', finish: 'metallic' },
    'Plum',
    ['bold', 'trendy'],
    'dramatic',
    ['party'],
  ),
  pressOn(
    { studio: 'press_on', tip: 'stiletto', base: 'oval', length: 2.15, color: '#2E3A55', finish: 'matte' },
    'Navy',
    ['bold'],
    'dramatic',
    ['party', 'new'],
  ),
];

export const ENABLED_STYLES = STYLE_CATALOGUE.filter((style) => style.enabled);
export const CATALOGUE_VERSION = 'catalogue-v1';

export function findStyle(id: string): CatalogueStyle | undefined {
  return ENABLED_STYLES.find((style) => style.id === id);
}

export type LfAnswers = {
  category: LfCategory;
  occasion: LfOccasion | null;
  style: LfStyle | null;
  change: LfChange | null;
  effort: LfEffort | null;
};

/**
 * Deterministic, rule-based picks from the same catalogue (shown as "Not AI · rule-based").
 * Scores occasion, look and change tags; ties keep the catalogue's editorial order. Effort is
 * not scored because the catalogue has no maintenance data.
 */
export function ruleBasedPicks(answers: LfAnswers, count = 3): CatalogueStyle[] {
  const scored = ENABLED_STYLES.filter((style) => style.category === answers.category).map((style, order) => ({
    style,
    order,
    score:
      (answers.occasion && style.tags.occasions.includes(answers.occasion) ? 2 : 0) +
      (answers.style && style.tags.looks.includes(answers.style) ? 2 : 0) +
      (answers.change && style.tags.change === answers.change ? 1 : 0),
  }));
  return scored
    .sort((x, y) => y.score - x.score || x.order - y.order)
    .slice(0, count)
    .map((item) => item.style);
}
