import { useId } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { ClipPath, Defs, Ellipse, G, Line, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Thumb } from '@/components/ui/thumb';
import type { PickedImage } from '@/lib/photo';
import { colors } from '@/theme';

import { COLOR_ACTION_LABELS, COLOR_ERRORS, PHOTO_ERRORS, type ColorErrorAction, type ColorErrorKind } from './errors';
import type { ColorChoice } from './presets';

export const COLOR_STEPS = ['Photo', 'Color', 'Review'] as const;

const gradientId = (raw: string) => `g${raw.replace(/[^a-zA-Z0-9]/g, '')}`;

/**
 * Hair fill: a solid color, or top → bottom for an ombre meeting at `split` (0–1). With `span`,
 * the gradient runs over those y coordinates so every hair path shares one blend.
 */
function HairPaint({
  id,
  swatch,
  split = 0.55,
  softness = 0.2,
  span,
}: {
  id: string;
  swatch: string[];
  split?: number;
  softness?: number;
  span?: [number, number];
}) {
  const [top, bottom = top] = swatch;
  return (
    <LinearGradient
      id={id}
      x1="0"
      x2="0"
      {...(span ? { y1: span[0], y2: span[1], gradientUnits: 'userSpaceOnUse' as const } : { y1: '0', y2: '1' })}>
      <Stop offset="0" stopColor={top} />
      <Stop offset={Math.max(0, split - softness / 2)} stopColor={top} />
      <Stop offset={Math.min(1, split + softness / 2)} stopColor={bottom} />
      <Stop offset="1" stopColor={bottom} />
    </LinearGradient>
  );
}

/**
 * A long-haired sample model (design symbol hcModel) wearing a color choice. Always an
 * illustration of the choice — never the user's photo or a generated result.
 */
