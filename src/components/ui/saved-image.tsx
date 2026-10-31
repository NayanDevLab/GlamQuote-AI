import { Image, type ImageStyle } from 'expo-image';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { colors } from '@/theme';

import { Icon } from './icon';

/**
 * A saved look's private image. If it can't be loaded (offline, expired link), shows a placeholder
 * with Retry instead of a blank box — the look itself is never hidden or deleted because of it.
 */
export function SavedImage({ uri, label, style }: { uri: string; label: string; style: ImageStyle }) {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  if (failed) {
    return (
      <View
        accessible
        accessibilityLabel={`${label}: couldn’t load`}
        style={[style, { alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.blush }]}>
        <Icon name="image" size={22} color={colors.plum} />
        <Text className="font-sans text-caption text-muted">Couldn’t load</Text>
        <Text
          accessibilityRole="button"
          accessibilityLabel={`Retry loading ${label}`}
          onPress={() => {
            setFailed(false);
            setAttempt((count) => count + 1);
          }}
          className="px-3 py-1 font-sans-semibold text-label-s text-plum">
          Retry
        </Text>
      </View>
    );
  }
  return (
    <Image
      key={attempt}
      source={{ uri }}
      contentFit="cover"
      cachePolicy="disk"
      accessibilityLabel={label}
      onError={() => setFailed(true)}
      style={[style, { backgroundColor: colors.blush }]}
    />
  );
}
