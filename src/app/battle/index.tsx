import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { FooterBar } from '@/components/ui/footer-bar';
import { Icon } from '@/components/ui/icon';
import { BattleHeader, BattleTutorial } from '@/features/battle/components';
import { useBattleSession } from '@/features/battle/battle-session';
import { groupByPhoto, type BattleCategory, type BattleLook } from '@/features/battle/looks';
import { useBattleLooks } from '@/features/battle/use-battle-looks';
import { colors, shadows } from '@/theme';

const CATEGORY = {
  nails: { title: 'Nail Looks', photo: 'hand photo', studio: '/nail', empty: 'Start with a nail design or color' },
  hair: { title: 'Hair Looks', photo: 'selfie', studio: '/hair', empty: 'Start with a hairstyle or hair color' },
} as const;

function CategoryCard({ category, looks }: { category: BattleCategory; looks: BattleLook[] }) {
  const setCategory = useBattleSession((state) => state.setCategory);
  const groups = groupByPhoto(looks, category);
  const total = groups.reduce((sum, group) => sum + group.looks.length, 0);
  const ready = groups.find((group) => group.looks.length >= 2);
  const shown = (ready ?? groups[0])?.looks.slice(0, 3) ?? [];
  const copy = CATEGORY[category];
  const subtitle = ready
    ? `${ready.looks.length} from your latest ${copy.photo}`
    : total === 1
      ? `One more from the same ${copy.photo}`
      : copy.empty;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${copy.title}. ${total} ${total === 1 ? 'preview' : 'previews'}. ${subtitle}`}
      onPress={() => {
        if (ready) {
          setCategory(category);
          router.push('/battle/choose');
        } else if (total === 1) {
          router.push({ pathname: '/battle/one', params: { key: groups[0].looks[0].key } });
        } else {
          router.push(copy.studio);
        }
      }}
      style={shadows.card}
      className="gap-3 rounded-lg border border-blush bg-card p-3 active:bg-canvas">
      <View className="flex-row gap-2">
        {[0, 1, 2].map((index) => {
          const look = shown[index];
          return (
            <View key={index} className="flex-1 overflow-hidden rounded-[16px] bg-blush" style={{ aspectRatio: 1 }}>
              {look ? (
                <>
                  <Image
                    source={{ uri: look.imageUrl }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    accessibilityLabel={`AI preview by YouCam: ${look.title}`}
                    style={{ width: '100%', height: '100%' }}
                  />
                  <View className="absolute left-1.5 top-1.5 rounded-full bg-plum px-1.5 py-0.5">
                    <Text className="font-sans-bold text-[10px] leading-[13px] text-white">AI</Text>
                  </View>
                </>
              ) : (
                <View className="flex-1 items-center justify-center">
                  <Text className="font-sans-semibold text-title-lg text-muted">+</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
      <View className="flex-row items-center gap-3 px-1">
        <View className="flex-1">
          <Text className="font-sans-semibold text-label-l text-ink">{copy.title}</Text>
          <Text className="font-sans text-body-s text-muted">{subtitle}</Text>
        </View>
        <View className="rounded-full bg-blush px-2.5 py-1">
          <Text className="font-sans-semibold text-caption text-ink">
            {total} {total === 1 ? 'preview' : 'previews'}
          </Text>
        </View>
        <Icon name="chevronRight" size={18} color={colors.ink} />
      </View>
    </Pressable>
  );
}

// P5A-1 — Look Battle entry, with the P5A-2 tutorial on the first visit.
export default function LookBattleEntry() {
  const insets = useSafeAreaInsets();
  const tutorialSeen = useBattleSession((state) => state.tutorialSeen);
  const markTutorialSeen = useBattleSession((state) => state.markTutorialSeen);
  const setCategory = useBattleSession((state) => state.setCategory);
  const [tutorialOpen, setTutorialOpen] = useState(!tutorialSeen);
  const { looks, unavailable, isPending, isError, refetch } = useBattleLooks();

  const closeTutorial = () => {
    markTutorialSeen();
    setTutorialOpen(false);
  };
  // The category with a comparable pair (nails first), if any.
  const ready = (['nails', 'hair'] as const).find((category) =>
    groupByPhoto(looks, category).some((group) => group.looks.length >= 2),
  );
  const start = () => {
    if (!ready) return;
    setCategory(ready);
    router.push('/battle/choose');
  };

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <BattleHeader title="Look Battle" onHelp={() => setTutorialOpen(true)} />
      <ScrollView contentContainerClassName="gap-4 px-5 pb-6 pt-1" showsVerticalScrollIndicator={false}>
        <View className="gap-1.5">
          <Text accessibilityRole="header" className="font-serif text-hero text-ink">
            Compare Your <Text className="font-serif-italic text-plum">Looks.</Text>
          </Text>
          <Text className="font-sans text-body-l text-muted">
            See your favorites side by side and find the one you love.
          </Text>
        </View>

        <Text className="font-sans-semibold text-overline uppercase text-muted">Choose a category</Text>
        {isPending ? (
          <View className="items-center gap-3 py-10">
            <ActivityIndicator color={colors.plum} />
            <Text className="font-sans text-body-m text-muted">Finding your previews…</Text>
          </View>
        ) : isError ? (
          <View accessibilityLiveRegion="polite" className="gap-2 rounded-lg bg-blush p-4">
            <Text className="font-sans-semibold text-label-s text-ink">We couldn’t load your looks.</Text>
            <Text className="font-sans text-body-s text-muted">
              Your saved looks are safe. Check your connection and try again.
            </Text>
            <Text
              accessibilityRole="button"
              onPress={() => refetch()}
              className="self-start py-1.5 font-sans-semibold text-label-s text-plum">
              Try Again
            </Text>
          </View>
        ) : (
          <>
            <CategoryCard category="nails" looks={looks} />
            <CategoryCard category="hair" looks={looks} />
          </>
        )}

        <View className="flex-row gap-2.5 rounded-lg border border-blush bg-card p-3.5">
          <Icon name="info" size={16} color={colors.ink} />
          <Text className="flex-1 font-sans text-body-s text-ink">
            Only your YouCam previews from the <Text className="font-sans-semibold">same original photo</Text> are
            compared — nails with nails, hair with hair. Comparing never creates new previews or uses your daily limit.
          </Text>
        </View>
        {unavailable > 0 ? (
          <Text className="text-center font-sans text-body-s text-muted">
            {unavailable} unsaved {unavailable === 1 ? 'preview is' : 'previews are'} no longer available to compare.
          </Text>
        ) : null}
      </ScrollView>

      <FooterBar>
        <Button label="Start Comparing" trailingIcon="arrowRight" disabled={!ready} onPress={start} />
        <Text className="text-center font-sans text-body-s text-muted">
          {ready || isPending
            ? 'AI previews are illustrative. Actual results may vary.'
            : 'You need two previews from the same photo.'}
        </Text>
      </FooterBar>

      <BattleTutorial visible={tutorialOpen} onClose={closeTutorial} onStart={start} />
    </View>
  );
}
