import { Pressable, Text, type ViewStyle } from 'react-native';

import { colors, shadows } from '@/theme';

import { Icon, type IconName } from './icon';

type Variant = 'primary' | 'secondary' | 'tonal' | 'inverse';

const VARIANTS: Record<
  Variant,
  { box: string; label: string; iconColor: string; iconSize: number; shadow?: ViewStyle }
> = {
  // One primary per screen: 56 high, plum, the most saturated element above the fold.
  primary: {
    box: 'h-14 gap-2.5 bg-plum active:bg-plum-pressed',
    label: 'text-label-l text-white',
    iconColor: colors.white,
    iconSize: 20,
    shadow: shadows.primary,
  },
  secondary: {
    box: 'h-12 gap-2 border-[1.5px] border-line-strong active:bg-blush',
    label: 'text-label text-plum',
    iconColor: colors.plum,
    iconSize: 18,
  },
  // Ivory pill for use on blush surfaces.
  tonal: {
    box: 'h-12 gap-2 bg-canvas px-[22px] active:bg-card',
    label: 'text-label text-plum',
    iconColor: colors.plum,
    iconSize: 16,
    shadow: { boxShadow: '0 1px 0 #D9CBC3' },
  },
  // Ivory primary for use on plum surfaces.
  inverse: {
    box: 'h-14 gap-2.5 bg-canvas active:bg-blush',
    label: 'text-label-l text-plum',
    iconColor: colors.plum,
    iconSize: 20,
  },
};

// Disabled keeps the variant's size but drops to the muted line colour with no shadow.
const DISABLED_BOX: Record<Variant, string> = {
  primary: 'h-14 gap-2.5 bg-line',
  secondary: 'h-12 gap-2 border-[1.5px] border-line',
  tonal: 'h-12 gap-2 bg-line px-[22px]',
  inverse: 'h-14 gap-2.5 bg-line',
};

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  trailingIcon?: IconName;
  disabled?: boolean;
  /** Layout-only classes (margins, alignment, extra horizontal padding). */
  className?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  trailingIcon,
  disabled = false,
  className = '',
}: ButtonProps) {
  const v = VARIANTS[variant];
  const iconColor = disabled ? colors.muted : v.iconColor;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={disabled ? undefined : v.shadow}
      className={`flex-row items-center justify-center rounded-full ${
        disabled ? DISABLED_BOX[variant] : v.box
      } ${className}`}>
      {icon ? <Icon name={icon} size={v.iconSize} color={iconColor} /> : null}
      <Text className={`font-sans-semibold ${disabled ? `${v.label.split(' ')[0]} text-muted` : v.label}`}>
        {label}
      </Text>
      {trailingIcon ? (
        <Icon name={trailingIcon} size={v.iconSize - 2} color={iconColor} strokeWidth={2} />
      ) : null}
    </Pressable>
  );
}
