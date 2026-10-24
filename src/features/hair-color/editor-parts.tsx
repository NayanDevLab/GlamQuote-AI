import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FooterBar } from '@/components/ui/footer-bar';
import { IconButton } from '@/components/ui/icon-button';
import { PhotoSlot } from '@/components/ui/photo-slot';
import { Thumb } from '@/components/ui/thumb';
import type { PickedImage } from '@/lib/photo';
import { colors, shadows } from '@/theme';

import { HairSwatch, SampleNote } from './components';
import { HEX_COLOR } from './presets';

/** Header shared by the Full and Ombre editors. */
export function EditorHeader({ title }: { title: string }) {
  return (
    <View className="h-12 flex-row items-center justify-between px-2">
      <IconButton icon="arrowLeft" label="Back to your photo" strokeWidth={1.8} onPress={() => router.back()} />
      <Text className="font-sans-semibold text-overline uppercase text-muted">{title}</Text>
      <View className="w-12" />
    </View>
  );
}

/** "Your photo" row: the original photo the color will be applied to. */
export function PhotoRow({ photo }: { photo: PickedImage }) {
  return (
    <View className="flex-row items-center gap-3 rounded-lg border border-blush bg-card p-3">
      <Thumb uri={photo.uri} size={48} />
      <View className="flex-1">
        <Text className="font-sans-semibold text-label-s text-ink">Your photo</Text>
        <Text className="font-sans text-body-s text-muted">Original photo · colors are applied to this</Text>
      </View>
      <Text
        accessibilityRole="button"
        onPress={() => router.push('/hair/color/photo?edit=1')}
        className="py-2 pl-3 font-sans-semibold text-label-s text-plum">
        Change
      </Text>
    </View>
  );
}

/** Sample hero: an illustrated model on the left, the choice on the right. Never the user's photo. */
export function SampleHero({ figure, children, note }: { figure: ReactNode; children: ReactNode; note?: string }) {
  return (
    <PhotoSlot tone="warm" className="h-[206px] overflow-hidden rounded-lg" style={shadows.card}>
      <View aria-hidden className="absolute bottom-[-44px] left-1.5">
        {figure}
      </View>
      <View className="absolute bottom-12 left-[176px] right-3.5 top-4 gap-1.5">{children}</View>
      <SampleNote text={note} />
    </PhotoSlot>
  );
}

/**
 * HEX entry. The draft only ever receives a valid six-digit HEX; while typing, the last valid
 * color stays applied and the field explains what is expected.
 */
export function HexField({
  value,
  onChange,
  label,
  conflict,
}: {
  value: string;
  onChange: (hex: string) => void;
  label: string;
  /** Extra validation message (e.g. both ombre colors are the same). */
  conflict?: string | null;
}) {
  const [text, setText] = useState(value);
  // Follow outside changes (a swatch tap, Reset, Swap) by adjusting state while rendering.
  const [synced, setSynced] = useState(value);
  if (value !== synced) {
    setSynced(value);
    setText(value);
  }
  const normalized = text.trim().startsWith('#') ? text.trim() : `#${text.trim()}`;
  const valid = HEX_COLOR.test(normalized);
  const message = !valid
    ? 'Use # plus 6 characters (0–9, A–F), like #6E2D4B.'
    : (conflict ?? 'Valid · sent to YouCam exactly as shown.');

  return (
    <View className="gap-1.5">
      <View
        className={`h-12 flex-row items-center gap-2.5 rounded-full border bg-card pl-2 pr-4 ${
          valid && !conflict ? 'border-line' : 'border-[#A0525F]'
        }`}>
        <HairSwatch swatch={[valid ? normalized.toUpperCase() : '#C9B6AC']} width={34} height={34} radius={17} />
        <Text className="font-sans-semibold text-caption uppercase text-muted">HEX</Text>
        <TextInput
          value={text}
          onChangeText={(next) => {
            setText(next);
            const candidate = next.trim().startsWith('#') ? next.trim() : `#${next.trim()}`;
            if (HEX_COLOR.test(candidate)) onChange(candidate.toUpperCase());
          }}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={7}
          accessibilityLabel={label}
          placeholder="#6E2D4B"
          placeholderTextColor={colors.placeholder}
          className="h-12 flex-1 p-0 font-sans-semibold text-[16px] text-ink"
        />
      </View>
      <Text className={`px-2 font-sans text-body-s ${valid && !conflict ? 'text-muted' : 'text-[#8A3446]'}`}>
        {message}
      </Text>
    </View>
  );
}

/** Sticky footer: the current choice, its mode badge, and the way forward. */
export function ChoiceFooter({
  swatch,
  title,
  detail,
  badge,
  actionLabel,
  disabled,
  onAction,
  reset,
}: {
  swatch: string[];
  title: string;
  detail: string;
  badge: string;
  actionLabel: string;
  disabled?: boolean;
  onAction: () => void;
  reset?: { label: string; onPress: () => void };
}) {
  return (
    <FooterBar>
      <View accessible accessibilityLabel={`Selected: ${title}. ${detail}`} className="flex-row items-center gap-3">
        <HairSwatch swatch={swatch} width={30} height={36} radius={9} />
        <View className="flex-1">
          <Text numberOfLines={1} className="font-sans-semibold text-label-s text-ink">
            {title}
          </Text>
          <Text numberOfLines={1} className="font-sans text-body-s text-muted">
            {detail}
          </Text>
        </View>
        <View className="rounded-full bg-blush px-2.5 py-1">
          <Text className="font-sans-semibold text-caption uppercase tracking-[1px] text-muted">{badge}</Text>
        </View>
      </View>
      <Button label={actionLabel} trailingIcon="arrowRight" disabled={disabled} onPress={onAction} />
      {reset ? (
        <Text
          accessibilityRole="button"
          onPress={reset.onPress}
          className="self-center py-1 font-sans-semibold text-label-s text-plum">
          ↺ {reset.label}
        </Text>
      ) : null}
    </FooterBar>
  );
}
