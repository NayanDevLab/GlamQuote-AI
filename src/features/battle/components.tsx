import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Sheet } from '@/components/ui/sheet';
import { Thumb } from '@/components/ui/thumb';
import { colors, shadows } from '@/theme';

import { typeLabel, type BattleLook } from './looks';

const TUTORIAL_STEPS = [
  'Pick two generated looks.',
  'Compare the details side by side.',
  'Choose a favorite or ask AI for guidance.',
];

/** P5A-2 — first-time tutorial; replayed from the ? on every Look Battle screen. */
export function BattleTutorial({
  visible,
  onClose,
  onStart,
}: {
  visible: boolean;
  onClose: () => void;
  onStart?: () => void;
}) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      eyebrow="Look Battle · First time"
      title={
        <>
          How to Compare <Text className="font-serif-italic text-plum">Looks</Text>
        </>
      }>
      <View aria-hidden className="flex-row items-center justify-center gap-3 py-1">
        {['A', 'B'].map((letter, index) => (
          <View key={letter} className="flex-row items-center gap-3">
            {index > 0 ? <Text className="font-serif-italic text-[18px] text-plum">vs</Text> : null}
            <View className="h-16 w-14 items-center justify-center rounded-[14px] border border-champagne bg-blush">
              <Text className="font-sans-bold text-label text-plum">{letter}</Text>
            </View>
          </View>
        ))}
      </View>
      <View className="gap-3 rounded-[22px] border border-blush bg-card p-3">
        {TUTORIAL_STEPS.map((step, index) => (
          <View key={step} className="flex-row items-center gap-3">
            <View
              className={`h-8 w-8 items-center justify-center rounded-full ${index === 0 ? 'bg-plum' : 'bg-blush'}`}>
              <Text
                className={`font-serif-italic text-[18px] leading-[22px] ${index === 0 ? 'text-white' : 'text-plum'}`}>
                {index + 1}
              </Text>
            </View>
            <Text className="flex-1 font-sans text-body-m text-ink">{step}</Text>
          </View>
        ))}
      </View>
      <Text className="font-sans text-caption text-muted">
        Only previews from the same photo are paired. Replay this anytime from the ? at the top.
      </Text>
      <Button
        label="Let’s Compare"
        onPress={() => {
          onClose();
          onStart?.();
        }}
      />
      <Text
        accessibilityRole="button"
        onPress={onClose}
        className="self-center px-4 py-2 font-sans-semibold text-label text-plum">
        Skip Tutorial
      </Text>
    </Sheet>
  );
}

/** Back if there is a screen to return to, otherwise to the parent Look Battle screen. */
export function goBack(parent: Href = '/battle') {
  if (router.canGoBack()) router.back();
  else router.replace(parent);
}

/** Header: back, an overline title, and the tutorial ?. */
export function BattleHeader({
  title,
  onHelp,
  backLabel = 'Back',
  parent,
}: {
  title: string;
  onHelp: () => void;
  backLabel?: string;
  /** Where Back goes when this screen was opened directly (e.g. after an app restart). */
  parent?: Href;
}) {
  return (
    <View className="h-12 flex-row items-center justify-between px-2">
      <IconButton icon="arrowLeft" label={backLabel} strokeWidth={1.8} onPress={() => goBack(parent)} />
      <Text className="font-sans-semibold text-overline uppercase text-muted">{title}</Text>
      <IconButton icon="help" label="How Look Battle works — replay tutorial" onPress={onHelp} />
    </View>
  );
}

/** A genuine YouCam result image, always labelled as an AI preview. */
export function LookImage({
  look,
  aspectRatio,
  children,
}: {
  look: BattleLook;
  aspectRatio?: number;
  children?: ReactNode;
}) {
  return (
    <View className="overflow-hidden rounded-[18px] bg-blush">
      <Image
        source={{ uri: look.imageUrl }}
        contentFit="cover"
        cachePolicy="memory-disk"
        accessibilityLabel={`AI preview by YouCam: ${look.title}`}
        style={{ width: '100%', aspectRatio: aspectRatio ?? 0.85, backgroundColor: colors.blush }}
      />
      <View className="absolute bottom-2 left-2 rounded-full bg-canvas/95 px-2 py-[3px]">
        <Text className="font-sans-semibold text-[11px] leading-[14px] text-ink">{'AI Preview'}</Text>
      </View>
      {children}
    </View>
  );
}

export function TypeChip({ look }: { look: BattleLook }) {
  return (
    <View className="self-start rounded-full bg-blush px-2 py-0.5">
      <Text numberOfLines={1} className="font-sans-semibold text-[11px] leading-[15px] text-plum">
        {typeLabel(look)}
      </Text>
    </View>
  );
}

