import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Sheet } from '@/components/ui/sheet';
import { canPair, comparisonRows, typeLabel, type BattleLook } from '@/features/battle/looks';
import { useBattleLooks } from '@/features/battle/use-battle-looks';
import { colors } from '@/theme';

import { NOTE_PII, preferenceLabels, requestInsight, type Preferences } from './api';
import { useAssistantSession } from './session';

/**
 * The A/B pair the assistant works on — the exact pair (and order) on screen when Help Me Decide
 * or Get AI Insight was tapped. Null if those looks can no longer be paired.
 */
export function useAssistPair() {
  const keys = useAssistantSession((state) => state.pair);
  const { looks, isPending } = useBattleLooks();
  const a = keys ? looks.find((look) => look.key === keys[0]) : undefined;
  const b = keys ? looks.find((look) => look.key === keys[1]) : undefined;
  const pair = a && b && canPair(a, b) ? ([a, b] as const) : null;
  return { pair, isPending };
}

/** The note actually sent: only when shared, non-empty and free of contact details. */
export function sharedNote(note: string, share: boolean): string | null {
  const trimmed = note.trim();
  return share && trimmed && !NOTE_PII.test(trimmed) ? trimmed : null;
}

/**
 * The insight for a pair and the current answers. Cached by React Query for the session (and by
 * the server for a week), so Refine with the same answers or Back to Insights never asks again.
 * `enabled` stays false until the user taps Get My AI Insight.
 */
export function useInsight(pair: readonly [BattleLook, BattleLook] | null, enabled = true) {
  const preferences = useAssistantSession((state) => state.preferences);
  const note = useAssistantSession((state) => sharedNote(state.note, state.shareNote));
  const [a, b] = pair ?? [];
  return useQuery({
    queryKey: ['style-insight', a?.key, b?.key, preferences, note],
    queryFn: () => requestInsight({ lookA: a!.key, lookB: b!.key, preferences, note }),
    enabled: enabled && Boolean(pair),
    retry: false,
    staleTime: Infinity,
    gcTime: 30 * 60_000,
  });
}

