import { Image } from 'expo-image';

import { colors } from '@/theme';

/** Rounded photo thumbnail of something the user picked. */
export function Thumb({ uri, size = 56 }: { uri: string; size?: number }) {
  return (
    <Image
      source={{ uri }}
      contentFit="cover"
      style={{ width: size, height: size, borderRadius: 12, backgroundColor: colors.blush }}
    />
  );
}
