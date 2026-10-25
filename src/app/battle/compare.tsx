import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { FooterBar } from '@/components/ui/footer-bar';
import { Icon } from '@/components/ui/icon';
import {
  BattleHeader,
  BattleTutorial,
  CompareCard,
  OriginalRow,
  studioFor,
  ZoomBoth,
} from '@/features/battle/components';
import { AssistTutorial } from '@/features/assistant/components';
import { useAssistantSession } from '@/features/assistant/session';
import { useBattleSession } from '@/features/battle/battle-session';
import { canPair, comparisonRows, groupByPhoto } from '@/features/battle/looks';
import { useSaveLooks } from '@/features/battle/save';
import { useBattleLooks } from '@/features/battle/use-battle-looks';
import { EdgeFunctionError } from '@/lib/supabase';
import { colors } from '@/theme';

// P5A-4 / P5A-5 — Nail or Hair Look Battle. `from` (a task id) opens it from a studio result.
export default function CompareLooks() {
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const category = useBattleSession((state) => state.category);
  const allPicks = useBattleSession((state) => state.picks);
  const decision = useBattleSession((state) => state.decision);
  const { looks, isPending } = useBattleLooks();
  const save = useSaveLooks();
  const [favoriteKey, setFavoriteKey] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);
  const [assistant, setAssistant] = useState(false);
  const assistantSeen = useAssistantSession((state) => state.tutorialSeen);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  const byKey = new Map(looks.map((look) => [look.key, look]));
  // From a studio: pair that look with the newest other look of the same photo.
  const fromLook = from ? byKey.get(from) : undefined;
  const fromGroup = fromLook
    ? groupByPhoto(looks, fromLook.category).find((group) => group.photoHash === fromLook.photoHash)
    : undefined;
  const fromPartner = fromGroup?.looks.find((look) => look.key !== from);
  const fromPending = Boolean(fromLook && fromPartner && !allPicks[fromLook.category].includes(fromLook.key));
  const wrongCategory = Boolean(fromLook && category !== fromLook.category);
  useEffect(() => {
    if (!fromLook || !fromPartner) return;
    const session = useBattleSession.getState();
    if (wrongCategory) session.setCategory(fromLook.category);
    if (fromPending) session.setPicks(fromLook.category, [fromLook.key, fromPartner.key]);
  }, [fromLook, fromPartner, fromPending, wrongCategory]);

  const [keyA, keyB] = allPicks[category];
  const a = keyA ? byKey.get(keyA) : undefined;
  const b = keyB ? byKey.get(keyB) : undefined;

  if (!isPending && from && !fromLook) return <Redirect href="/battle" />;
  // Only one preview of that photo so far: no fake VS state.
  if (!isPending && fromLook && !fromPartner)
    return <Redirect href={{ pathname: '/battle/one', params: { key: fromLook.key } }} />;
  if (isPending || fromPending || wrongCategory) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-canvas">
        <ActivityIndicator color={colors.plum} />
        <Text className="font-sans text-body-m text-muted">Opening your looks…</Text>
      </View>
    );
  }
  // A pair that is no longer valid (e.g. a preview expired) goes back to picking.
  if (!a || !b || !canPair(a, b)) return <Redirect href="/battle/choose" />;

  const nails = category === 'nails';
  const chosen =
    favoriteKey === a.key || favoriteKey === b.key
      ? favoriteKey
      : decision && [a.key, b.key].includes(decision.favoriteKey)
        ? decision.favoriteKey
        : null;
  const chosenLetter = chosen === a.key ? 'A' : chosen === b.key ? 'B' : null;
  const mixedHair = !nails && a.kind !== b.kind && (a.kind === 'hairstyle' || b.kind === 'hairstyle');
  const unsaved = [a, b].filter((look) => !look.savedLookId);
  const rows = comparisonRows(a, b);
  const original = a.originalUri ?? b.originalUri;
  const saveError = save.error
    ? save.error instanceof EdgeFunctionError
      ? save.error.message
      : 'Couldn’t save. Check your connection and try again — nothing is saved twice.'
    : null;

  const chooseFavorite = () => {
    if (!chosen) return;
    const other = chosen === a.key ? b : a;
    useBattleSession.getState().decide({ favoriteKey: chosen, comparedWithKey: other.key, category });
    router.push('/battle/favorite');
  };

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <BattleHeader
        parent="/battle/choose"
        title={nails ? 'Look Battle · Nails' : 'Look Battle · Hair'}
        backLabel="Back to your picks"
        onHelp={() => setTutorialOpen(true)}
      />
      <ScrollView contentContainerClassName="gap-4 px-5 pb-6 pt-1" showsVerticalScrollIndicator={false}>
        <View className="gap-1.5">
          <Text accessibilityRole="header" className="font-serif text-hero text-ink">
            {nails ? 'Which Nail Look ' : 'Which Hair Look Feels '}
            <Text className="font-serif-italic text-plum">{nails ? 'Wins?' : 'Right?'}</Text>
          </Text>
          <Text className="font-sans text-body-l text-muted">
            Tap the look you prefer. There’s no score — it’s your call.
          </Text>
        </View>

        <OriginalRow
          uri={original}
          subtitle={
            original
              ? `Both from your original ${nails ? 'hand photo' : 'selfie'}`
              : `Both from the same original ${nails ? 'hand photo' : 'selfie'} (not stored on this phone)`
          }
        />

        {mixedHair ? (
          <View className="flex-row gap-2.5 rounded-lg bg-blush p-3.5">
            <Icon name="info" size={16} color={colors.ink} />
            <Text className="flex-1 font-sans text-body-s text-ink">
              Different transformation types: the Hairstyle preview changes the cut, the Hair Color preview changes the
              color. They’re separate results — not combined into one look.
            </Text>
          </View>
        ) : null}

        <View className="flex-row items-stretch gap-2">
          <CompareCard look={a} letter="A" favorite={chosen === a.key} onPress={() => setFavoriteKey(a.key)} />
          <View
            aria-hidden
            style={{ position: 'absolute', left: '50%', top: '32%', marginLeft: -22, zIndex: 2 }}
            className="h-11 w-11 items-center justify-center rounded-full border-2 border-canvas bg-plum">
            <Text className="font-serif-italic text-[16px] leading-[20px] text-white">vs</Text>
          </View>
          <CompareCard look={b} letter="B" favorite={chosen === b.key} onPress={() => setFavoriteKey(b.key)} />
        </View>

        <View className="flex-row gap-2.5">
          <Button
            label="Swap A / B"
            icon="swap"
            variant="secondary"
            className="flex-1"
            onPress={() => useBattleSession.getState().swap(category)}
          />
          <Button label="Zoom Both" icon="zoom" variant="secondary" className="flex-1" onPress={() => setZoom(true)} />
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => {
            useAssistantSession.getState().setPair([a.key, b.key]);
            if (assistantSeen) router.push('/battle/decide');
            else setAssistant(true);
          }}
          className="flex-row items-center gap-3 rounded-lg border border-blush bg-card p-3.5 active:bg-canvas">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-blush">
            <Icon name="sparkle" size={18} color={colors.plum} />
          </View>
          <View className="flex-1">
            <Text className="font-sans-semibold text-label text-ink">Help Me Decide</Text>
            <Text className="font-sans text-body-s text-muted">
              Optional · AI uses your answers and style details, not your photos
            </Text>
          </View>
          <Icon name="chevronRight" size={18} color={colors.ink} />
        </Pressable>

        <View className="gap-2 rounded-lg border border-blush bg-card p-4">
          <Text className="font-sans-semibold text-overline uppercase text-muted">What’s different</Text>
          <View className="flex-row gap-2 border-b border-line pb-2">
            <View className="w-[84px]" />
            <Text numberOfLines={1} className="flex-1 font-sans-bold text-caption text-plum">
              A · {a.title}
            </Text>
            <Text numberOfLines={1} className="flex-1 font-sans-bold text-caption text-plum">
              B · {b.title}
            </Text>
          </View>
          {rows.map((row) => (
            <View key={row.label} className="flex-row gap-2 border-b border-line py-2 last:border-b-0">
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
          <Text className="pt-1 font-sans text-caption text-muted">
            Only details recorded with each preview are shown. “—” means it isn’t part of that look.
          </Text>
        </View>

        {saveError ? (
          <View accessibilityLiveRegion="polite" className="gap-1 rounded-lg bg-blush p-4">
            <Text className="font-sans-semibold text-label-s text-ink">Not saved yet</Text>
            <Text className="font-sans text-body-s text-muted">{saveError}</Text>
          </View>
        ) : null}

        <Text className="text-center font-sans text-body-s text-muted">
          Both previews were generated by YouCam. AI previews are illustrative — actual results may vary.
        </Text>
      </ScrollView>

      <FooterBar>
        <Button
          label={chosenLetter ? `Choose Look ${chosenLetter} as Favorite` : 'Tap a look to choose your favorite'}
          icon={chosenLetter ? 'heart' : undefined}
          disabled={!chosenLetter}
          onPress={chooseFavorite}
        />
        <View className="flex-row gap-2.5">
          <Button
            label={
              save.isPending
                ? 'Saving…'
                : unsaved.length === 0
                  ? 'Both Saved ✓'
                  : unsaved.length === 2
                    ? 'Save Both'
                    : 'Save Both (1 new)'
            }
            variant="secondary"
            className="flex-1"
            disabled={unsaved.length === 0 || save.isPending}
            onPress={() => save.mutate({ looks: unsaved })}
          />
          <Button
            label={nails ? 'Try Another Variation' : 'Try Another Look'}
            variant="secondary"
            className="flex-1"
            onPress={() => router.push(studioFor(a))}
          />
        </View>
      </FooterBar>

      <ZoomBoth visible={zoom} onClose={() => setZoom(false)} looks={[a, b]} />
      <AssistTutorial
        visible={assistant}
        onClose={() => {
          useAssistantSession.getState().markTutorialSeen();
          setAssistant(false);
        }}
        onStart={() => router.push('/battle/decide')}
      />
      <BattleTutorial visible={tutorialOpen} onClose={() => setTutorialOpen(false)} />
    </View>
  );
}
