/**
 * DEMO / SAMPLE — the six placeholder styles from the design export (ExploreBody.tsx).
 *
 * These exist only so the Explore shell, its filters and its search can be exercised.
 * They are not provider-verified styles and must not start a YouCam task. The real
 * catalogue (current provider template IDs and validated references) replaces this file.
 */
export type StyleCategory = 'hair' | 'nails';

export type SampleStyle = {
  id: string;
  category: StyleCategory;
  name: string;
  description: string;
  tags: string[];
};

export const SAMPLE_STYLES: SampleStyle[] = [
  {
    id: 'E1',
    category: 'hair',
    name: 'Soft Twist-Out',
    description: 'Defined natural texture, easy for days',
    tags: ['Medium', 'Curly & coily', 'Low maintenance', 'Everyday'],
  },
  {
    id: 'E2',
    category: 'nails',
    name: 'Milky Nude Square',
    description: 'Quietly polished for office days',
    tags: ['Short', 'Square', 'Neutral', 'Low maintenance', 'Everyday'],
  },
  {
    id: 'E3',
    category: 'hair',
    name: 'Textured Crop',
    description: 'Short and sharp, quick to style',
    tags: ['Short', 'Low maintenance', 'Everyday'],
  },
  {
    id: 'E4',
    category: 'nails',
    name: 'Plum Chrome Almond',
    description: 'A glossy statement for events',
    tags: ['Almond', 'Nail art', 'Event', 'Bold'],
  },
  {
    id: 'E5',
    category: 'hair',
    name: 'Curtain-Fringe Shag',
    description: 'Something new with movement',
    tags: ['Medium', 'Bold', 'Event'],
  },
  {
    id: 'E6',
    category: 'nails',
    name: 'Matte Neutral Short',
    description: 'Clean, minimal and low-fuss',
    tags: ['Short', 'Neutral', 'Low maintenance', 'Everyday'],
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
