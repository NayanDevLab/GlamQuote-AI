import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { onboardingImages } from '@/assets/images';
import { Icon } from '@/components/ui/icon';
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
      note="Sample preview — illustrative example on sample model. Actual results may vary."
      next="/compare"
      art={
        <View
          style={{ boxShadow: '0 14px 30px -20px rgba(41, 36, 42, 0.55)' }}
          className="h-[270px] flex-row overflow-hidden rounded-[22px]">
          <View className="relative flex-1 overflow-hidden bg-blush">
            <Image
              source={onboardingImages.tryOn.t1Original}
              contentFit="cover"
              accessibilityLabel="Illustrative sample: original photo with straight shoulder-length hair"
              style={StyleSheet.absoluteFill}
            />
            <View className="absolute left-2.5 top-2.5 rounded-full bg-canvas/95 px-2.5 py-[5px]">
              <Text className="font-sans-semibold text-caption text-ink">Your photo</Text>
            </View>
          </View>
          <View className="relative flex-1 overflow-hidden bg-blush">
            <Image
              source={onboardingImages.tryOn.t2Preview}
              contentFit="cover"
              accessibilityLabel="Illustrative sample: AI preview with textured shag haircut and curtain fringe on the same model"
              style={StyleSheet.absoluteFill}
            />
            <View className="absolute right-2.5 top-2.5 rounded-full bg-plum px-2.5 py-[5px]">
              <Text className="font-sans-semibold text-caption text-white">AI preview</Text>
            </View>
          </View>
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
