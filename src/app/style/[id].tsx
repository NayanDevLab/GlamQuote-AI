import { Image } from 'expo-image';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { FooterBar } from '@/components/ui/footer-bar';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { InlineNote } from '@/components/ui/typography';
import { findSampleStyle } from '@/features/explore/sample-catalogue';
import { findStyle, TYPE_LABEL, type CatalogueStyle } from '@/features/look-finder/catalogue';
import { StyleThumb } from '@/features/look-finder/components';
import { useTryLook } from '@/features/look-finder/open-style';
import { colors, shadows } from '@/theme';

/** The settings a catalogue style preselects, in plain words (from its trusted destination). */
function setupLines(style: CatalogueStyle): string[] {
  const d = style.destination;
  switch (d.studio) {
    case 'hairstyle':
      return [`YouCam hairstyle template: ${style.name}`];
    case 'hair_color':
      return [`${d.mode === 'full' ? 'Full color' : 'Ombre'} preset: ${d.preset}`];
    case 'nail_polish':
      return [
        `Color: ${style.name.split(' · ')[0]} (${d.color})`,
        `Finish: ${style.name.split(' · ')[1]}`,
        'All fingers',
      ];
    case 'press_on': {
      const [shapeAndLength, colorAndFinish] = style.name.split(' · ');
      const cap = (word: string) => word.charAt(0).toUpperCase() + word.slice(1);
      return [
        `${cap(d.tip)} tip, ${cap(d.base)} base`,
        `Length: ${shapeAndLength.replace(/\s*\S+$/, '')}`,
        `Color & finish: ${colorAndFinish} (${d.color})`,
      ];
    }
  }
}

