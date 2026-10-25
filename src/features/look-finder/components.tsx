import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Sheet } from '@/components/ui/sheet';
import { HairSwatch } from '@/features/hair-color/components';
import { HAIR_TEMPLATES_QUERY_KEY, listHairTemplates } from '@/features/hair/hair-api';
import { colors } from '@/theme';

import type { CatalogueStyle } from './catalogue';

/** Small illustrated nails in the style's colour (press-ons longer and more tapered). */
function NailSample({ color, press, size }: { color: string; press: boolean; size: number }) {
  const width = Math.round(size / 7);
  const heights = [0.5, 0.62, 0.66, 0.6, 0.48].map((h) => Math.round(size * h * (press ? 1.15 : 1)));
  return (
    <View style={{ height: size, width: size }} className="flex-row items-end justify-center gap-1 pb-2">
      {heights.map((height, index) => (
        <View
          key={index}
          style={{
            width,
            height,
            backgroundColor: color,
            borderTopLeftRadius: press ? width : width / 2,
            borderTopRightRadius: press ? width : width / 2,
            borderBottomLeftRadius: 4,
            borderBottomRightRadius: 4,
          }}
          className="border border-canvas/70"
        />
      ))}
    </View>
  );
}

/**
 * The catalogue's own picture of a style: YouCam's template sample for hairstyles, and a labelled
 * sample swatch for colours and nails. Never shown as the user's result.
 */
export function StyleThumb({ style, size = 96 }: { style: CatalogueStyle; size?: number }) {
  const { data: templates } = useQuery({
    queryKey: HAIR_TEMPLATES_QUERY_KEY,
    queryFn: listHairTemplates,
    staleTime: 30 * 60_000,
    enabled: style.type === 'hairstyle',
  });
  const d = style.destination;
  const thumb = d.studio === 'hairstyle' ? templates?.find((item) => item.id === d.templateId)?.thumb : undefined;
  const label = style.type === 'hairstyle' ? 'Style sample' : 'Sample';

  return (
    <View
      accessible
      accessibilityLabel={`${label} for ${style.name}, not your photo`}
      style={{ width: size, height: Math.round(size * 1.2) }}
      className="items-center justify-center overflow-hidden rounded-[16px] bg-blush">
      {thumb ? (
        <Image
          source={{ uri: thumb }}
          contentFit="cover"
          cachePolicy="disk"
          style={{ width: '100%', height: '100%' }}
        />
      ) : style.swatch && (style.type === 'hair_color_full' || style.type === 'hair_color_ombre') ? (
        <HairSwatch swatch={style.swatch} width={size - 24} height={Math.round(size * 1.2) - 32} radius={14} />
      ) : style.swatch ? (
        <NailSample color={style.swatch[0]} press={style.type === 'press_on'} size={size} />
      ) : (
        <Icon name="image" size={24} color={colors.muted} />
      )}
      {size >= 80 ? (
        <View className="absolute bottom-1.5 left-1.5 rounded-full bg-canvas/95 px-1.5 py-0.5">
          <Text className="font-sans-semibold text-[10px] leading-[13px] text-ink">{label}</Text>
        </View>
      ) : null}
    </View>
  );
}

const TUTORIAL_STEPS = [
  { title: 'Choose preferences', body: 'Hair or nails, plus anything else that matters.' },
  { title: 'Discover styles', body: 'AI picks from styles you can try in GlamQuote.' },
  { title: 'Try on your favorites', body: 'Preview them on your own photo in a Studio.' },
];

/** P2·2 — Look Finder tutorial (first visit; ? replays it). */
export function FinderTutorial({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      eyebrow="New · Powered by Gemini"
      title={
        <>
          Meet <Text className="font-serif-italic text-plum">Look Finder</Text>
        </>
      }>
      <Text className="font-sans text-body-m text-muted">
        Tell us what you like, and we’ll help you discover looks worth trying.
      </Text>
      <View className="gap-3 rounded-[22px] border border-blush bg-card p-3">
        {TUTORIAL_STEPS.map((step, index) => (
          <View key={step.title} className="flex-row items-center gap-3">
            <View
              className={`h-8 w-8 items-center justify-center rounded-full ${index === 0 ? 'bg-plum' : 'bg-blush'}`}>
              <Text
                className={`font-serif-italic text-[18px] leading-[22px] ${index === 0 ? 'text-white' : 'text-plum'}`}>
                {index + 1}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="font-sans-semibold text-label-s text-ink">{step.title}</Text>
              <Text className="font-sans text-body-s text-muted">{step.body}</Text>
            </View>
          </View>
        ))}
      </View>
      <View className="flex-row gap-2">
        <Icon name="lock" size={14} color={colors.muted} />
        <Text className="flex-1 font-sans text-caption text-muted">
          Gemini gets your answers and GlamQuote’s style list — never photos. It doesn’t rate how you look.
        </Text>
      </View>
      <Button label="Let’s Start" onPress={onClose} />
      <Text
        accessibilityRole="button"
        onPress={onClose}
        className="self-center px-4 py-2 font-sans-semibold text-label text-plum">
        Skip Tutorial
      </Text>
    </Sheet>
  );
}
