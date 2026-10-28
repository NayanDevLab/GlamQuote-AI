import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { FlowHeader, FooterBar, Thumb } from '@/features/nail/components';
import { useNailSession } from '@/features/nail/nail-session';
import { chooseFromGallery } from '@/lib/photo';
import { colors, shadows } from '@/theme';

import type { ImageSource } from 'expo-image';
import { nailStudioImages } from '@/assets/images';

type CuratedCategory = 'all' | 'minimal' | 'french' | 'chrome' | 'art';

const CATEGORIES: { id: CuratedCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'french', label: 'French Tips' },
  { id: 'chrome', label: 'Chrome' },
  { id: 'art', label: 'Nail Art' },
];

const CURATED_DESIGNS: {
  id: string;
  name: string;
  cat: CuratedCategory;
  catLabel: string;
  image: ImageSource;
  alt: string;
}[] = [
  {
    id: 'milky_nude',
    name: 'Milky Nude',
    cat: 'minimal',
    catLabel: 'Minimal',
    image: nailStudioImages.curated.milkyNude,
    alt: 'Short nails in sheer milky nude gloss',
  },
  {
    id: 'taupe_matte',
    name: 'Soft Taupe Matte',
    cat: 'minimal',
    catLabel: 'Minimal',
    image: nailStudioImages.curated.taupeMatte,
    alt: 'Nails in a soft taupe matte finish',
  },
  {
    id: 'classic_french',
    name: 'Classic French',
    cat: 'french',
    catLabel: 'French Tips',
    image: nailStudioImages.curated.classicFrench,
    alt: 'Nude nails with white French tips',
  },
  {
    id: 'plum_micro_french',
    name: 'Plum Micro-French',
    cat: 'french',
    catLabel: 'French Tips',
    image: nailStudioImages.curated.plumMicroFrench,
    alt: 'Nude nails with fine plum French tips',
  },
  {
    id: 'plum_chrome',
    name: 'Plum Chrome',
    cat: 'chrome',
    catLabel: 'Chrome',
    image: nailStudioImages.curated.plumChrome,
    alt: 'Deep plum nails with a mirror chrome finish',
  },
  {
    id: 'champagne_chrome',
    name: 'Champagne Chrome',
    cat: 'chrome',
    catLabel: 'Chrome',
    image: nailStudioImages.curated.champagneChrome,
    alt: 'Champagne nails with a mirror chrome finish',
  },
  {
    id: 'gold_dot',
    name: 'Gold Dot Accent',
    cat: 'art',
    catLabel: 'Nail Art',
    image: nailStudioImages.curated.goldDot,
    alt: 'Milky nude nails with small gold dot accents',
  },
  {
    id: 'fine_line',
    name: 'Fine Line Art',
    cat: 'art',
    catLabel: 'Nail Art',
    image: nailStudioImages.curated.fineLine,
    alt: 'Nude nails with fine black line art',
  },
];

const REFERENCE_NAME = 'Your reference photo';

