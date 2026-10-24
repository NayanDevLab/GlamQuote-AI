import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/theme';

import { Icon } from './icon';

/** A sweeping bar for work with no measurable progress (YouCam reports none). */
export function IndeterminateBar() {
  const sweep = useSharedValue(0);
  useEffect(() => {
    sweep.set(withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.ease) }), -1));
  }, [sweep]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: -44 + sweep.get() * 164 }] }));
  return (
    <View className="h-[3px] w-[120px] overflow-hidden rounded-full bg-canvas/70">
      <Animated.View style={style}>
        <View className="h-[3px] w-11 rounded-full bg-plum" />
      </Animated.View>
    </View>
  );
}

/** One verifiable step of a generation: only states the app actually knows are shown as done. */
export function StatusRow({
  state,
  label,
  detail,
}: {
  state: 'done' | 'active' | 'pending';
  label: string;
  detail?: string;
}) {
  return (
    <View className="flex-row items-center gap-3">
      {state === 'done' ? (
        <View className="h-6 w-6 items-center justify-center rounded-full bg-plum">
          <Icon name="check" size={13} color={colors.white} strokeWidth={2.6} />
        </View>
      ) : state === 'active' ? (
        <View className="h-6 w-6 items-center justify-center rounded-full border-2 border-plum">
          <View className="h-2.5 w-2.5 rounded-full bg-plum" />
        </View>
      ) : (
        <View className="h-6 w-6 rounded-full border border-dashed border-line-strong" />
      )}
      <View className="flex-1">
        <Text
          className={`text-body-l ${
            state === 'active'
              ? 'font-sans-semibold text-ink'
              : state === 'done'
                ? 'font-sans text-ink'
                : 'font-sans text-muted'
          }`}>
          {label}
        </Text>
        {detail && state === 'active' ? <Text className="font-sans text-body-s text-muted">{detail}</Text> : null}
      </View>
    </View>
  );
}
