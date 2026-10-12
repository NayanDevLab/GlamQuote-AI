import { router } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SplashMirror } from '@/components/illustrations';
import { Wordmark } from '@/components/ui/brand';
import { useAppStore } from '@/state/app-store';

// Design spec (Phase1-Navigation): the branded splash holds for about 1.2 s, with no tap needed.
const SPLASH_HOLD_MS = 1200;
const LOADER_TRACK = 56;
const LOADER_BAR = 24;

export default function Splash() {
  const insets = useSafeAreaInsets();
  const onboardingComplete = useAppStore((state) => state.onboardingComplete);

  useEffect(() => {
    // replace() so Android Back never returns to the splash.
    const timer = setTimeout(() => {
      router.replace(onboardingComplete ? '/home' : '/discover');
    }, SPLASH_HOLD_MS);
    return () => clearTimeout(timer);
  }, [onboardingComplete]);

  // Reanimated follows the system "reduce motion" setting, so both animations are skipped when it is on.
  const rise = useSharedValue(0);
  const sweep = useSharedValue(0);

  useEffect(() => {
    rise.set(withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) }));
    sweep.set(withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1));
  }, [rise, sweep]);

  const riseStyle = useAnimatedStyle(() => ({
    opacity: rise.get(),
    transform: [{ translateY: (1 - rise.get()) * 8 }],
  }));

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -LOADER_BAR + sweep.get() * (LOADER_TRACK + LOADER_BAR) }],
  }));

  return (
    <View className="flex-1 items-center justify-center bg-canvas px-6">
      <Animated.View style={riseStyle}>
        <View className="items-center gap-7">
          <SplashMirror />
          <View className="items-center gap-3">
            <Wordmark size="lg" />
            <Text className="text-center font-serif-italic text-[22px] leading-[27px] text-muted">
              Your Look. Your Choice. No Surprises.
            </Text>
          </View>
        </View>
      </Animated.View>

      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Loading GlamQuote AI"
        style={{ bottom: 56 + insets.bottom, width: LOADER_TRACK }}
        className="absolute h-0.5 overflow-hidden rounded-full bg-line">
        <Animated.View style={sweepStyle}>
          <View style={{ width: LOADER_BAR }} className="h-0.5 bg-plum" />
        </Animated.View>
      </View>
    </View>
  );
}
