import { useId, type ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

// The design's two placeholder washes: warm for nails, cool for hair.
const TONES = {
  warm: ['#F4E6DB', '#DDBFAA', '#B48A72'],
  cool: ['#EFE2D8', '#CDB1A2', '#8F6C5F'],
} as const;

type PhotoSlotProps = {
  tone?: keyof typeof TONES;
  /** Horizontal position of the highlight, 0–1 (the design uses 0.3, mirrored to 0.7 for "after" slots). */
  focusX?: number;
  className?: string;
  style?: ViewStyle;
  children?: ReactNode;
};

/**
 * Placeholder for editorial photography that has not been supplied yet. It reproduces the
 * design's warm radial wash and is hidden from screen readers — it is never an AI result.
 */
export function PhotoSlot({ tone = 'warm', focusX = 0.3, className = '', style, children }: PhotoSlotProps) {
  const gradientId = `slot${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [from, mid, to] = TONES[tone];
  // CSS `radial-gradient(120% 90% at X 20%)`: a 120%-wide radius squashed to 90% of the height.
  const squash = `translate(${focusX} 0.2) scale(1 0.75) translate(${-focusX} -0.2)`;
  return (
    <View className={`overflow-hidden ${className}`} style={style}>
      <View
        style={StyleSheet.absoluteFill}
        aria-hidden>
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient
              id={gradientId}
              cx={focusX}
              cy={0.2}
              fx={focusX}
              fy={0.2}
              r={1.2}
              gradientTransform={squash}>
              <Stop offset="0" stopColor={from} />
              <Stop offset="0.55" stopColor={mid} />
              <Stop offset="1" stopColor={to} />
            </RadialGradient>
          </Defs>
          <Rect width="100%" height="100%" fill={`url(#${gradientId})`} />
        </Svg>
      </View>
      {children}
    </View>
  );
}
