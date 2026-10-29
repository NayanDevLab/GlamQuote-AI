import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { onboardingImages } from '@/assets/images';
import { OnboardingStep } from '@/features/onboarding/onboarding-step';

export default function OnboardingDiscover() {
  return (
    <OnboardingStep
      step={1}
      overline="Discover"
      title={
        <>
          Discover Your Next <Text className="font-serif-italic text-plum">Look</Text>
        </>
      }
      body="Explore styles that match your preferences, with a little help from AI."
      next="/try-on"
      art={
        <View className="h-[250px] flex-row gap-2.5">
          <View className="relative flex-1 overflow-hidden rounded-md bg-blush">
            <Image
              source={onboardingImages.discover.d1ManTwists}
              contentFit="cover"
              accessibilityLabel="Man with short coily twists"
              style={StyleSheet.absoluteFill}
            />
          </View>
          <View className="flex-1 gap-2.5">
            <View className="relative flex-1 overflow-hidden rounded-md bg-blush">
              <Image
                source={onboardingImages.discover.d2MilkyNude}
                contentFit="cover"
                accessibilityLabel="Hand with milky nude square nails"
                style={StyleSheet.absoluteFill}
              />
            </View>
            <View className="relative flex-1 overflow-hidden rounded-md bg-blush">
              <Image
                source={onboardingImages.discover.d3SilverWaves}
                contentFit="cover"
                accessibilityLabel="Woman with silver chin-length waves"
                style={StyleSheet.absoluteFill}
              />
            </View>
          </View>
        </View>
      }
    />
  );
}