function SimilarRow({ style, busy, onTry }: { style: CatalogueStyle; busy: boolean; onTry: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Try ${style.name}, ${TYPE_LABEL[style.type]} — a similar supported style`}
      disabled={busy}
      onPress={onTry}
      className="flex-row items-center gap-3 rounded-[18px] border border-blush bg-card p-2.5 active:bg-blush">
      <StyleThumb style={style} size={56} />
      <View className="flex-1 gap-0.5">
        <Text className="font-sans-semibold text-label-s text-ink">{style.name}</Text>
        <Text className="font-sans text-caption text-muted">{TYPE_LABEL[style.type]} · supported by YouCam</Text>
      </View>
      <Icon name="chevronRight" size={18} color={colors.muted} strokeWidth={2} />
    </Pressable>
  );
}

// Explore → Style Details → the matching studio, with the style preselected. Never generates.
export default function StyleDetails() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const sample = findSampleStyle(id);
  const { tryLook, opening, problem } = useTryLook();

  if (!sample) return <Redirect href="/explore" />;

  // Re-resolved from the catalogue, so a stale or wrong id simply becomes "inspiration only".
  const match = sample.tryOn ? findStyle(sample.tryOn.styleId) : undefined;
  const supported = match && match.category === sample.category ? match : undefined;
  const similar = (sample.similar ?? [])
    .map((styleId) => findStyle(styleId))
    .filter((style): style is CatalogueStyle => Boolean(style));
  const area = sample.category === 'hair' ? 'Hair' : 'Nails';

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <View className="h-12 flex-row items-center justify-between px-2">
        <IconButton icon="arrowLeft" label="Back to Explore" strokeWidth={1.8} onPress={() => router.back()} />
        <Text className="font-sans-semibold text-overline uppercase text-muted">Style details</Text>
        <View className="w-12" />
      </View>

      <ScrollView contentContainerClassName="gap-4 px-5 pb-6 pt-1" showsVerticalScrollIndicator={false}>
        <View className="aspect-[4/5] overflow-hidden rounded-lg bg-blush" style={shadows.card}>
          <Image
            source={sample.image}
            contentFit="cover"
            transition={150}
            style={StyleSheet.absoluteFill}
            accessibilityLabel={`Style sample: ${sample.name} — ${sample.description}. Not your photo.`}
          />
          <View className="absolute bottom-3 left-3 rounded-full bg-canvas/95 px-2.5 py-[5px]">
            <Text className="font-sans-semibold text-caption text-ink">Style sample · not your photo</Text>
          </View>
        </View>

        <View className="gap-1.5">
          <Text className="font-sans-semibold text-overline uppercase text-muted">{area}</Text>
          <Text accessibilityRole="header" className="font-serif text-title-xl text-ink">
            {sample.name}
          </Text>
          <Text className="font-sans text-body-l text-muted">{sample.description}</Text>
        </View>

        {/* Descriptive labels, deliberately not chip-shaped: they aren't filters. */}
        <View
          accessible
          accessibilityLabel={`Style notes: ${sample.tags.join(', ')}`}
          className="flex-row flex-wrap gap-1.5">
          {sample.tags.map((tag) => (
            <Text key={tag} className="rounded-md bg-blush px-2.5 py-1 font-sans-medium text-caption text-ink">
              {tag}
            </Text>
          ))}
        </View>

        {supported ? (
          <View className="gap-3 rounded-[22px] border border-blush bg-card p-3.5">
            <View className="flex-row items-center gap-3">
              <StyleThumb style={supported} size={64} />
              <View className="flex-1 gap-0.5">
                <Text className="font-sans-semibold text-overline uppercase text-plum">Ready to try</Text>
                <Text className="font-sans-semibold text-label text-ink">{supported.name}</Text>
                <Text className="font-sans text-caption text-muted">{TYPE_LABEL[supported.type]} · YouCam</Text>
              </View>
            </View>
            <View className="gap-1.5">
              {setupLines(supported).map((line) => (
                <View key={line} className="flex-row items-center gap-2">
                  <Icon name="check" size={15} color={colors.plum} strokeWidth={2.2} />
                  <Text className="flex-1 font-sans text-body-s text-ink">{line}</Text>
                </View>
              ))}
            </View>
            {sample.tryOn?.caveat ? (
              <Text className="font-sans text-caption text-muted">{sample.tryOn.caveat}</Text>
            ) : null}
          </View>
        ) : (
          <View className="gap-2 rounded-[22px] bg-blush p-3.5">
            <View className="flex-row items-center gap-2">
              <Icon name="image" size={18} color={colors.plum} />
              <Text className="font-sans-semibold text-label-s text-ink">Inspiration only</Text>
            </View>
            <Text className="font-sans text-body-s text-ink">
              {sample.inspirationNote ?? 'This look can’t be generated exactly as shown.'}
            </Text>
          </View>
        )}

        {similar.length ? (
          <View className="gap-2.5">
            <Text className="font-sans-semibold text-overline uppercase text-muted">Similar styles you can try</Text>
            {similar.map((style) => (
              <SimilarRow key={style.id} style={style} busy={opening !== null} onTry={() => tryLook(style)} />
            ))}
            <Text className="font-sans text-caption text-muted">
              These are different supported styles, not this exact look.
            </Text>
          </View>
        ) : null}

        {problem ? (
          <Text accessibilityLiveRegion="polite" className="font-sans text-body-s text-plum">
            {problem}
          </Text>
        ) : null}

        <InlineNote icon="lock" size="sm">
          Nothing is generated yet. You’ll add your photo and confirm on Review first.
        </InlineNote>
      </ScrollView>

      <FooterBar>
        {supported ? (
          <Button
            label={opening === supported.id ? 'Opening…' : 'Try This Look'}
            trailingIcon="arrowRight"
            disabled={opening !== null}
            onPress={() => tryLook(supported)}
          />
        ) : (
          <Button
            label={sample.browse?.label ?? 'Explore Styles'}
            trailingIcon="arrowRight"
            onPress={() => router.push(sample.browse?.href ?? '/explore')}
          />
        )}
        <Text
          accessibilityRole="button"
          onPress={() => router.push('/finder')}
          className="self-center py-1 font-sans-semibold text-label-s text-plum underline">
          Find My Look with AI
        </Text>
      </FooterBar>
    </View>
  );
}
