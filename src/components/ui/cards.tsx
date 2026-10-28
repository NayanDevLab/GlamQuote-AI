import { Image, type ImageSource } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, shadows } from '@/theme';

import { Icon, type IconName } from './icon';
import { PhotoSlot } from './photo-slot';

type StudioCardProps = {
  title: string;
  description: string;
  tone: 'warm' | 'cool';
  image?: ImageSource;
  onPress: () => void;
};

/** Studio entry card: 1:1 image, serif title, one-line promise. The whole card is one pressable. */
export function StudioCard({ title, description, tone, image, onPress }: StudioCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${description}`}
      accessibilityHint="Opens the studio"
      onPress={onPress}
      style={shadows.card}
      className="flex-1 rounded-lg border border-blush bg-card p-2 active:bg-canvas">
      {image ? (
        <View className="aspect-square overflow-hidden rounded-md bg-blush">
          <Image
            source={image}
            contentFit="cover"
            transition={150}
            style={StyleSheet.absoluteFill}
            accessibilityLabel={`${title} preview`}
          />
          <View className="absolute left-2 top-2 rounded-full bg-canvas/95 px-2.5 py-[5px]">
            <Text className="font-sans-semibold text-caption text-plum">AI try-on</Text>
          </View>
        </View>
      ) : (
        <PhotoSlot tone={tone} className="aspect-square rounded-md">
          <View className="absolute left-2 top-2 rounded-full bg-canvas/95 px-2.5 py-[5px]">
            <Text className="font-sans-semibold text-caption text-plum">AI try-on</Text>
          </View>
        </PhotoSlot>
      )}
      <View className="gap-1 px-2 pb-2 pt-3">
        <Text className="font-serif text-title text-ink">{title}</Text>
        <Text className="font-sans text-body-s text-muted">{description}</Text>
        <View className="flex-row items-center gap-1.5 pt-2">
          <Text className="font-sans-semibold text-label-s text-plum">Open studio</Text>
          <Icon name="arrowRight" size={16} color={colors.plum} strokeWidth={2} />
        </View>
      </View>
    </Pressable>
  );
}

/** Deferred category (Makeup, Beard). Deliberately not pressable. */
export function ComingSoonTile({ title, icon }: { title: string; icon: IconName }) {
  return (
    <View
      accessible
      accessibilityLabel={`${title}, coming soon`}
      accessibilityState={{ disabled: true }}
      className="min-h-[68px] flex-1 flex-row items-center gap-3 rounded-md bg-blush px-3.5 py-3">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-canvas">
        <Icon name={icon} size={20} color={colors.muted} strokeWidth={1.7} />
      </View>
      <View className="shrink gap-0.5">
        <Text className="font-sans-semibold text-label text-ink">{title}</Text>
        <Text className="font-sans text-caption text-muted">Coming soon</Text>
      </View>
    </View>
  );
}
