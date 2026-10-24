import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Sticky action bar pinned above the bottom safe area; content scrolls behind it. */
export function FooterBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{ paddingBottom: insets.bottom + 12 }}
      className="gap-2.5 border-t border-line bg-canvas px-5 pt-3">
      {children}
    </View>
  );
}
