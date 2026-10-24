import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { ModeCard } from '@/components/ui/mode-card';
import { PhotoSlot } from '@/components/ui/photo-slot';
import { Sheet } from '@/components/ui/sheet';
import { useNailSession } from '@/features/nail/nail-session';
import { colors, shadows } from '@/theme';

const TUTORIAL_STEPS = [
  'Add a clear photo of your hand.',
  'Choose an inspiration or customize your nails.',
  'Generate a preview and compare your results.',
];

export default function NailStudio() {
  const insets = useSafeAreaInsets();
  const tutorialSeen = useNailSession((state) => state.tutorialSeen);
  const markTutorialSeen = useNailSession((state) => state.markTutorialSeen);
  const hasHand = useNailSession((state) => state.hand !== null);
  const attempt = useNailSession((state) => state.attempt);
  // Shown automatically on the first visit only; the ? replays it at any time.
  const [tutorialOpen, setTutorialOpen] = useState(!tutorialSeen);

  const closeTutorial = () => {
    markTutorialSeen();
    setTutorialOpen(false);
  };

  // A photo chosen earlier in the session is reused, so the flow resumes at design selection.
  const start = () => router.push(hasHand ? '/nail/designs' : '/nail/photo');

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <View className="h-12 flex-row items-center justify-between px-2">
        <IconButton icon="arrowLeft" label="Back" strokeWidth={1.8} onPress={() => router.back()} />
        <Text className="font-sans-semibold text-overline uppercase text-muted">Nail Studio</Text>
        <IconButton icon="help" label="How Nail Try-On works" onPress={() => setTutorialOpen(true)} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        contentContainerClassName="gap-4 px-5 pt-2"
        showsVerticalScrollIndicator={false}>
        <PhotoSlot tone="warm" className="h-[190px] rounded-lg" style={shadows.card}>
          <View className="absolute left-3 top-3 flex-row items-center gap-1.5 rounded-full bg-canvas/95 px-2.5 py-[5px]">
            <Icon name="image" size={13} color={colors.plum} strokeWidth={2} />
            <Text className="font-sans-semibold text-caption text-plum">AI try-on from your photo</Text>
          </View>
        </PhotoSlot>

        <View className="gap-2">
          <Text accessibilityRole="header" className="font-serif text-hero text-ink">
            Your Nails, <Text className="font-serif-italic text-plum">Reimagined.</Text>
          </Text>
          <Text className="font-sans text-body-l text-muted">
            Discover nail designs and preview them on your own hands.
          </Text>
        </View>

        {attempt?.taskId ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/nail/generating')}
            className="flex-row items-center gap-3 rounded-lg bg-blush p-3.5 active:bg-line">
            <Icon name="clock" size={20} color={colors.plum} />
            <View className="flex-1">
              <Text className="font-sans-semibold text-label-s text-ink">A preview is in progress</Text>
              <Text className="font-sans text-body-s text-muted">Tap to see how it’s going.</Text>
            </View>
            <Icon name="chevronRight" size={18} color={colors.plum} />
          </Pressable>
        ) : attempt ? (
          // Never confirmed by YouCam (e.g. it stopped offline). Sending it again could use a unit
          // for an old photo and choices, so the user decides: send it, or discard it.
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
                onPress={() => useNailSession.getState().endAttempt()}
                className="px-3 py-2 font-sans-semibold text-label-s text-plum">
                Discard
              </Text>
              <Text
                accessibilityRole="button"
                onPress={() => router.push('/nail/generating')}
                className="px-3 py-2 font-sans-semibold text-label-s text-plum">
                Send Again
              </Text>
            </View>
          </View>
        ) : null}

        <View className="gap-3 pt-1">
          <Text className="font-sans-semibold text-overline uppercase text-muted">Choose how to start</Text>
          <ModeCard
            icon="image"
            title="Try Inspiration"
            body="Preview a nail design from a reference photo."
            engine="YouCam AI Nail Transfer"
            onPress={start}
          />
          <ModeCard
            icon="sparkle"
            title="Customize My Nails"
            body="Explore nail colors, finishes and supported shapes."
            engine="YouCam AI Nail Virtual Try-On"
            onPress={() => router.push('/nail/customize')}
          />
        </View>

        <View className="flex-row items-center justify-between rounded-lg bg-blush px-4 py-3">
          {['Choose', 'Preview', 'Compare'].map((label, index) => (
            <View key={label} className="flex-row items-center gap-2">
              <View
                className={`h-7 w-7 items-center justify-center rounded-full ${
                  index === 0 ? 'bg-plum' : 'bg-canvas'
                }`}>
                <Text
                  className={`font-serif-italic text-[16px] leading-[20px] ${
                    index === 0 ? 'text-white' : 'text-plum'
                  }`}>
                  {index + 1}
                </Text>
              </View>
              <Text className="font-sans-semibold text-label-s text-ink">{label}</Text>
            </View>
          ))}
        </View>

        <Text className="text-center font-sans text-body-s text-muted">
          Both start from a photo of your hand — not a live camera filter.
        </Text>
      </ScrollView>

      <Sheet
        visible={tutorialOpen}
        onClose={closeTutorial}
        eyebrow="Nail Studio"
        title={
          <>
            How Nail Try-On <Text className="font-serif-italic text-plum">Works</Text>
          </>
        }>
        <Text className="font-sans text-body-m text-muted">
          Two ways to try a look. Both start with a clear photo of your hand.
        </Text>
        <View className="gap-3 rounded-[22px] border border-blush bg-card p-3">
          {TUTORIAL_STEPS.map((step, index) => (
            <View key={step} className="flex-row items-center gap-3">
              <View
                className={`h-8 w-8 items-center justify-center rounded-full ${
                  index === 0 ? 'bg-plum' : 'bg-blush'
                }`}>
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
        <Text className="font-sans text-caption text-muted">Replay this anytime from the ? at the top.</Text>
        <Button
          label="Let’s Try It"
          onPress={() => {
            closeTutorial();
            start();
          }}
        />
      </Sheet>
    </View>
  );
}
