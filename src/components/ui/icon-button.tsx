import { Pressable } from 'react-native';

import { Icon, type IconName } from './icon';

type IconButtonProps = {
  icon: IconName;
  /** Required: icon buttons have no visible text. */
  label: string;
  onPress: () => void;
  /** Blush fill with a hairline border (e.g. the Profile button). */
  tonal?: boolean;
  strokeWidth?: number;
};

/** 48×48 minimum touch target, per the design system. */
export function IconButton({ icon, label, onPress, tonal = false, strokeWidth = 1.7 }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className={`h-12 w-12 items-center justify-center rounded-full ${
        tonal ? 'border border-line bg-blush active:bg-line' : 'active:bg-blush'
      }`}>
      <Icon name={icon} strokeWidth={strokeWidth} />
    </Pressable>
  );
}
