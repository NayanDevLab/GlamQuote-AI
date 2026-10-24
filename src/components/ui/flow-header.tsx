import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { colors } from '@/theme';

import { Icon } from './icon';
import { IconButton } from './icon-button';

/** Back button plus the numbered progress (e.g. Photo → Design → Review) of a studio flow. */
export function FlowHeader({ step, steps }: { step: number; steps: readonly string[] }) {
  return (
    <View className="h-12 flex-row items-center pl-2 pr-5">
      <IconButton icon="arrowLeft" label="Back" strokeWidth={1.8} onPress={() => router.back()} />
      <View
        accessible
        accessibilityLabel={`Step ${step} of ${steps.length}: ${steps[step - 1]}`}
        className="flex-1 flex-row items-center gap-2 pl-1">
        {steps.map((label, index) => {
          const position = index + 1;
          const done = position < step;
          const current = position === step;
          return (
            <View key={label} className="flex-row items-center gap-2">
              {index > 0 ? <View className="h-px w-3 bg-champagne" /> : null}
              <View
                className={`h-[22px] w-[22px] items-center justify-center rounded-full ${
                  current ? 'bg-plum' : done ? 'bg-blush' : 'border border-line-strong'
                }`}>
                {done ? (
                  <Icon name="check" size={12} color={colors.plum} strokeWidth={2.4} />
                ) : (
                  <Text
                    className={`font-sans-semibold text-[12px] leading-[15px] ${
                      current ? 'text-white' : 'text-muted'
                    }`}>
                    {position}
                  </Text>
                )}
              </View>
              <Text
                className={`text-body-s ${
                  current ? 'font-sans-semibold text-plum' : 'font-sans-medium text-muted'
                }`}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
