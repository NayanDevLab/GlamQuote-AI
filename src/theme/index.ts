import type { ViewStyle } from 'react-native';

import tokens from './tokens.json';

/**
 * GlamQuote Design System v1.1 colours. `tokens.json` is the single source shared with
 * `tailwind.config.js`; use these constants only where a className can't reach
 * (SVG strokes, gradients, navigator options).
 */
export const colors = {
  canvas: tokens.colors.canvas,
  card: tokens.colors.card,
  blush: tokens.colors.blush,
  plum: tokens.colors.plum.DEFAULT,
  plumPressed: tokens.colors.plum.pressed,
  plumTint: tokens.colors.plum.tint,
  champagne: tokens.colors.champagne,
  ink: tokens.colors.ink,
  muted: tokens.colors.muted,
  placeholder: tokens.colors.placeholder,
  line: tokens.colors.line.DEFAULT,
  lineStrong: tokens.colors.line.strong,
  white: '#FFFFFF',
} as const;

/** Soft tinted shadows from the design export, expressed with React Native's `boxShadow`. */
export const shadows = {
  card: { boxShadow: '0 10px 24px -18px rgba(41, 36, 42, 0.45)' },
  primary: { boxShadow: '0 10px 22px -10px rgba(112, 70, 91, 0.75)' },
  banner: { boxShadow: '0 14px 30px -20px rgba(112, 70, 91, 0.9)' },
  raised: { boxShadow: '0 12px 24px -16px rgba(41, 36, 42, 0.6)' },
  sheet: { boxShadow: '0 -12px 30px -20px rgba(41, 36, 42, 0.6)' },
} satisfies Record<string, ViewStyle>;
