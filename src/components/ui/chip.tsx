import { Pressable, Text } from 'react-native';

type ChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Category chips are 44 high, filter chips 40. */
  size?: 'md' | 'sm';
};

export function Chip({ label, selected, onPress, size = 'sm' }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={4}
      className={`items-center justify-center rounded-full px-4 ${size === 'md' ? 'h-11' : 'h-10'} ${
        selected ? 'bg-plum' : 'border border-line-strong active:bg-blush'
      }`}>
      <Text
        className={`text-label-s ${
          selected ? 'font-sans-semibold text-white' : 'font-sans-medium text-ink'
        }`}>
        {label}
      </Text>
    </Pressable>
  );
}
