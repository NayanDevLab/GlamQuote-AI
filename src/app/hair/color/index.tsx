import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { hairStudioImages } from '@/assets/images';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Thumb } from '@/components/ui/thumb';
import { HairSwatch } from '@/features/hair-color/components';
import { useHairColorSession } from '@/features/hair-color/hair-color-session';
import type { HairColorMode } from '@/features/hair-color/presets';
import { photoExists } from '@/lib/photo';
import { colors, shadows } from '@/theme';
import { HairColorTutorial } from '@/features/tutorials/sheets';

const STRIP = [
  { label: 'Choose', detail: 'A full shade or an ombre' },
  { label: 'Preview', detail: 'Generated on your photo' },
  { label: 'Compare', detail: 'Before, after and side by side' },
];

function StyleCard({
  swatch,
  title,
  body,
  detail,
  onPress,
}: {
  swatch: string[];
  title: string;
  body: string;
  detail: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${body} ${detail}`}
      onPress={onPress}
      style={shadows.card}
      className="flex-row items-center gap-3.5 rounded-lg border border-blush bg-card p-3 active:bg-canvas">
      <HairSwatch swatch={swatch} width={52} height={68} radius={14} />
      <View className="flex-1 gap-0.5">
        <Text className="font-sans-semibold text-label-l text-ink">{title}</Text>
        <Text className="font-sans text-body-s text-muted">{body}</Text>
        <Text className="font-sans-semibold text-caption text-plum">{detail}</Text>
      </View>
      <Icon name="chevronRight" size={18} color={colors.ink} />
    </Pressable>
  );
}

// P4B-1 Hair Color Studio, with the P4B-2 tutorial on the first visit.
export default function HairColorStudio() {
  const insets = useSafeAreaInsets();
  const tutorialSeen = useHairColorSession((state) => state.tutorialSeen);
  const markTutorialSeen = useHairColorSession((state) => state.markTutorialSeen);
  const setMode = useHairColorSession((state) => state.setMode);
  const mode = useHairColorSession((state) => state.mode);
  const attempt = useHairColorSession((state) => state.attempt);
  // Only previews whose original photo is still on this device (Android may clear the cache).
  const previews = useHairColorSession((state) => state.previews).filter((preview) => photoExists(preview.photo.uri));
  const [tutorialOpen, setTutorialOpen] = useState(!tutorialSeen);

  const closeTutorial = () => {
    markTutorialSeen();
    setTutorialOpen(false);
  };
  const open = (next: HairColorMode) => {
    setMode(next);
    router.push('/hair/color/photo');
  };

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <View className="h-12 flex-row items-center justify-between px-2">
        <IconButton icon="arrowLeft" label="Back" strokeWidth={1.8} onPress={() => router.back()} />
        <Text className="font-sans-semibold text-overline uppercase text-muted">Hair Color Studio</Text>
        <IconButton icon="help" label="How Hair Color Try-On works" onPress={() => setTutorialOpen(true)} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        contentContainerClassName="gap-4 px-5 pt-2"
        showsVerticalScrollIndicator={false}>
        <View className="relative h-[210px] overflow-hidden rounded-lg" style={shadows.card}>
          <Image
            source={hairStudioImages.colorHero}
            contentFit="cover"
            accessibilityLabel="Two models showcasing vibrant Copper Red curls and a Rose Gold to Peach Blonde ombre in studio light"
            style={StyleSheet.absoluteFill}
          />
          <View className="absolute left-3 top-3 flex-row items-center gap-1.5 rounded-full bg-canvas/95 px-2.5 py-[5px]">
            <HairSwatch swatch={['#A8482A', '#E8B89A']} width={13} height={13} radius={7} />
            <Text className="font-sans-semibold text-caption text-plum">Hair color try-on from your photo</Text>
          </View>
          <View className="absolute bottom-3 left-3 right-3 flex-row gap-2">
            <View className="rounded-full bg-canvas/95 px-2.5 py-[5px]">
              <Text className="font-sans-semibold text-caption text-ink">Full · Copper Red</Text>
            </View>
            <View className="rounded-full bg-canvas/95 px-2.5 py-[5px]">
              <Text className="font-sans-semibold text-caption text-ink">Ombre · Rose Gold → Peach</Text>
            </View>
          </View>
        </View>

        <View className="gap-2">
          <Text accessibilityRole="header" className="font-serif text-hero text-ink">
            Discover Your Next <Text className="font-serif-italic text-plum">Hair Color.</Text>
          </Text>
          <Text className="font-sans text-body-l text-muted">
            Explore beautiful shades and preview them on your own hair.
          </Text>
        </View>

        {attempt?.taskId ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/hair/color/generating')}
            className="flex-row items-center gap-3 rounded-lg bg-blush p-3.5 active:bg-line">
            <Icon name="clock" size={20} color={colors.plum} />
            <View className="flex-1">
              <Text className="font-sans-semibold text-label-s text-ink">A preview is in progress</Text>
              <Text className="font-sans text-body-s text-muted">Tap to see how it’s going.</Text>
            </View>
            <Icon name="chevronRight" size={18} color={colors.plum} />
          </Pressable>
        ) : attempt ? (
          // Never confirmed by YouCam (e.g. it stopped offline). The user decides: send or discard.
          <View className="gap-2 rounded-lg bg-blush p-3.5">
            <View className="flex-row items-center gap-3">
              <Icon name="clock" size={20} color={colors.plum} />
              <View className="flex-1">
                <Text className="font-sans-semibold text-label-s text-ink">A preview wasn’t sent</Text>
                <Text className="font-sans text-body-s text-muted">
                  An earlier request stopped before YouCam confirmed it.
                </Text>
              </View>
            </View>
            <View className="flex-row justify-end gap-2">
              <Text
                accessibilityRole="button"
                onPress={() => useHairColorSession.getState().endAttempt()}
                className="px-3 py-2 font-sans-semibold text-label-s text-plum">
                Discard
              </Text>
              <Text
                accessibilityRole="button"
                onPress={() => router.push('/hair/color/generating')}
                className="px-3 py-2 font-sans-semibold text-label-s text-plum">
                Send Again
              </Text>
            </View>
          </View>
        ) : null}

        {previews.length > 0 ? (
          // Previews made on this device, so an unsaved result can be reopened (and saved) later.
          <View className="gap-2.5">
            <Text className="font-sans-semibold text-overline uppercase text-muted">Your recent color previews</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3">
              {previews.map((preview) => (
                <Pressable
                  key={preview.taskId}
                  accessibilityRole="button"
                  accessibilityLabel={`Open your ${preview.choice.name} preview${preview.savedLookId ? ', saved' : ''}`}
                  onPress={() =>
                    router.push({
                      pathname: '/hair/color/result',
                      params: { taskId: preview.taskId },
                    })
                  }
                  className="w-[132px] gap-1.5">
                  <View>
                    <Thumb uri={preview.photo.uri} size={132} />
                    <View className="absolute bottom-2 left-2 rounded-full bg-canvas/95 px-2 py-0.5">
                      <Text className="font-sans-semibold text-[11px] leading-[14px] text-plum">
                        {preview.savedLookId ? 'Saved' : 'Not saved'}
                      </Text>
                    </View>
                  </View>
                  <Text numberOfLines={1} className="font-sans-semibold text-label-s text-ink">
                    {preview.choice.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}

        <View className="gap-3 pt-1">
          <Text className="font-sans-semibold text-overline uppercase text-muted">Choose a color style</Text>
          <StyleCard
            swatch={['#C69257']}
            title="Full Hair Color"
            body="Try a new all-over shade."
            detail="10 shades + custom color"
            onPress={() => open('full')}
          />
          <StyleCard
            swatch={['#3B2519', '#B9844F']}
            title="Ombre Hair Color"
            body="Explore beautifully blended colors."
            detail="10 two-tone blends + custom ombre"
            onPress={() => open('ombre')}
          />
        </View>

        <View className="flex-row justify-between rounded-lg border border-blush bg-card px-3 py-3">
          {STRIP.map(({ label, detail }, index) => (
            <View key={label} className="flex-1 items-center gap-1">
              <View
                className={`h-7 w-7 items-center justify-center rounded-full ${index === 0 ? 'bg-plum' : 'bg-blush'}`}>
                <Text
                  className={`font-serif-italic text-[16px] leading-[20px] ${index === 0 ? 'text-white' : 'text-plum'}`}>
                  {index + 1}
                </Text>
              </View>
              <Text className="font-sans-semibold text-label-s text-ink">{label}</Text>
              <Text className="text-center font-sans text-caption text-muted">{detail}</Text>
            </View>
          ))}
        </View>

        <View className="flex-row gap-2.5 rounded-lg bg-blush p-3.5">
          <Icon name="info" size={16} color={colors.ink} />
          <Text className="flex-1 font-sans text-body-s text-ink">
            Used a photo in Hair Studio this session? You can reuse that original photo — we never color an AI hairstyle
            preview.
          </Text>
        </View>
        <Text className="text-center font-sans text-body-s text-muted">
          Samples are illustrations. Your preview is generated from your photo.
        </Text>
      </ScrollView>

      <HairColorTutorial visible={tutorialOpen} onClose={closeTutorial} onStart={() => open(mode)} />
    </View>
  );
}
