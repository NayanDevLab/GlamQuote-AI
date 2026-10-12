import type { ReactNode } from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '@/theme';

// Path data copied from the design export's inline SVGs (24×24 grid, round caps and joins).
const ICONS = {
  home: <Path d="M3.5 10.5 12 4l8.5 6.5V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z" />,
  compass: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="m15.5 8.5-2 5-5 2 2-5z" />
    </>
  ),
  bookmark: <Path d="M6.5 3.5h11a1 1 0 0 1 1 1V21L12 16.8 5.5 21V4.5a1 1 0 0 1 1-1z" />,
  bookmarkPlus: (
    <>
      <Path d="M6.5 3.5h11a1 1 0 0 1 1 1V21L12 16.8 5.5 21V4.5a1 1 0 0 1 1-1z" />
      <Path d="M12 8v5M9.5 10.5h5" />
    </>
  ),
  help: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M9.6 9.3a2.5 2.5 0 0 1 4.8.9c0 1.7-2.4 2.2-2.4 3.6" />
      <Circle cx={12} cy={17} r={0.6} fill="currentColor" />
    </>
  ),
  user: (
    <>
      <Circle cx={12} cy={8.5} r={3.8} />
      <Path d="M4.5 20c1.3-3.6 4.2-5.5 7.5-5.5s6.2 1.9 7.5 5.5" />
    </>
  ),
  scanFace: (
    <>
      <Path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16" />
      <Circle cx={12} cy={11} r={3} />
      <Path d="M8 17c.9-1.6 2.3-2.4 4-2.4s3.1.8 4 2.4" />
    </>
  ),
  arrowRight: <Path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <Path d="M19 12H5M11 6l-6 6 6 6" />,
  check: <Path d="m5 12.5 4.5 4.5L19 7.5" />,
  checkCircle: (
    <>
      <Circle cx={12} cy={12} r={8.5} />
      <Path d="m8 12.3 2.8 2.8L16.2 9.5" />
    </>
  ),
  camera: (
    <>
      <Path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z" />
      <Circle cx={12} cy={13} r={3.2} />
    </>
  ),
  search: (
    <>
      <Circle cx={11} cy={11} r={6.5} />
      <Path d="m20 20-4.2-4.2" />
    </>
  ),
  makeup: (
    <>
      <Path d="M9 21h6v-8H9z" />
      <Path d="M10 13V8.5L14 5v8" />
      <Path d="M8 21h8" />
    </>
  ),
  beard: (
    <>
      <Path d="M6 9c0-3.5 2.7-6 6-6s6 2.5 6 6" />
      <Path d="M6 9v3c0 5 2.8 9 6 9s6-4 6-9V9" />
      <Path d="M6 12c2 1 3.5 1.2 6 1.2s4-.2 6-1.2" />
      <Path d="M10 16.5h4" />
    </>
  ),
  lock: (
    <>
      <Rect x={5} y={11} width={14} height={9} rx={2} />
      <Path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  close: <Path d="M6 6l12 12M18 6 6 18" />,
  info: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 11v5M12 8h.01" />
    </>
  ),
  sparkle: <Path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z" />,
  star: <Path d="M12 2l2 7 7 3-7 3-2 7-2-7-7-3 7-3z" />,
  compare: <Path d="m9 7-5 5 5 5M15 7l5 5-5 5" />,
  image: (
    <>
      <Rect x={4} y={5} width={16} height={14} rx={2} />
      <Circle cx={9} cy={10} r={1.5} />
      <Path d="m20 15-4-4-8 8" />
    </>
  ),
  upload: <Path d="M12 16V5M7 9l5-5 5 5M5 19h14" />,
  chevronRight: <Path d="m9 6 6 6-6 6" />,
  clock: (
    <>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3 2" />
    </>
  ),
  trash: <Path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof ICONS;

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** Solid glyph (active Lookbook tab, sparkles) instead of the default outline. */
  filled?: boolean;
};

/** Decorative by default: label the pressable that contains the icon, not the icon itself. */
export function Icon({
  name,
  size = 22,
  color = colors.ink,
  strokeWidth = 1.8,
  filled = false,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      color={color}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round">
      {ICONS[name]}
    </Svg>
  );
}
