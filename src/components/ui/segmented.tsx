import { Pressable, Text, View } from 'react-native';

import { shadows } from '@/theme';

/** Two-or-more option pill switch (e.g. Presets / Custom Color). */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <View accessibilityRole="tablist" accessibilityLabel={label} className="flex-row rounded-full bg-blush p-1">
      {options.map((option) => {
        const on = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(option.value)}
            style={on ? shadows.card : undefined}
            className={`h-11 flex-1 items-center justify-center rounded-full ${on ? 'bg-card' : ''}`}>
            <Text className={`font-sans-semibold text-[15px] ${on ? 'text-plum' : 'text-muted'}`}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
