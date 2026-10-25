import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Ellipse } from 'react-native-svg';

import { Button } from '@/components/ui/button';
import { ComingSoonTile, StudioCard } from '@/components/ui/cards';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { PhotoSlot } from '@/components/ui/photo-slot';
import { Overline, SectionHeader } from '@/components/ui/typography';
import {
  CATEGORY_FILTERS,
  TAG_FILTERS,
  filterStyles,
  type CategoryFilter,
  type SampleStyle,
} from '@/features/explore/sample-catalogue';
import { colors, shadows } from '@/theme';

function LookFinderBanner() {
  return (
    <View style={shadows.banner} className="gap-2.5 overflow-hidden rounded-lg bg-plum px-5 pb-5 pt-[22px]">
      <View aria-hidden pointerEvents="none" className="absolute -right-11 -top-[58px]">
        <Svg width={190} height={240}>
          <Ellipse cx={89} cy={112} rx={84.5} ry={109.5} fill="none" stroke={colors.champagne} opacity={0.55} />
          <Ellipse cx={101} cy={126} rx={84.5} ry={109.5} fill="none" stroke={colors.champagne} opacity={0.25} />
        </Svg>
      </View>
      <Text className="font-sans-semibold text-overline uppercase text-plum-tint">
        AI Look Finder · by Gemini
      </Text>
      <Text accessibilityRole="header" className="max-w-[260px] font-serif text-headline text-white">
        Not sure where to <Text className="font-serif-italic">start?</Text>
      </Text>
      <Text className="max-w-[300px] font-sans text-body-m text-plum-tint">
        Answer four quick questions and get styles from our catalogue that you can try on.
      </Text>
      <Button
        label="Find My Look with AI"
        variant="inverse"
        icon="scanFace"
        className="mt-1.5"
        onPress={() => router.push('/finder')}
      />
      <View className="flex-row items-center justify-center gap-1.5">
        <Icon name="lock" size={14} color={colors.plumTint} strokeWidth={2} />
        <Text className="font-sans text-caption text-plum-tint">
          Uses your answers only — never your photos
        </Text>
      </View>
    </View>
  );
}

function StyleTile({ style }: { style: SampleStyle }) {
  return (
    <View className="flex-1 gap-2.5">
      <PhotoSlot
        tone={style.category === 'hair' ? 'cool' : 'warm'}
        className="aspect-[4/5] rounded-md"
      />
      <View className="gap-[3px] px-0.5">
        <Text className="font-sans-semibold text-caption uppercase tracking-[1.3px] text-muted">
          {style.category === 'hair' ? 'Hair' : 'Nails'}
        </Text>
        <Text className="font-serif text-step text-ink">{style.name}</Text>
        <Text className="font-sans text-body-s text-muted">{style.description}</Text>
      </View>
    </View>
  );
}

export default function Explore() {
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [tag, setTag] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const styles = filterStyles(category, tag, query);
  const rows: SampleStyle[][] = [];
  for (let i = 0; i < styles.length; i += 2) {
    rows.push(styles.slice(i, i + 2));
  }

  return (
    // The top inset sits on the fixed wrapper, not the scroll content, so nothing scrolls under the status bar.
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="gap-2 px-5">
          <Overline>Explore</Overline>
          <Text accessibilityRole="header" className="font-serif text-hero text-ink">
            Explore Your <Text className="font-serif-italic text-plum">Style</Text>
          </Text>
          <Text className="font-sans text-body-l text-muted">
            Find something you love, then see it on you.
          </Text>
        </View>

        <View className="gap-3.5 px-5 pt-[18px]">
          <View className="h-[52px] flex-row items-center gap-2.5 rounded-full border border-line bg-card px-[18px]">
            <Icon name="search" size={20} color={colors.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search hairstyles or nail designs"
              placeholderTextColor={colors.placeholder}
              accessibilityLabel="Search hairstyles or nail designs"
              returnKeyType="search"
              autoCorrect={false}
              className="h-12 flex-1 p-0 font-sans text-[16px] text-ink"
            />
          </View>
          <View className="flex-row gap-2">
            {CATEGORY_FILTERS.map((option) => (
              <Chip
                key={option.id}
                label={option.label}
                size="md"
                selected={category === option.id}
                onPress={() => {
                  setCategory(option.id);
                  setTag(null);
                }}
              />
            ))}
          </View>
        </View>

        <View className="px-5 pt-6">
          <LookFinderBanner />
        </View>

        <View className="gap-3 px-5 pt-8">
          <SectionHeader title="Studios" note="Browse a full category" />
          <View className="flex-row gap-3">
            <StudioCard
              title="Hair Studio"
              description="Cuts, colours & textures"
              tone="cool"
              onPress={() => router.push('/hair')}
            />
            <StudioCard
              title="Nail Studio"
              description="Shapes, shades & art"
              tone="warm"
              onPress={() => router.push('/nail')}
            />
          </View>
        </View>

        <View className="gap-3 pt-9">
          <View className="px-5">
            <SectionHeader
              title="Style collection"
              note={`${styles.length} ${styles.length === 1 ? 'look' : 'looks'}`}
            />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerClassName="gap-2 px-5 pb-1">
            {TAG_FILTERS[category].map((label) => (
              <Chip
                key={label}
                label={label}
                selected={tag === label}
                onPress={() => setTag(tag === label ? null : label)}
              />
            ))}
          </ScrollView>

          {rows.length > 0 ? (
            <View className="gap-4 px-5 pt-1">
              {rows.map((row) => (
                <View key={row[0].id} className="flex-row gap-3">
                  {row.map((style) => (
                    <StyleTile key={style.id} style={style} />
                  ))}
                  {row.length === 1 ? <View className="flex-1" /> : null}
                </View>
              ))}
            </View>
          ) : (
            <View className="mx-5 items-center gap-1.5 rounded-lg bg-blush p-5">
              <Text className="font-serif text-step text-ink">Nothing here yet</Text>
              <Text className="text-center font-sans text-body-s text-muted">
                Try another filter, or let AI Look Finder suggest something.
              </Text>
            </View>
          )}
        </View>

        <View className="gap-2.5 px-5 pt-9">
          <Overline rule={false}>Coming soon</Overline>
          <View className="flex-row gap-3">
            <ComingSoonTile title="Makeup" icon="makeup" />
            <ComingSoonTile title="Beard" icon="beard" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
