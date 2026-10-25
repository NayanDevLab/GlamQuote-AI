import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Overline } from '@/components/ui/typography';

// Destinations that Phase 1 links to but does not build. Each is replaced by its real route
// (and this file deleted) as the corresponding flow is implemented.
const FEATURES: Record<string, string> = {
  'hair-studio': 'Hair Studio',
  settings: 'Settings',
  help: 'Help',
};

export default function PendingFeature() {
  const insets = useSafeAreaInsets();
  const { feature } = useLocalSearchParams<{ feature: string }>();
  const title = FEATURES[feature] ?? 'This screen';

  return (
    <View
      className="flex-1 bg-canvas px-5"
      style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }}>
      <View className="-ml-3 h-12 justify-center">
        <IconButton icon="arrowLeft" label="Back" strokeWidth={1.8} onPress={() => router.back()} />
      </View>
      <View className="flex-1 justify-center gap-3">
        <Overline>Not built yet</Overline>
        <Text accessibilityRole="header" className="font-serif text-hero text-ink">
          {title} <Text className="font-serif-italic text-plum">is next.</Text>
        </Text>
        <Text className="font-sans text-body-l text-muted">
          This part of GlamQuote AI is not available in this build. Nothing here is simulated.
        </Text>
      </View>
      <Button label="Go Back" variant="secondary" onPress={() => router.back()} />
    </View>
  );
}
