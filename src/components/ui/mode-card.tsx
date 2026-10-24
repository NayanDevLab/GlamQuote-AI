import { Pressable, Text, View } from 'react-native';

import { colors, shadows } from '@/theme';

import { Icon, type IconName } from './icon';

type ModeCardProps = {
  icon: IconName;
  title: string;
  body: string;
  engine: string;
  onPress?: () => void;
};

/** A way into the studio. Without `onPress` it is shown as not yet available. */
export function ModeCard({ icon, title, body, engine, onPress }: ModeCardProps) {
  const available = Boolean(onPress);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${body}${available ? '' : ' Under development.'}`}
      accessibilityState={{ disabled: !available }}
      disabled={!available}
      onPress={onPress}
      style={available ? shadows.card : undefined}
      className={`flex-row items-center gap-3.5 rounded-lg border border-blush p-3.5 ${
        available ? 'bg-card active:bg-canvas' : 'bg-canvas'
      }`}>
      <View
        className={`h-[52px] w-[52px] items-center justify-center rounded-[16px] ${
          available ? 'bg-plum' : 'bg-blush'
        }`}>
        <Icon name={icon} color={available ? colors.white : colors.muted} />
      </View>
      <View className="flex-1 gap-0.5">
        <Text className={`font-sans-semibold text-label-l ${available ? 'text-ink' : 'text-muted'}`}>
          {title}
        </Text>
        <Text className="font-sans text-body-s text-muted">{body}</Text>
        <Text className="font-sans-semibold text-caption text-plum">{engine}</Text>
      </View>
      {available ? (
        <Icon name="chevronRight" size={18} color={colors.ink} />
      ) : (
        <View className="rounded-full bg-blush px-2.5 py-1">
          <Text className="font-sans-semibold text-caption text-muted">Soon</Text>
        </View>
      )}
    </Pressable>
  );
}