export function SavedStatus({ look }: { look: BattleLook }) {
  return look.savedLookId ? (
    <View className="flex-row items-center gap-1">
      <Icon name="bookmark" size={12} color={colors.plum} filled />
      <Text className="font-sans-medium text-caption text-ink">Saved</Text>
    </View>
  ) : (
    <View className="flex-row items-center gap-1">
      <View className="h-3 w-3 rounded-full border border-muted" />
      <Text className="font-sans text-caption text-muted">This session · not saved</Text>
    </View>
  );
}

/** "Original · Not AI" row for the photo both looks came from, when it is still on this device. */
export function OriginalRow({ uri, subtitle }: { uri: string | null; subtitle: string }) {
  return (
    <View
      accessible
      accessibilityLabel={uri ? 'Original photo, not AI-generated' : undefined}
      className="flex-row items-center gap-3 rounded-lg border border-blush bg-card p-2.5">
      {uri ? (
        <Thumb uri={uri} size={40} />
      ) : (
        <View className="h-10 w-10 items-center justify-center rounded-[12px] bg-blush">
          <Icon name="image" size={18} color={colors.muted} />
        </View>
      )}
      <Text className="flex-1 font-sans text-body-s text-ink">
        <Text className="font-sans-semibold">Original</Text> · {subtitle}
      </Text>
      <Text className="font-sans-semibold text-[11px] uppercase tracking-[1px] text-muted">Not AI</Text>
    </View>
  );
}

/** A/B card on the comparison screen. Tapping it marks it as the favorite. */
export function CompareCard({
  look,
  letter,
  favorite,
  onPress,
}: {
  look: BattleLook;
  letter: 'A' | 'B';
  favorite: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: favorite }}
      accessibilityLabel={`Look ${letter}: ${look.title}, ${typeLabel(look)}. Tap to choose as favorite`}
      onPress={onPress}
      style={favorite ? shadows.card : undefined}
      className={`flex-1 gap-2 rounded-lg border-2 bg-card p-2 ${favorite ? 'border-plum' : 'border-blush'}`}>
      <LookImage look={look}>
        <View className="absolute left-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-plum">
          <Text className="font-sans-bold text-label-s text-white">{letter}</Text>
        </View>
        {favorite ? (
          <View className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-plum">
            <Icon name="heart" size={15} color={colors.white} filled />
          </View>
        ) : null}
      </LookImage>
      <View className="gap-1 px-1 pb-1">
        <Text numberOfLines={2} className="font-sans-semibold text-label-s text-ink">
          {look.title}
        </Text>
        <TypeChip look={look} />
        <SavedStatus look={look} />
      </View>
    </Pressable>
  );
}

/** Full-screen view of both looks, stacked, for a closer look. */
export function ZoomBoth({
  visible,
  onClose,
  looks,
}: {
  visible: boolean;
  onClose: () => void;
  looks: [BattleLook, BattleLook];
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="fade" statusBarTranslucent>
      <View className="flex-1 bg-ink" style={{ paddingTop: insets.top }}>
        <View className="h-12 flex-row items-center justify-between px-2">
          <Text className="pl-3 font-sans-semibold text-overline uppercase text-white">Zoom · A and B</Text>
          {/* Light icon on the dark zoom backdrop. */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close zoom"
            onPress={onClose}
            className="h-12 w-12 items-center justify-center rounded-full active:bg-white/10">
            <Icon name="close" size={22} color={colors.white} strokeWidth={1.8} />
          </Pressable>
        </View>
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          contentContainerClassName="gap-4 px-3">
          {looks.map((look, index) => (
            <View key={look.key} className="gap-2">
              <Text className="font-sans-semibold text-label text-white">
                {index === 0 ? 'A' : 'B'} · {look.title}{' '}
                <Text className="font-sans text-body-s text-white/70">{typeLabel(look)}</Text>
              </Text>
              <Image
                source={{ uri: look.imageUrl }}
                contentFit="contain"
                cachePolicy="memory-disk"
                accessibilityLabel={`AI preview by YouCam: ${look.title}`}
                style={{ width: '100%', aspectRatio: look.aspectRatio, borderRadius: 16 }}
              />
            </View>
          ))}
          <Text className="text-center font-sans text-body-s text-white/70">
            AI previews by YouCam are illustrative. Actual results may vary.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

/** The studio to make another look for a category (the same photo stays selected there). */
export function studioFor(look: BattleLook): '/nail' | '/hair/styles' | '/hair/color' {
  if (look.category === 'nails') return '/nail';
  return look.kind === 'hairstyle' ? '/hair/styles' : '/hair/color';
}
