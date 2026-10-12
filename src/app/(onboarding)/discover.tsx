import { Text, View } from 'react-native';

import { PhotoSlot } from '@/components/ui/photo-slot';
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
          <PhotoSlot tone="cool" className="flex-1 rounded-md" />
          <View className="flex-1 gap-2.5">
            <PhotoSlot tone="warm" className="flex-1 rounded-md" />
            <PhotoSlot tone="cool" className="flex-1 rounded-md" />
          </View>
        </View>
      }
    />
  );
}
