import { Image } from 'expo-image';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { colors } from '@/theme';

import { ACTION_LABELS, NAIL_ERRORS, type NailErrorAction, type NailErrorKind } from './errors';
import type { PickedImage } from './nail-session';
import type { TipShape } from './vto';

const STEPS = ['Photo', 'Design', 'Review'] as const;

/** Back button plus the Photo → Design → Review progress used by the three input screens. */
export function FlowHeader({ step }: { step: 1 | 2 | 3 }) {
  return (
    <View className="h-12 flex-row items-center pl-2 pr-5">
      <IconButton icon="arrowLeft" label="Back" strokeWidth={1.8} onPress={() => router.back()} />
      <View
        accessible
        accessibilityLabel={`Step ${step} of 3: ${STEPS[step - 1]}`}
        className="flex-1 flex-row items-center gap-2 pl-1">
        {STEPS.map((label, index) => {
          const position = index + 1;
          const done = position < step;
          const current = position === step;
          return (
            <View key={label} className="flex-row items-center gap-2">
              {index > 0 ? <View className="h-px w-3 bg-champagne" /> : null}
              <View
                className={`h-[22px] w-[22px] items-center justify-center rounded-full ${
                  current ? 'bg-plum' : done ? 'bg-blush' : 'border border-line-strong'
                }`}>
                {done ? (
                  <Icon name="check" size={12} color={colors.plum} strokeWidth={2.4} />
                ) : (
                  <Text
                    className={`font-sans-semibold text-[12px] leading-[15px] ${
                      current ? 'text-white' : 'text-muted'
                    }`}>
                    {position}
                  </Text>
                )}
              </View>
              <Text
                className={`text-body-s ${
                  current ? 'font-sans-semibold text-plum' : 'font-sans-medium text-muted'
                }`}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** Sticky action bar pinned above the bottom safe area; content scrolls behind it. */
export function FooterBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{ paddingBottom: insets.bottom + 12 }}
      className="gap-2.5 border-t border-line bg-canvas px-5 pt-3">
      {children}
    </View>
  );
}

/** Rounded photo thumbnail of something the user picked. */
export function Thumb({ image, size = 56 }: { image: PickedImage; size?: number }) {
  return (
    <Image
      source={{ uri: image.uri }}
      contentFit="cover"
      style={{ width: size, height: size, borderRadius: 12, backgroundColor: colors.blush }}
    />
  );
}

// Sample nails: longer, rounder tips for almond and stiletto. An illustration only.
const TIP_STYLE: Record<TipShape, { radius: number; height: number }> = {
  square: { radius: 4, height: 46 },
  squoval: { radius: 10, height: 46 },
  oval: { radius: 16, height: 48 },
  almond: { radius: 16, height: 56 },
  stiletto: { radius: 16, height: 64 },
};

/**
 * Five illustrated nails showing the chosen colours (thumb to pinky). This is a swatch of the
 * user's choices — never a generated preview — and is always labelled as sample styling.
 */
export function NailSwatches({
  colors: swatches,
  tip = 'oval',
  compact = false,
}: {
  colors: string[];
  tip?: TipShape;
  /** Narrower nails for half-width placements such as the Review tile. */
  compact?: boolean;
}) {
  const { radius, height } = TIP_STYLE[tip];
  const nailWidth = compact ? 20 : 30;
  return (
    <View
      accessible
      accessibilityLabel="Sample styling of your color choices. Not your photo."
      className={`items-center gap-3 rounded-lg bg-blush pb-3 pt-5 ${compact ? 'px-2' : 'px-4'}`}>
      <View className={`h-16 flex-row items-end ${compact ? 'gap-1.5' : 'gap-3'}`}>
        {swatches.map((hex, index) => (
          <View
            key={index}
            style={{
              backgroundColor: hex,
              height: index === 0 ? height - 6 : height,
              width: index === 0 ? nailWidth + 4 : nailWidth,
              borderTopLeftRadius: radius,
              borderTopRightRadius: radius,
              borderBottomLeftRadius: 9,
              borderBottomRightRadius: 9,
              boxShadow: '0 4px 8px -4px rgba(41, 36, 42, 0.5)',
            }}
            className="overflow-hidden border border-canvas/60">
            <View className="ml-1.5 mt-2 h-5 w-1 rounded-full bg-white/35" />
          </View>
        ))}
      </View>
      <Text className="text-center font-sans-semibold text-caption text-muted">
        Sample styling · not your photo
      </Text>
    </View>
  );
}

type NailErrorStateProps = {
  kind: NailErrorKind;
  onAction: (action: NailErrorAction) => void;
  hand?: PickedImage | null;
  designImage?: PickedImage | null;
  /** Nail VTO: the design step is the customization editor. */
  custom?: boolean;
};

/**
 * One reusable recovery state: what happened, what was kept, and two next steps. It is never
 * shown in place of a result and never says a preview exists when the task failed.
 */
export function NailErrorState({ kind, onAction, hand, designImage, custom = false }: NailErrorStateProps) {
  const labelFor = (action: NailErrorAction) =>
    custom && action === 'change_design' ? 'Change Customization' : ACTION_LABELS[action];
  const copy = NAIL_ERRORS[kind];
  // An input that caused the error is not offered back as "kept".
  const keptHand = kind !== 'hand' && kind !== 'photo' ? hand : null;
  const keptDesign = kind !== 'reference' ? designImage : null;
  const showStudioLink = copy.primary !== 'studio' && copy.secondary !== 'studio';

  return (
    <View className="flex-1 justify-center gap-5 px-5">
      <View className="gap-3">
        <Text className="font-sans-semibold text-overline uppercase text-plum">{copy.tag}</Text>
        <Text
          accessibilityRole="header"
          accessibilityLiveRegion="polite"
          className="font-serif text-title-lg text-ink">
          {copy.title}
        </Text>
        <Text className="font-sans text-body-l text-muted">{copy.body}</Text>
      </View>

      {keptHand || keptDesign ? (
        <View className="gap-2.5 rounded-lg border border-blush bg-card p-3.5">
          <Text className="font-sans-semibold text-overline uppercase text-muted">Kept for you</Text>
          <View className="flex-row gap-4">
            {keptHand ? (
              <View className="flex-row items-center gap-2.5">
                <Thumb image={keptHand} size={48} />
                <Text className="font-sans-medium text-body-s text-ink">Your hand</Text>
              </View>
            ) : null}
            {keptDesign ? (
              <View className="flex-row items-center gap-2.5">
                <Thumb image={keptDesign} size={48} />
                <Text className="font-sans-medium text-body-s text-ink">Your design</Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      <View className="gap-2.5">
        <Button label={labelFor(copy.primary)} onPress={() => onAction(copy.primary)} />
        <Button
          label={labelFor(copy.secondary)}
          variant="secondary"
          onPress={() => onAction(copy.secondary)}
        />
        {showStudioLink ? (
          <Text
            accessibilityRole="button"
            onPress={() => onAction('studio')}
            className="self-center px-4 py-3 font-sans-semibold text-label text-plum">
            Back to Nail Studio
          </Text>
        ) : null}
      </View>
    </View>
  );
}
