/**
 * Explore's style collection: six editorial looks (illustrative photos, not YouCam results).
 *
 * A look links to the supported style catalogue (supabase/functions/_shared/style-catalogue.ts)
 * only where a verified setup really matches it (tryOn). Other looks stay inspiration and point to
 * the studio, plus clearly labelled similar supported styles. Nothing here starts a YouCam task:
 * opening a style only preselects it, and the studio's Review + consent step comes first.
 */
import type { ImageSource } from 'expo-image';

import { exploreImages } from '@/assets/images';

export type StyleCategory = 'hair' | 'nails';

export type SampleStyle = {
  id: string;
  category: StyleCategory;
  name: string;
  description: string;
  tags: string[];
  image?: ImageSource;
  /** A verified catalogue style that matches this look, and what differs from the photo. */
  tryOn?: { styleId: string; caveat?: string };
  /** Why it can't be generated as shown (inspiration-only looks). */
  inspirationNote?: string;
  /** Supported catalogue styles that are similar, never presented as this exact look. */
  similar?: string[];
  /** Where an inspiration-only look sends you instead. */
  browse?: { label: string; href: '/hair' | '/nail' };
};

export const SAMPLE_STYLES: SampleStyle[] = [
  {
    id: 'E1',
    category: 'hair',
    name: 'Soft Twist-Out',
    description: 'Defined natural texture, easy for days',
    tags: ['Medium', 'Curly & coily', 'Low maintenance', 'Everyday'],
    image: exploreImages.styleE1,
    inspirationNote: 'YouCam has no twist-out hairstyle template, so this look is inspiration only.',
    similar: ['hairstyle.bouncy_curls', 'hairstyle.afro'],
    browse: { label: 'Explore Supported Hairstyles', href: '/hair' },
  },
  {
    id: 'E2',
    category: 'nails',
    name: 'Milky Nude Square',
    description: 'Quietly polished for office days',
    tags: ['Short', 'Square', 'Neutral', 'Low maintenance', 'Everyday'],
    image: exploreImages.styleE2,
    tryOn: {
      styleId: 'nail_polish.milk_cream',
      caveat: 'Nail Polish colors your own nails and keeps their shape, so the square shape isn’t applied.',
    },
  },
  {
    id: 'E3',
    category: 'hair',
    name: 'Textured Crop',
    description: 'Short and sharp, quick to style',
    tags: ['Short', 'Low maintenance', 'Everyday'],
    image: exploreImages.styleE3,
    tryOn: { styleId: 'hairstyle.textured_crop' },
  },
  {
    id: 'E4',
    category: 'nails',
    name: 'Plum Chrome Almond',
    description: 'A glossy statement for events',
    tags: ['Almond', 'Nail art', 'Event', 'Bold'],
    image: exploreImages.styleE4,
    tryOn: {
      styleId: 'press_on.almond_oval_1_8_plum_metallic',
      caveat: 'YouCam has no chrome finish — Metallic is the closest supported one.',
    },
  },
  {
    id: 'E5',
    category: 'hair',
    name: 'Curtain-Fringe Shag',
    description: 'Something new with movement',
    tags: ['Medium', 'Bold', 'Event'],
    image: exploreImages.styleE5,
    inspirationNote: 'YouCam has no curtain-fringe shag template, so this look is inspiration only.',
    similar: ['hairstyle.wavy_shag', 'hairstyle.curtain_wavy'],
    browse: { label: 'Explore Supported Hairstyles', href: '/hair' },
  },
  {
    id: 'E6',
    category: 'nails',
    name: 'Matte Neutral Short',
    description: 'Clean, minimal and low-fuss',
    tags: ['Short', 'Neutral', 'Low maintenance', 'Everyday'],
    image: exploreImages.styleE6,
    inspirationNote: 'There’s no verified matte taupe setup yet. You can pick Matte and your own shade in Customize My Nails.',
    similar: ['press_on.square_square_1_espresso_matte'],
    browse: { label: 'Browse Supported Nail Looks', href: '/nail' },
  },
];

export type CategoryFilter = 'all' | StyleCategory;

export const CATEGORY_FILTERS: { id: CategoryFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'hair', label: 'Hair' },
  { id: 'nails', label: 'Nails' },
];

/** Style filters describe the look, never a gender. */
export const TAG_FILTERS: Record<CategoryFilter, string[]> = {
  all: ['Low maintenance', 'Everyday', 'Event', 'Bold'],
  hair: ['Short', 'Medium', 'Curly & coily', 'Low maintenance', 'Bold'],
  nails: ['Short', 'Almond', 'Square', 'Neutral', 'Nail art'],
};

export function filterStyles(
  category: CategoryFilter,
  tag: string | null,
  query: string,
): SampleStyle[] {
  const needle = query.trim().toLowerCase();
  return SAMPLE_STYLES.filter((style) => {
    if (category !== 'all' && style.category !== category) return false;
    if (tag && !style.tags.includes(tag)) return false;
    if (!needle) return true;
    return [style.name, style.description, ...style.tags].some((text) =>
      text.toLowerCase().includes(needle),
    );
  });
}

export function findSampleStyle(id: string): SampleStyle | undefined {
  return SAMPLE_STYLES.find((style) => style.id === id);
}
