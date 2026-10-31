import { Image, type ImageSource } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { onboardingImages } from '@/assets/images';
import { OnboardingStep } from '@/features/onboarding/onboarding-step';

function LookCard({ label, style, image }: { label: string; style: string; image: ImageSource }) {
  return (
    <View className="flex-1 rounded-[22px] border border-blush bg-card p-1.5">
      <View className="relative h-[184px] overflow-hidden rounded-[16px] bg-blush">
        <Image
          source={image}
          contentFit="cover"
          accessibilityLabel={`Illustrative sample: ${label}: ${style}`}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View className="gap-px px-1.5 pb-1.5 pt-2.5">
        <Text className="font-sans-semibold text-label-s text-ink">{label}</Text>
        <Text className="font-sans text-body-s text-muted">{style}</Text>
      </View>
    </View>
  );
}

export default function OnboardingCompare() {
  return (
    <OnboardingStep
      step={3}
      overline="Compare & decide"
      title={
        <>
          Choose With <Text className="font-serif-italic text-plum">Confidence</Text>
        </>
      }
      body="Compare your favorite looks, get helpful insights, and save the one you love."
      note="Sample comparison — illustrative example on sample model."
      art={
        <View className="flex-row gap-3.5">
          <LookCard label="Look A" style="Sleek long layers" image={onboardingImages.compare.c1LookA} />
          <LookCard label="Look B" style="Curly chin-length bob" image={onboardingImages.compare.c2LookB} />
          <View className="absolute left-1/2 top-[76px] -ml-[28px] rounded-full bg-champagne p-px">
            <View className="rounded-full bg-canvas p-1">
              <View className="h-[46px] w-[46px] items-center justify-center rounded-full bg-plum">
                <Text className="font-serif-italic text-[22px] leading-[26px] text-canvas">vs</Text>
              </View>
            </View>
          </View>
        </View>
      }
    />
  );
}
