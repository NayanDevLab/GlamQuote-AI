import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Icon, type IconName } from './icon';
import { colors } from '@/theme';

/** Uppercase eyebrow label, optionally led by the champagne hairline. */
export function Overline({ children, rule = true }: { children: string; rule?: boolean }) {
  const label = (
    <Text className="font-sans-semibold text-overline uppercase text-muted">{children}</Text>
  );
  if (!rule) return label;
  return (
    <View className="flex-row items-center gap-2.5">
      <View className="h-px w-6 bg-champagne" />
      {label}
    </View>
  );
}

/** Serif section headline with an optional supporting note on the right. */
export function SectionHeader({ title, note }: { title: string; note?: string }) {
  return (
    <View className="flex-row items-baseline justify-between">
      <Text accessibilityRole="header" className="font-serif text-headline text-ink">
        {title}
      </Text>
      {note ? <Text className="font-sans text-body-s text-muted">{note}</Text> : null}
    </View>
  );
}

/** Small reassurance line: a plum icon followed by muted text. */
export function InlineNote({
  icon,
  children,
  centered = false,
  size = 'md',
}: {
  icon: IconName;
  children: ReactNode;
  centered?: boolean;
  size?: 'md' | 'sm';
}) {
  return (
    <View className={`flex-row gap-1.5 ${centered ? 'items-center justify-center' : 'items-start'}`}>
      <View className={centered ? '' : 'mt-0.5'}>
        <Icon name={icon} size={size === 'md' ? 15 : 14} color={colors.plum} strokeWidth={2} />
      </View>
      <Text
        className={`shrink font-sans text-muted ${size === 'md' ? 'text-body-s' : 'text-caption'}`}>
        {children}
      </Text>
    </View>
  );
}
