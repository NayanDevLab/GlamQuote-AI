import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { colors } from '@/theme';

/** P7A screen shell: back button, uppercase title, scrolling content (Settings, Help, Privacy, About). */
export function SettingsScreen({
  title,
  backLabel = 'Back',
  children,
}: {
  title: string;
  backLabel?: string;
  children: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <View className="h-12 flex-row items-center justify-between px-2">
        <IconButton icon="arrowLeft" label={backLabel} strokeWidth={1.8} onPress={() => router.back()} />
        <Text className="font-sans-semibold text-overline uppercase text-muted">{title}</Text>
        <View className="w-12" />
      </View>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        contentContainerClassName="gap-[18px] px-4 pt-1"
        showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </View>
  );
}

/** A labelled group of rows in one rounded card. */
export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text accessibilityRole="header" className="px-1 font-sans-semibold text-overline uppercase text-muted">
        {title}
      </Text>
      <View className="overflow-hidden rounded-[20px] border border-blush bg-card">{children}</View>
    </View>
  );
}

type RowProps = {
  icon: IconName;
  title: string;
  subtitle?: string;
  /** Rows without an action are information only: no chevron and not pressable. */
  onPress?: () => void;
  /** Replaces the chevron (e.g. a value or a Replay button). */
  trailing?: ReactNode;
  badge?: string;
  first?: boolean;
  accessibilityLabel?: string;
};

export function SettingsRow({ icon, title, subtitle, onPress, trailing, badge, first, accessibilityLabel }: RowProps) {
  const content = (
    <>
      <View className="h-10 w-10 items-center justify-center rounded-full bg-blush">
        <Icon name={icon} size={20} color={colors.plum} />
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <View className="flex-row flex-wrap items-center gap-1.5">
          <Text className="font-sans-semibold text-label-s text-ink">{title}</Text>
          {badge ? (
            <Text
              className={`rounded-full px-2 py-0.5 font-sans-bold text-[12px] leading-[15px] ${
                badge === 'Seen' ? 'border border-line text-muted' : 'bg-blush text-plum'
              }`}>
              {badge}
            </Text>
          ) : null}
        </View>
        {subtitle ? <Text className="font-sans text-caption text-muted">{subtitle}</Text> : null}
      </View>
      {trailing ?? (onPress ? <Icon name="chevronRight" size={18} color={colors.muted} strokeWidth={2} /> : null)}
    </>
  );
  const className = `min-h-[60px] flex-row items-center gap-3 px-3.5 py-2 ${first ? '' : 'border-t border-blush'}`;
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      className={`${className} active:bg-blush`}>
      {content}
    </Pressable>
  ) : (
    <View accessible accessibilityLabel={accessibilityLabel} className={className}>
      {content}
    </View>
  );
}

/** Plain explanatory paragraph inside a card (Privacy & About). */
export function SettingsNote({ children }: { children: ReactNode }) {
  return <Text className="px-1 font-sans text-body-s text-muted">{children}</Text>;
}