export default function NailDesigns() {
  const insets = useSafeAreaInsets();
  const hand = useNailSession((state) => state.hand);
  const design = useNailSession((state) => state.design);
  const setDesign = useNailSession((state) => state.setDesign);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CuratedCategory>('all');
  const [activeInspiration, setActiveInspiration] = useState<string | null>(null);

  const filteredDesigns =
    selectedCategory === 'all'
      ? CURATED_DESIGNS
      : CURATED_DESIGNS.filter((d) => d.cat === selectedCategory);

  // Both steps need a hand photo; without one (e.g. after a cleared cache) start there.
  if (!hand) return <Redirect href="/nail/photo" />;

  const pickReference = async () => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    const outcome = await chooseFromGallery();
    setBusy(false);
    if (outcome.kind === 'picked') {
      setDesign({ source: 'reference', image: outcome.image, name: REFERENCE_NAME });
    } else if (outcome.kind !== 'canceled') {
      setFailed(true);
    }
  };

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <FlowHeader step={2} />
      <ScrollView contentContainerClassName="gap-4 px-5 pb-6 pt-1" showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" className="font-serif text-hero text-ink">
          Find Your Nail <Text className="font-serif-italic text-plum">Design</Text>
        </Text>

        <View className="flex-row items-center gap-3 rounded-lg border border-blush bg-card p-3">
          <Thumb image={hand} size={48} />
          <View className="flex-1">
            <Text className="font-sans-semibold text-label-s text-ink">Your hand photo</Text>
            <Text className="font-sans text-body-s text-muted">Kept while you choose a design</Text>
          </View>
          <Text
            accessibilityRole="button"
            onPress={() => router.push('/nail/photo?edit=1')}
            className="py-2 pl-3 font-sans-semibold text-label-s text-plum">
            Change
          </Text>
        </View>

        <View className="gap-2.5">
          <Text className="font-sans-semibold text-overline uppercase text-muted">Use your own inspiration</Text>
          {design ? (
            <View style={shadows.card} className="gap-2.5 rounded-lg border-2 border-plum bg-card p-2">
              <Image
                source={{ uri: design.image.uri }}
                contentFit="cover"
                accessibilityLabel="Your selected nail design reference"
                style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 16, backgroundColor: colors.blush }}
              />
              <View className="flex-row items-center justify-between px-2 pb-1.5">
                <View className="flex-row items-center gap-2">
                  <View className="h-5 w-5 items-center justify-center rounded-full bg-plum">
                    <Icon name="check" size={12} color={colors.white} strokeWidth={2.6} />
                  </View>
                  <Text className="font-sans-semibold text-label-s text-ink">{design.name}</Text>
                </View>
                <View className="flex-row">
                  <Text
                    accessibilityRole="button"
                    onPress={pickReference}
                    className="px-3 py-1.5 font-sans-semibold text-label-s text-plum">
                    Replace
                  </Text>
                  <Text
                    accessibilityRole="button"
                    onPress={() => setDesign(null)}
                    className="py-1.5 pl-3 font-sans-semibold text-label-s text-plum">
                    Remove
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Upload a reference photo of a nail design"
              disabled={busy}
              onPress={pickReference}
              className="items-center gap-2 rounded-lg border border-dashed border-champagne bg-card px-6 py-7 active:bg-canvas">
              {busy ? (
                <ActivityIndicator color={colors.plum} />
              ) : (
                <Icon name="upload" size={28} color={colors.plum} strokeWidth={1.6} />
              )}
              <Text className="pt-1 font-sans-semibold text-label text-ink">Upload a Reference Photo</Text>
              <Text className="text-center font-sans text-body-s text-muted">
                A clear close-up of nails you took or have permission to use, with every nail visible.
              </Text>
            </Pressable>
          )}
          {failed ? (
            <Text accessibilityLiveRegion="polite" className="font-sans text-body-s text-ink">
              That image couldn’t be opened. Try another — JPEG and PNG work best.
            </Text>
          ) : null}
        </View>

        <View className="gap-3">
          <View className="flex-row items-baseline justify-between">
            <Text className="font-sans-semibold text-overline uppercase text-muted">Curated designs</Text>
            <Text className="font-sans text-caption text-muted">{filteredDesigns.length} designs</Text>
          </View>

          {/* Category Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setSelectedCategory(cat.id)}
                  className={`h-9 items-center justify-center rounded-full px-4 ${
                    active ? 'bg-plum' : 'border border-line bg-card'
                  }`}>
                  <Text
                    className={`text-label-s ${
                      active ? 'font-sans-semibold text-white' : 'font-sans-medium text-ink'
                    }`}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* 2-Column Grid of Curated Design Cards */}
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {filteredDesigns.map((item) => {
              const isInspected = activeInspiration === item.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name}, ${item.catLabel}. ${item.alt}`}
                  onPress={() => setActiveInspiration(isInspected ? null : item.id)}
                  style={isInspected ? shadows.card : undefined}
                  className={`w-[48%] rounded-lg bg-card p-1.5 ${
                    isInspected ? 'border-2 border-plum' : 'border border-line'
                  }`}>
                  <View className="h-[112px] w-full overflow-hidden rounded-md bg-blush">
                    <Image
                      source={item.image}
                      contentFit="cover"
                      accessibilityLabel={item.alt}
                      style={{ width: '100%', height: '100%' }}
                    />
                  </View>
                  <View className="p-2">
                    <Text numberOfLines={1} className="font-sans-semibold text-label-s text-ink">
                      {item.name}
                    </Text>
                    <Text numberOfLines={1} className="font-sans text-caption text-muted">
                      {item.catLabel}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View className="flex-row items-center gap-2 rounded-lg bg-blush p-3">
            <Icon name="info" size={16} color={colors.plum} />
            <Text className="flex-1 font-sans text-body-s text-ink">
              These catalogue photos showcase popular salon styles. To preview a design on your hand, upload your reference photo above or customize colors in Nail Polish mode.
            </Text>
          </View>
        </View>
      </ScrollView>

      <FooterBar>
        <View className="flex-row items-center justify-between">
          <Text className="font-sans text-body-s text-muted">Selected</Text>
          <Text className="font-sans-semibold text-label-s text-ink">
            {design ? design.name : 'No design yet'}
          </Text>
        </View>
        <Button
          label="Preview This Design"
          trailingIcon="arrowRight"
          disabled={!design}
          onPress={() => router.push('/nail/review')}
        />
      </FooterBar>
    </View>
  );
}
