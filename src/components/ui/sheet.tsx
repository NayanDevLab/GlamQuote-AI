import { useEffect, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { shadows } from '@/theme';

import { IconButton } from './icon-button';

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Serif sheet title; pass nested <Text> for the italic plum accent. */
  title: ReactNode;
  /** Optional plum eyebrow above the title. */
  eyebrow?: string;
  children: ReactNode;
};

/**
 * Bottom sheet over a dimmed backdrop. Closes from the close button, the backdrop, or
 * Android Back (which dismisses the sheet before leaving the screen).
 */
export function Sheet({ visible, onClose, title, eyebrow, children }: SheetProps) {
  const insets = useSafeAreaInsets();

  // Rise 40dp while fading in, as in the design. Driven by a shared value rather than a layout
  // "entering" animation, which left the sheet floating above the bottom edge on Android.
  const rise = useSharedValue(0);
  useEffect(() => {
    rise.set(visible ? withTiming(1, { duration: 260, easing: Easing.out(Easing.ease) }) : 0);
  }, [visible, rise]);
  const riseStyle = useAnimatedStyle(() => ({
    opacity: rise.get(),
    transform: [{ translateY: (1 - rise.get()) * 40 }],
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}>
      <View className="flex-1 justify-end">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
          className="bg-ink/45"
        />
        <Animated.View style={riseStyle}>
          <View
            accessibilityViewIsModal
            style={[shadows.sheet, { paddingBottom: 24 + insets.bottom }]}
            className="gap-4 rounded-t-[28px] bg-canvas px-5 pt-2.5">
            <View className="h-1 w-9 self-center rounded-full bg-line-strong" />
            <View className="-mr-3 flex-row items-start justify-between gap-2">
              <View className="flex-1 gap-1.5 pt-1.5">
                {eyebrow ? (
                  <Text className="font-sans-semibold text-overline uppercase text-plum">
                    {eyebrow}
                  </Text>
                ) : null}
                <Text accessibilityRole="header" className="font-serif text-headline text-ink">
                  {title}
                </Text>
              </View>
              <IconButton icon="close" label="Close" onPress={onClose} strokeWidth={1.8} />
            </View>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
