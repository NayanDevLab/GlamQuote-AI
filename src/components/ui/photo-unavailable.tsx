import { Text, View } from 'react-native';

import { colors } from '@/theme';

import { Icon } from './icon';

/**
 * Replaces the "Your photo" card when the chosen photo's file is gone (e.g. Android cleared the
 * app cache). Never a blank image: it says what happened and offers to choose the photo again.
 */
export function PhotoUnavailableCard({ onChoose, label = 'Your photo' }: { onChoose: () => void; label?: string }) {
  return (
    <View accessibilityLiveRegion="polite" className="flex-row items-center gap-3 rounded-lg bg-blush p-3">
      <View className="h-12 w-12 items-center justify-center rounded-[12px] bg-canvas">
        <Icon name="image" size={22} color={colors.plum} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="font-sans-semibold text-label-s text-ink">{label} is no longer available.</Text>
        <Text className="font-sans text-body-s text-muted">
          This phone cleared its copy. Nothing was sent. Your other choices are kept.
        </Text>
        <Text
          accessibilityRole="button"
          onPress={onChoose}
          className="self-start py-1.5 font-sans-semibold text-label-s text-plum">
          Choose Photo Again
        </Text>
      </View>
    </View>
  );
}
