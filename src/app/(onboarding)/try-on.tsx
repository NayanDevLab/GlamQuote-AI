import { Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { PhotoSlot } from '@/components/ui/photo-slot';
import { OnboardingStep } from '@/features/onboarding/onboarding-step';
import { colors } from '@/theme';

export default function OnboardingTryOn() {
  return (
    <OnboardingStep
      step={2}
      overline="Try on"
      title={
        <>
          See It On <Text className="font-serif-italic text-plum">You</Text>
        </>
      }
      body="Preview nail designs and hairstyles on your own photos before making a change."
      note="AI previews are illustrative. Actual results may vary."
      next="/compare"
      art={
        <View
          style={{ boxShadow: '0 14px 30px -20px rgba(41, 36, 42, 0.55)' }}
          className="h-[270px] flex-row overflow-hidden rounded-[22px]">
          <PhotoSlot tone="cool" className="flex-1">
            <View className="absolute left-2.5 top-2.5 rounded-full bg-canvas/95 px-2.5 py-[5px]">
              <Text className="font-sans-semibold text-caption text-ink">Your photo</Text>
            </View>
          </PhotoSlot>
          <PhotoSlot tone="cool" focusX={0.7} className="flex-1">
            <View className="absolute right-2.5 top-2.5 rounded-full bg-plum px-2.5 py-[5px]">
              <Text className="font-sans-semibold text-caption text-white">AI preview</Text>
            </View>
          </PhotoSlot>
          <View className="absolute bottom-0 left-1/2 top-0 -ml-px w-0.5 bg-canvas" />
          <View
            style={{ boxShadow: '0 6px 16px -6px rgba(41, 36, 42, 0.5)' }}
            className="absolute left-1/2 top-1/2 -ml-5 -mt-5 h-10 w-10 items-center justify-center rounded-full bg-card">
            <Icon name="compare" size={20} color={colors.plum} strokeWidth={2} />
          </View>
        </View>
      }
    />
  );
}
