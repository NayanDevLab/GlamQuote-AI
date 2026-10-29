import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { onboardingImages } from '@/assets/images';
import { Monogram, Wordmark } from '@/components/ui/brand';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { HOW_IT_WORKS_ICONS, StepList, type Step } from '@/components/ui/step-list';
import { InlineNote } from '@/components/ui/typography';

const STEPS: Step[] = [
  {
    icon: HOW_IT_WORKS_ICONS[0],
    title: 'Discover',
    body: 'Browse styles, or let Look Finder suggest ones that match what you like.',
  },
  {
    icon: HOW_IT_WORKS_ICONS[1],
    title: 'Try On',
    body: 'Choose a photo, pick a hairstyle or nail design, and get an AI preview.',
  },
  {
    icon: HOW_IT_WORKS_ICONS[2],
    title: 'Compare & Decide',
    body: 'Put looks side by side, get helpful insights, and save your favourite.',
  },
];

const ARCH = {
  borderTopLeftRadius: 124,
  borderTopRightRadius: 124,
  borderBottomLeftRadius: 24,
  borderBottomRightRadius: 24,
} as const;

export default function Welcome() {
  const insets = useSafeAreaInsets();
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: 'center',
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 24,
      }}
      contentContainerClassName="px-5"
      showsVerticalScrollIndicator={false}>
      <View className="h-12 flex-row items-center gap-2.5">
        <Monogram />
        <Wordmark />
      </View>

      <View className="mt-5 h-[288px] w-[248px]">
        <View
          style={ARCH}
          className="absolute left-3 top-3 h-[288px] w-[248px] border border-champagne"
        />
        <View
          style={{ ...ARCH, boxShadow: '0 18px 34px -24px rgba(41, 36, 42, 0.6)' }}
          className="relative h-[288px] w-[248px] overflow-hidden bg-blush">
          <Image
            source={onboardingImages.welcome}
            contentFit="cover"
            accessibilityLabel="Two adults side by side with natural hair textures in warm soft studio lighting"
            style={StyleSheet.absoluteFill}
          />
        </View>
      </View>

      <View className="items-center gap-3 pt-7">
        <Text accessibilityRole="header" className="text-center font-serif text-hero text-ink">
          Your next look <Text className="font-serif-italic text-plum">starts here.</Text>
        </Text>
        <Text className="max-w-[300px] text-center font-sans text-body-l text-muted">
          Explore styles and discover what feels right for you.
        </Text>
      </View>

      <View className="min-h-6 flex-1" />

      <View className="gap-2.5 self-stretch">
        {/* Guest entry: no sign-in is ever required to explore. */}
        <Button
          label="Continue as Guest"
          trailingIcon="arrowRight"
          onPress={() => router.replace('/home')}
        />
        <Button label="Learn How It Works" variant="secondary" onPress={() => setSheetOpen(true)} />
        <View className="mt-1">
          <InlineNote icon="check" centered>
            No account required to get started.
          </InlineNote>
        </View>
      </View>

      <Sheet visible={sheetOpen} onClose={() => setSheetOpen(false)} title="How GlamQuote AI works">
        <StepList steps={STEPS} compact />
        <InlineNote icon="info">AI previews are illustrative. Actual results may vary.</InlineNote>
        <Button label="Got it" onPress={() => setSheetOpen(false)} />
      </Sheet>
    </ScrollView>
  );
}
