import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HairPortraits } from '@/components/illustrations';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { ModeCard } from '@/components/ui/mode-card';
import { PhotoSlot } from '@/components/ui/photo-slot';
import { Sheet } from '@/components/ui/sheet';
import { useHairSession } from '@/features/hair/hair-session';
import { colors, shadows } from '@/theme';

const TUTORIAL_STEPS = [
  'Add a clear photo of yourself.',
  'Choose a hairstyle from the gallery.',
  'Generate a preview, compare and save your favorites.',
];

const STRIP = [
  { label: 'Choose', detail: 'A style you like' },
  { label: 'Preview', detail: 'On your own photo' },
  { label: 'Compare', detail: 'Before and after' },
];

// P4A-1 Hair Studio landing, with the P4A-2 tutorial on the first visit.
export default function HairStudio() {
  const insets = useSafeAreaInsets();
  const tutorialSeen = useHairSession((state) => state.tutorialSeen);
  const markTutorialSeen = useHairSession((state) => state.markTutorialSeen);
  const hasSelfie = useHairSession((state) => state.selfie !== null);
  const attempt = useHairSession((state) => state.attempt);
  // Shown automatically on the first visit only; the ? replays it at any time.
  const [tutorialOpen, setTutorialOpen] = useState(!tutorialSeen);

  const closeTutorial = () => {
    markTutorialSeen();
    setTutorialOpen(false);
  };

  // A selfie chosen earlier is reused, so the flow resumes at the gallery.
  const start = () => router.push(hasSelfie ? '/hair/styles' : '/hair/photo');

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <View className="h-12 flex-row items-center justify-between px-2">
        <IconButton icon="arrowLeft" label="Back" strokeWidth={1.8} onPress={() => router.back()} />
        <Text className="font-sans-semibold text-overline uppercase text-muted">Hair Studio</Text>
        <IconButton icon="help" label="How Hair Try-On works" onPress={() => setTutorialOpen(true)} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        contentContainerClassName="gap-4 px-5 pt-2"
        showsVerticalScrollIndicator={false}>
        <PhotoSlot tone="warm" className="h-[210px] overflow-hidden rounded-lg" style={shadows.card}>
          <HairPortraits />
          <View className="absolute left-3 top-3 flex-row items-center gap-1.5 rounded-full bg-canvas/95 px-2.5 py-[5px]">
            <Icon name="image" size={13} color={colors.plum} strokeWidth={2} />
            <Text className="font-sans-semibold text-caption text-plum">AI try-on from your photo</Text>
          </View>
        </PhotoSlot>

        <View className="gap-2">
          <Text accessibilityRole="header" className="font-serif text-hero text-ink">
            Your Hair, Your <Text className="font-serif-italic text-plum">Next Look.</Text>
          </Text>
          <Text className="font-sans text-body-l text-muted">
            Explore hairstyles and preview a new look on your own photo.
          </Text>
        </View>

        {attempt?.taskId ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/hair/generating')}
            className="flex-row items-center gap-3 rounded-lg bg-blush p-3.5 active:bg-line">
            <Icon name="clock" size={20} color={colors.plum} />
            <View className="flex-1">
              <Text className="font-sans-semibold text-label-s text-ink">A preview is in progress</Text>
              <Text className="font-sans text-body-s text-muted">Tap to see how it’s going.</Text>
            </View>
            <Icon name="chevronRight" size={18} color={colors.plum} />
          </Pressable>
        ) : attempt ? (
          // Never confirmed by YouCam (e.g. it stopped offline). Sending it again could use units
          // for an old photo and style, so the user decides: send it, or discard it.
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
                onPress={() => useHairSession.getState().endAttempt()}
                className="px-3 py-2 font-sans-semibold text-label-s text-plum">
                Discard
              </Text>
              <Text
                accessibilityRole="button"
                onPress={() => router.push('/hair/generating')}
                className="px-3 py-2 font-sans-semibold text-label-s text-plum">
                Send Again
              </Text>
            </View>
          </View>
        ) : null}

        <View className="gap-3 pt-1">
          <Text className="font-sans-semibold text-overline uppercase text-muted">Choose how to start</Text>
          <ModeCard
            icon="grid"
            title="Explore Hairstyles"
            body="Browse curated styles you can try on."
            engine="YouCam hairstyle templates"
            onPress={start}
          />
          <ModeCard
            icon="upload"
            title="Try My Inspiration"
            body="Upload a hairstyle reference photo."
            engine="YouCam custom reference"
          />
          <ModeCard icon="sparkle" title="Explore Hair Colors" body="Coming in Phase 4B" engine="YouCam AI Hair Color" />
        </View>

        <View className="flex-row justify-between rounded-lg bg-blush px-3 py-3">
          {STRIP.map(({ label, detail }, index) => (
            <View key={label} className="flex-1 items-center gap-1">
              <View
                className={`h-7 w-7 items-center justify-center rounded-full ${index === 0 ? 'bg-plum' : 'bg-canvas'}`}>
                <Text
                  className={`font-serif-italic text-[16px] leading-[20px] ${
                    index === 0 ? 'text-white' : 'text-plum'
                  }`}>
                  {index + 1}
                </Text>
              </View>
              <Text className="font-sans-semibold text-label-s text-ink">{label}</Text>
              <Text className="text-center font-sans text-caption text-muted">{detail}</Text>
            </View>
          ))}
        </View>

        <Text className="text-center font-sans text-body-s text-muted">
          Works from a photo you choose — not a live camera filter.
        </Text>
      </ScrollView>

      <Sheet
        visible={tutorialOpen}
        onClose={closeTutorial}
        eyebrow="Hair Studio · First time"
        title={
          <>
            How Hair Try-On <Text className="font-serif-italic text-plum">Works</Text>
          </>
        }>
        <View className="gap-3 rounded-[22px] border border-blush bg-card p-3">
          {TUTORIAL_STEPS.map((step, index) => (
            <View key={step} className="flex-row items-center gap-3">
              <View
                className={`h-8 w-8 items-center justify-center rounded-full ${index === 0 ? 'bg-plum' : 'bg-blush'}`}>
                <Text
                  className={`font-serif-italic text-[18px] leading-[22px] ${
                    index === 0 ? 'text-white' : 'text-plum'
                  }`}>
                  {index + 1}
                </Text>
              </View>
              <Text className="flex-1 font-sans text-body-m text-ink">{step}</Text>
            </View>
          ))}
        </View>
        <Text className="font-sans text-caption text-muted">
          Works from a photo, not a live camera. Replay this anytime from the ? at the top.
        </Text>
        <Button
          label="Let’s Try It"
          onPress={() => {
            closeTutorial();
            start();
          }}
        />
        <Text
          accessibilityRole="button"
          onPress={closeTutorial}
          className="self-center px-4 py-2 font-sans-semibold text-label text-plum">
          Skip Tutorial
        </Text>
      </Sheet>
    </View>
  );
}
