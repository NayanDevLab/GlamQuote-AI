import { Text, View } from 'react-native';

import { PhotoSlot } from '@/components/ui/photo-slot';
import { OnboardingStep } from '@/features/onboarding/onboarding-step';

function LookCard({ label, style, mirrored = false }: { label: string; style: string; mirrored?: boolean }) {
  return (
    <View className="flex-1 rounded-[22px] border border-blush bg-card p-1.5">
      <PhotoSlot tone="cool" focusX={mirrored ? 0.7 : 0.3} className="h-[184px] rounded-[16px]" />
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
      art={
        <View className="flex-row gap-3.5">
          <LookCard label="Look A" style="Sleek long layers" />
          <LookCard label="Look B" style="Curly chin-length bob" mirrored />
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