export function ColorModel({
  swatch,
  width,
  height,
  split,
  softness,
}: {
  swatch: string[];
  width: number;
  height: number;
  split?: number;
  softness?: number;
}) {
  const id = gradientId(useId());
  return (
    <Svg width={width} height={height} viewBox="0 0 160 200" aria-hidden>
      <Defs>
        {/* The hair runs from y≈40 (crown) to y≈182 (ends) in the model's 160×200 box. */}
        <HairPaint id={id} swatch={swatch} split={split} softness={softness} span={[40, 182]} />
      </Defs>
      <Path d="M12 200 C16 170 46 152 80 152 C114 152 144 170 148 200Z" fill="#29242A" />
      <Path
        d="M44 92 C42 54 60 40 80 40 C102 40 118 54 116 92 L122 176 C110 182 98 176 94 166 L66 166 C62 176 50 182 38 176Z"
        fill={`url(#${id})`}
      />
      <Path
        d="M46 100 C44 130 42 152 41 172 M114 100 C116 130 118 152 119 172 M53 112 C52 136 52 150 53 164 M107 112 C108 136 108 150 107 164"
        stroke="#FFFFFF"
        strokeOpacity={0.22}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
      <Rect x={69} y={118} width={22} height={38} rx={10} fill="#7A4C33" />
      <Ellipse cx={80} cy={92} rx={26} ry={33} fill="#8D5A3E" />
      <Path
        d="M52 88 C54 58 68 48 80 48 C76 62 66 76 52 88Z M80 48 C94 50 108 62 108 88 C100 72 90 60 80 48Z"
        fill={`url(#${id})`}
      />
      <Path
        d="M60 62 C66 54 72 50 79 49"
        stroke="#FFFFFF"
        strokeOpacity={0.3}
        strokeWidth={2}
        fill="none"
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Curly sample model (design symbol hcCurls) for the studio hero. */
export function CurlsModel({ color, width, height }: { color: string; width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 200" aria-hidden>
      <Path d="M12 200 C16 170 46 152 80 152 C114 152 144 170 148 200Z" fill="#5E5259" />
      <Path
        d="M38 98 C28 80 34 54 52 46 C58 30 102 30 108 46 C126 54 132 80 122 98 C128 114 118 132 104 130 L56 130 C42 132 32 114 38 98Z"
        fill={color}
      />
      <Path
        d="M44 74 C40 84 42 96 46 104 M116 74 C120 84 118 96 114 104 M60 40 C68 36 76 35 84 36"
        stroke="#FFFFFF"
        strokeOpacity={0.24}
        strokeWidth={2.2}
        fill="none"
        strokeLinecap="round"
      />
      <Rect x={69} y={118} width={22} height={38} rx={10} fill="#D1A88E" />
      <Ellipse cx={80} cy={94} rx={26} ry={32} fill="#E3BFA6" />
      <Path
        d="M50 82 C46 64 58 54 66 58 C68 46 84 44 88 54 C96 46 110 54 108 66 C116 70 112 82 108 82 C96 70 64 70 50 82Z"
        fill={color}
      />
    </Svg>
  );
}

/** A hair-lock swatch: the color with a soft sheen and strands. Two colors make an ombre lock. */
export function HairSwatch({
  swatch,
  width,
  height,
  radius = 16,
}: {
  swatch: string[];
  width: number;
  height: number;
  radius?: number;
}) {
  const id = gradientId(useId());
  const strands = Array.from({ length: Math.floor(width / 5) }, (_, index) => index * 5 + 2);
  return (
    <Svg width={width} height={height} aria-hidden>
      <Defs>
        <HairPaint id={`${id}h`} swatch={swatch} split={0.53} softness={0.3} />
        <LinearGradient id={`${id}s`} x1="0" y1="0" x2="1" y2="0.35">
          <Stop offset="0.28" stopColor="#FFFFFF" stopOpacity={0} />
          <Stop offset="0.46" stopColor="#FFFFFF" stopOpacity={0.3} />
          <Stop offset="0.62" stopColor="#FFFFFF" stopOpacity={0} />
        </LinearGradient>
        <LinearGradient id={`${id}d`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0.55" stopColor="#000000" stopOpacity={0} />
          <Stop offset="1" stopColor="#000000" stopOpacity={0.2} />
        </LinearGradient>
        <ClipPath id={`${id}c`}>
          <Rect width={width} height={height} rx={radius} />
        </ClipPath>
      </Defs>
      {/* Clipped so the strands stay inside the rounded lock. */}
      <G clipPath={`url(#${id}c)`}>
        <Rect width={width} height={height} rx={radius} fill={`url(#${id}h)`} />
        {strands.map((x) => (
          <Line key={x} x1={x} y1={0} x2={x} y2={height} stroke="#000000" strokeOpacity={0.09} strokeWidth={1} />
        ))}
        <Rect width={width} height={height} rx={radius} fill={`url(#${id}s)`} />
        <Rect width={width} height={height} rx={radius} fill={`url(#${id}d)`} />
      </G>
    </Svg>
  );
}

/** A selectable swatch tile with a caption, as in the preset and quick-pick grids. */
export function SwatchTile({
  swatch,
  label,
  sublabel,
  selected,
  onPress,
  size,
  hideLabel = false,
}: {
  swatch: string[];
  label: string;
  sublabel?: string;
  selected: boolean;
  onPress: () => void;
  size: number;
  /** Small swatch rows (e.g. ombre quick picks) show color only; the name stays accessible. */
  hideLabel?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={sublabel ? `${label} to ${sublabel}` : label}
      onPress={onPress}
      style={{ width: size }}
      className="items-center gap-1.5">
      <View
        style={{ borderRadius: 18, padding: 2 }}
        className={selected ? 'border-2 border-plum' : 'border-2 border-transparent'}>
        <HairSwatch swatch={swatch} width={size - 8} height={Math.round((size - 8) * 0.95)} radius={14} />
        {selected ? (
          <View className="absolute right-1 top-1 h-6 w-6 items-center justify-center rounded-full bg-plum">
            <Icon name="check" size={13} color={colors.white} strokeWidth={2.6} />
          </View>
        ) : null}
      </View>
      {hideLabel ? null : (
        // 12px so a single long name (e.g. "Strawberry") fits a fifth of the row without breaking.
        <Text numberOfLines={2} className="text-center font-sans-medium text-[12px] leading-[15px] text-ink">
          {label}
        </Text>
      )}
      {sublabel && !hideLabel ? (
        <Text numberOfLines={2} className="-mt-1 text-center font-sans text-[12px] leading-[15px] text-muted">
          → {sublabel}
        </Text>
      ) : null}
    </Pressable>
  );
}

/** The small "Sample color — not applied to your photo" pill used on editor heroes. */
export function SampleNote({ text = 'Sample color — not yet applied to your photo.' }: { text?: string }) {
  return (
    <View className="absolute bottom-3 left-3 right-3 flex-row items-center gap-1.5 rounded-full bg-canvas/95 px-3 py-1.5">
      <Icon name="info" size={13} color={colors.ink} strokeWidth={2} />
      <Text className="flex-1 font-sans-semibold text-caption text-ink">{text}</Text>
    </View>
  );
}

type ColorErrorStateProps = {
  kind: ColorErrorKind;
  onAction: (action: ColorErrorAction) => void;
  photo?: PickedImage | null;
  choice?: ColorChoice | null;
};

/**
 * One reusable recovery state (P4B-10): what happened, what was kept, and two next steps. It is
 * never shown in place of a result and never says a preview exists when the task failed.
 */
export function ColorErrorState({ kind, onAction, photo, choice }: ColorErrorStateProps) {
  const copy = COLOR_ERRORS[kind];
  // An input that caused the error is not offered back as "kept".
  const keptPhoto = PHOTO_ERRORS.includes(kind) ? null : photo;
  const keptChoice = kind === 'shade' ? null : choice;
  const showStudioLink = copy.primary !== 'studio' && copy.secondary !== 'studio';

  return (
    <View className="flex-1 justify-center gap-5 px-5">
      <View className="gap-3">
        <Text className="font-sans-semibold text-overline uppercase text-plum">{copy.tag}</Text>
        <Text accessibilityRole="header" accessibilityLiveRegion="polite" className="font-serif text-title-lg text-ink">
          {copy.title}
        </Text>
        <Text className="font-sans text-body-l text-muted">{copy.body}</Text>
      </View>

      {keptPhoto || keptChoice ? (
        <View className="gap-2.5 rounded-lg border border-blush bg-card p-3.5">
          <Text className="font-sans-semibold text-overline uppercase text-muted">Kept for you</Text>
          <View className="flex-row flex-wrap gap-4">
            {keptPhoto ? (
              <View className="flex-row items-center gap-2.5">
                <Thumb uri={keptPhoto.uri} size={48} />
                <Text className="font-sans-medium text-body-s text-ink">Your photo</Text>
              </View>
            ) : null}
            {keptChoice ? (
              <View className="flex-row items-center gap-2.5">
                <HairSwatch swatch={keptChoice.swatch} width={40} height={48} radius={12} />
                <Text numberOfLines={1} className="max-w-[150px] font-sans-medium text-body-s text-ink">
                  {keptChoice.name}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      <View className="gap-2.5">
        <Button label={COLOR_ACTION_LABELS[copy.primary]} onPress={() => onAction(copy.primary)} />
        <Button
          label={COLOR_ACTION_LABELS[copy.secondary]}
          variant="secondary"
          onPress={() => onAction(copy.secondary)}
        />
        {showStudioLink ? (
          <Text
            accessibilityRole="button"
            onPress={() => onAction('studio')}
            className="self-center px-4 py-3 font-sans-semibold text-label text-plum">
            Back to Hair Color Studio
          </Text>
        ) : null}
      </View>
    </View>
  );
}
