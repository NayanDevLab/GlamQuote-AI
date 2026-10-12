import { router, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { InlineNote, Overline } from '@/components/ui/typography';
import { useAppStore } from '@/state/app-store';

const TOTAL_STEPS = 3;

type OnboardingStepProps = {
  step: 1 | 2 | 3;
  overline: string;
  /** Serif title; pass nested <Text> for the italic plum accent. */
  title: ReactNode;
  body: string;
  note?: string;
  /** Illustration area above the copy. */
  art: ReactNode;
  /** Next step, or omit on the last step to show "Get Started". */
  next?: Href;
};

/** Shared layout for the three onboarding steps: top bar, art, copy, progress dots and CTA. */
export function OnboardingStep({ step, overline, title, body, note, art, next }: OnboardingStepProps) {
  const insets = useSafeAreaInsets();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);

  // Skip (any step) and Get Started both mark onboarding done and replace the stack with Welcome.
  const finish = () => {
    completeOnboarding();
    router.replace('/welcome');
  };

  const dots = (
    <View
      accessible
      accessibilityLabel={`Step ${step} of ${TOTAL_STEPS}`}
      className="flex-row items-center gap-1.5">
      {Array.from({ length: TOTAL_STEPS }, (_, index) => (
        <View
          key={index}
          className={`h-2 rounded-full ${index + 1 === step ? 'w-6 bg-plum' : 'w-2 bg-line-strong'}`}
        />
      ))}
    </View>
  );

  return (
    <ScrollView
      className="flex-1 bg-canvas"
      contentContainerStyle={{
        flexGrow: 1,
        paddingTop: insets.top + 12,
        paddingBottom: insets.bottom + 24,
      }}
      contentContainerClassName="px-5"
      showsVerticalScrollIndicator={false}>
      <View className="-ml-3 -mr-2 h-12 flex-row items-center justify-between">
        {step > 1 ? (
          <IconButton icon="arrowLeft" label="Back" strokeWidth={1.8} onPress={() => router.back()} />
        ) : (
          <View className="h-12 w-12" />
        )}
        {next ? (
          <Pressable
            accessibilityRole="button"
            onPress={finish}
            className="h-12 justify-center rounded-full px-4 active:bg-blush">
            <Text className="font-sans-semibold text-label text-plum">Skip</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="pt-2">{art}</View>

      <View className="gap-3 pt-7">
        <Overline>{overline}</Overline>
        <Text accessibilityRole="header" className="font-serif text-hero text-ink">
          {title}
        </Text>
        <Text className="font-sans text-body-l text-muted">{body}</Text>
        {note ? <InlineNote icon="info">{note}</InlineNote> : null}
      </View>

      <View className="min-h-6 flex-1" />

      {next ? (
        <View className="flex-row items-center justify-between">
          {dots}
          <Button
            label="Next"
            trailingIcon="arrowRight"
            className="pl-[30px] pr-[26px]"
            onPress={() => router.push(next)}
          />
        </View>
      ) : (
        <View className="items-center gap-4">
          {dots}
          <Button
            label="Get Started"
            trailingIcon="arrowRight"
            className="self-stretch"
            onPress={finish}
          />
        </View>
      )}
    </ScrollView>
  );
}
