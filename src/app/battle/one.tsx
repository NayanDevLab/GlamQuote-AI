import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { FooterBar } from '@/components/ui/footer-bar';
import { Icon } from '@/components/ui/icon';
import {
  BattleHeader,
  BattleTutorial,
  LookImage,
  OriginalRow,
  SavedStatus,
  studioFor,
  TypeChip,
} from '@/features/battle/components';
import { useSaveLooks } from '@/features/battle/save';
import { useBattleLooks } from '@/features/battle/use-battle-looks';
import { EdgeFunctionError } from '@/lib/supabase';
import { colors } from '@/theme';

// P5A-6 — Only one preview from this photo: no VS state, an honest next step and Save.
export default function OnePreview() {
  const insets = useSafeAreaInsets();
  const { key } = useLocalSearchParams<{ key: string }>();
  const { looks, isPending } = useBattleLooks();
  const save = useSaveLooks();
  const [tutorialOpen, setTutorialOpen] = useState(false);

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-canvas">
        <ActivityIndicator color={colors.plum} />
      </View>
    );
  }
  const look = looks.find((item) => item.key === key);
  if (!look) return <Redirect href="/battle" />;
  const nails = look.category === 'nails';
  const saveError = save.error
    ? save.error instanceof EdgeFunctionError
      ? save.error.message
      : 'Couldn’t save. Check your connection and try again — it won’t be saved twice.'
    : null;

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <BattleHeader
        title="Look Battle"
        backLabel="Back to Look Battle"
        parent="/battle"
        onHelp={() => setTutorialOpen(true)}
      />
      <ScrollView contentContainerClassName="gap-4 px-5 pb-6 pt-1" showsVerticalScrollIndicator={false}>
        <View className="gap-1.5">
          <Text accessibilityRole="header" className="font-serif text-hero text-ink">
            One More to <Text className="font-serif-italic text-plum">Go.</Text>
          </Text>
          <Text className="font-sans text-body-l text-muted">
            Comparing needs a second YouCam preview from the same original photo.
          </Text>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 gap-2 rounded-lg border-2 border-blush bg-card p-2">
            <LookImage look={look}>
              <View className="absolute left-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-plum">
                <Text className="font-sans-bold text-label-s text-white">A</Text>
              </View>
            </LookImage>
            <View className="gap-1 px-1 pb-1">
              <Text numberOfLines={2} className="font-sans-semibold text-label-s text-ink">
                {look.title}
              </Text>
              <TypeChip look={look} />
              <SavedStatus look={look} />
            </View>
          </View>
          <View className="flex-1 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-champagne bg-card p-3">
            <View className="h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-champagne">
              <Text className="font-sans-bold text-label-s text-muted">B</Text>
            </View>
            <Text className="font-sans-semibold text-title-lg text-muted">+</Text>
            <Text className="text-center font-sans-semibold text-label-s text-ink">Your next look</Text>
            <Text className="text-center font-sans text-body-s text-muted">
              {nails
                ? 'Another polish, press-on or nail design on this hand photo'
                : 'Another hairstyle or hair color from this selfie'}
            </Text>
          </View>
        </View>

        <OriginalRow
          uri={look.originalUri}
          subtitle={look.originalUri ? 'Original kept on this phone' : 'Same original photo needed for the next look'}
        />

        {look.savedLookId ? (
          <View className="flex-row items-center gap-3 rounded-lg bg-blush p-4">
            <Icon name="bookmark" size={18} color={colors.plum} filled />
            <Text className="flex-1 font-sans text-body-m text-ink">Saved to your Lookbook.</Text>
          </View>
        ) : null}
        {saveError ? (
          <View accessibilityLiveRegion="polite" className="gap-1 rounded-lg bg-blush p-4">
            <Text className="font-sans-semibold text-label-s text-ink">Not saved yet</Text>
            <Text className="font-sans text-body-s text-muted">{saveError}</Text>
          </View>
        ) : null}
        <Text className="text-center font-sans text-body-s text-muted">
          AI preview by YouCam. Actual results may vary.
        </Text>
      </ScrollView>

      <FooterBar>
        <Button label="Create Another Look" icon="bookmarkPlus" onPress={() => router.push(studioFor(look))} />
        <Button
          label={look.savedLookId ? 'Saved in Lookbook' : save.isPending ? 'Saving…' : 'Save This Look'}
          icon="bookmark"
          variant="secondary"
          disabled={Boolean(look.savedLookId) || save.isPending}
          onPress={() => save.mutate({ looks: [look] })}
        />
      </FooterBar>

      <BattleTutorial visible={tutorialOpen} onClose={() => setTutorialOpen(false)} />
    </View>
  );
}