/** Look A / Look B cards with the genuine YouCam previews — shown in the app only. */
export function PairCards({
  pair,
  selected,
  onSelect,
}: {
  pair: readonly [BattleLook, BattleLook];
  selected?: string | null;
  onSelect?: (key: string) => void;
}) {
  return (
    <View className="flex-row gap-3">
      {pair.map((look, index) => {
        const letter = index === 0 ? 'A' : 'B';
        const on = selected === look.key;
        return (
          <Pressable
            key={look.key}
            disabled={!onSelect}
            accessibilityRole={onSelect ? 'button' : undefined}
            accessibilityState={onSelect ? { selected: on } : undefined}
            accessibilityLabel={`Look ${letter}: ${look.title}, ${typeLabel(look)}${onSelect ? '. Tap to choose' : ''}`}
            onPress={() => onSelect?.(look.key)}
            className={`flex-1 gap-1.5 rounded-lg border-2 bg-card p-1.5 ${on ? 'border-plum' : 'border-blush'}`}>
            <View className="overflow-hidden rounded-[16px] bg-blush">
              <Image
                source={{ uri: look.imageUrl }}
                contentFit="cover"
                cachePolicy="memory-disk"
                accessibilityLabel={`YouCam AI preview: ${look.title}`}
                style={{ width: '100%', aspectRatio: 1.35 }}
              />
              <View className="absolute left-1.5 top-1.5 h-7 w-7 items-center justify-center rounded-full bg-plum">
                <Text className="font-sans-bold text-caption text-white">{letter}</Text>
              </View>
              {on ? (
                <View className="absolute right-1.5 top-1.5 h-7 w-7 items-center justify-center rounded-full bg-plum">
                  <Icon name="heart" size={13} color={colors.white} filled />
                </View>
              ) : null}
              <View className="absolute bottom-1.5 left-1.5 rounded-full bg-canvas/95 px-2 py-0.5">
                <Text className="font-sans-semibold text-[11px] leading-[14px] text-ink">YouCam AI Preview</Text>
              </View>
            </View>
            <View className="px-1 pb-1">
              <Text numberOfLines={1} className="font-sans-semibold text-label-s text-ink">
                {look.title}
              </Text>
              <Text numberOfLines={1} className="font-sans text-caption text-muted">
                {typeLabel(look)}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

/** "You chose" chips with Edit. */
export function PreferenceSummary({ preferences, onEdit }: { preferences: Preferences; onEdit?: () => void }) {
  const labels = preferenceLabels(preferences);
  return (
    <View className="flex-row flex-wrap items-center gap-2">
      <Text className="font-sans-semibold text-overline uppercase text-muted">You chose</Text>
      {labels.length ? (
        labels.map((label) => (
          <View key={label} className="rounded-full bg-blush px-2.5 py-1">
            <Text className="font-sans-semibold text-caption text-plum">{label}</Text>
          </View>
        ))
      ) : (
        <Text className="font-sans text-body-s text-muted">No preferences — a general comparison</Text>
      )}
      {onEdit ? (
        <Text
          accessibilityRole="button"
          onPress={onEdit}
          className="ml-auto py-1 pl-3 font-sans-semibold text-label-s text-plum">
          Edit
        </Text>
      ) : null}
    </View>
  );
}

export function AiBadge({ label = 'AI text guidance' }: { label?: string }) {
  return (
    <View className="rounded-full border border-champagne bg-blush px-2 py-0.5">
      <Text className="font-sans-bold text-[11px] uppercase leading-[15px] tracking-[0.8px] text-plum">{label}</Text>
    </View>
  );
}

/** The rounded "Style insight" card with the champagne edge used on P5B-4/5/6. */
export function InsightCard({
  title,
  subtitle,
  badge,
  children,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  children: ReactNode;
}) {
  return (
    <View className="overflow-hidden rounded-lg border border-blush bg-card">
      <View className="absolute bottom-0 left-0 top-0 w-1 bg-champagne" />
      <View className="gap-3 p-4 pl-5">
        <View className="flex-row items-start gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-plum">
            <Icon name="sparkle" size={18} color={colors.white} />
          </View>
          <View className="flex-1">
            <View className="flex-row flex-wrap items-center justify-between gap-2">
              <Text className="font-sans-semibold text-label-l text-ink">{title}</Text>
              {badge ? <AiBadge label={badge} /> : null}
            </View>
            <Text className="font-sans text-body-s text-muted">{subtitle}</Text>
          </View>
        </View>
        {children}
      </View>
    </View>
  );
}

/** A labelled section inside an insight card. */
export function InsightSection({
  letter,
  title,
  children,
}: {
  letter?: 'A' | 'B';
  title: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-1.5 border-t border-line pt-3">
      <View className="flex-row items-center gap-2">
        {letter ? (
          <View className="h-6 w-6 items-center justify-center rounded-full bg-plum">
            <Text className="font-sans-bold text-[12px] text-white">{letter}</Text>
          </View>
        ) : null}
        <Text className="font-sans-bold text-overline uppercase text-muted">{title}</Text>
      </View>
      {children}
    </View>
  );
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <View className="gap-1.5">
      {items.map((item) => (
        <View key={item} className="flex-row gap-2">
          <View className="mt-[9px] h-1.5 w-1.5 rounded-full bg-champagne" />
          <Text className="flex-1 font-sans text-body-m text-ink">{item}</Text>
        </View>
      ))}
    </View>
  );
}

/** "Style details — no AI guidance": the factual table built in the app from stored settings. */
export function StyleDetailsTable({ pair }: { pair: readonly [BattleLook, BattleLook] }) {
  const rows = comparisonRows(pair[0], pair[1]);
  return (
    <View className="gap-2 rounded-lg border border-blush bg-card p-4">
      <View className="flex-row flex-wrap items-center justify-between gap-2">
        <Text className="font-sans-semibold text-overline uppercase text-muted">Style details — no AI guidance</Text>
        <View className="rounded-full bg-blush px-2 py-0.5">
          <Text className="font-sans-bold text-[11px] uppercase tracking-[0.8px] text-muted">Rule-based · not AI</Text>
        </View>
      </View>
      <View className="flex-row gap-2 border-b border-line pb-2">
        <View className="w-[84px]" />
        <Text className="flex-1 font-sans-bold text-caption text-ink">Look A</Text>
        <Text className="flex-1 font-sans-bold text-caption text-ink">Look B</Text>
      </View>
      {rows.map((row) => (
        <View key={row.label} className="flex-row gap-2 border-b border-line py-2">
          <Text className="w-[84px] font-sans text-body-s text-muted">{row.label}</Text>
          <Text
            className={`flex-1 text-body-s ${row.differs ? 'font-sans-semibold text-ink' : 'font-sans text-muted'}`}>
            {row.a}
          </Text>
          <Text
            className={`flex-1 text-body-s ${row.differs ? 'font-sans-semibold text-ink' : 'font-sans text-muted'}`}>
            {row.b}
          </Text>
        </View>
      ))}
    </View>
  );
}

const TUTORIAL_STEPS = [
  'Compare two YouCam previews.',
  'Tell AI what matters most.',
  'Understand the trade-offs and choose your favorite.',
];

/** P5B-1 — first-time Decision Assistant tutorial (auto once; ? replays it). */
export function AssistTutorial({
  visible,
  onClose,
  onStart,
}: {
  visible: boolean;
  onClose: () => void;
  onStart: () => void;
}) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      eyebrow="Optional · First time"
      title={
        <>
          Meet Your Style <Text className="font-serif-italic text-plum">Decision Assistant</Text>
        </>
      }>
      <Text className="font-sans text-body-m text-muted">
        Not sure which look to choose? Let’s explore what matters to you.
      </Text>
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
      <View className="flex-row gap-2">
        <Icon name="lock" size={14} color={colors.muted} />
        <Text className="flex-1 font-sans text-caption text-muted">
          Gemini gets your answers and style details — never your photos or previews. It doesn’t rate how you look.
        </Text>
      </View>
      <Button
        label="Help Me Decide"
        icon="sparkle"
        onPress={() => {
          onClose();
          onStart();
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
