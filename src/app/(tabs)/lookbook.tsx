import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LookbookStack } from '@/components/illustrations';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { Sheet } from '@/components/ui/sheet';
import { InlineNote } from '@/components/ui/typography';
import { LOOKBOOK_QUERY_KEY, listSavedLooks, lookArea, type SavedLook } from '@/features/lookbook/lookbook-api';
import { colors, shadows } from '@/theme';

const TUTORIAL_STEPS = [
  'Save your favorite YouCam-generated previews.',
  'Revisit and compare your looks.',
  'Choose a final look and create a shareable card.',
];

function LookCard({ look }: { look: SavedLook }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${look.title}, saved ${lookArea(look) === 'Hair' ? 'hairstyle' : 'nail'} preview`}
      onPress={() => router.push({ pathname: '/look/[id]', params: { id: look.id } })}
      style={shadows.card}
      className="flex-1 rounded-lg border border-blush bg-card p-2 active:bg-canvas">
      <Image
        source={{ uri: look.imageUrl }}
        contentFit="cover"
        cachePolicy="disk"
        style={{ width: '100%', aspectRatio: 1, borderRadius: 18, backgroundColor: colors.blush }}
      />
      <View className="gap-0.5 px-2 pb-2 pt-2.5">
        <Text className="font-sans-semibold text-caption uppercase tracking-[1.3px] text-muted">
          {lookArea(look)} · AI Preview
        </Text>
        <Text numberOfLines={2} className="font-serif text-step text-ink">
          {look.title}
        </Text>
      </View>
    </Pressable>
  );
}

// Minimum saved-look display for this phase: a grid of genuine saved previews, or the approved
// empty state (design P6A-1). Filters, notes, favourites and delete arrive with the full Lookbook.
export default function Lookbook() {
  const insets = useSafeAreaInsets();
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const { data: looks = [], isPending, isError, refetch } = useQuery({
    queryKey: LOOKBOOK_QUERY_KEY,
    queryFn: listSavedLooks,
  });

  const rows: SavedLook[][] = [];
  for (let i = 0; i < looks.length; i += 2) rows.push(looks.slice(i, i + 2));

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top + 12 }}>
      <View className="flex-row items-start justify-between pl-5 pr-3">
        <View className="flex-1 gap-0.5">
          <Text accessibilityRole="header" className="font-serif text-title-xl text-ink">
            My <Text className="font-serif-italic text-plum">Lookbook</Text>
          </Text>
          <Text className="font-sans text-body-s text-muted">
            All your favorite looks, in one place.
          </Text>
        </View>
        <IconButton
          icon="help"
          label="How Lookbook works"
          onPress={() => setTutorialOpen(true)}
        />
      </View>

      {looks.length > 0 ? (
        <ScrollView contentContainerClassName="gap-3 px-5 pb-6 pt-4" showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center justify-between">
            <Text className="font-sans-semibold text-overline uppercase text-muted">
              {looks.length} saved {looks.length === 1 ? 'look' : 'looks'}
            </Text>
            <Text
              accessibilityRole="button"
              onPress={() => router.push('/battle')}
              className="py-1.5 pl-3 font-sans-semibold text-label-s text-plum">
              Compare Looks
            </Text>
          </View>
          {rows.map((row) => (
            <View key={row[0].id} className="flex-row gap-3">
              {row.map((look) => (
                <LookCard key={look.id} look={look} />
              ))}
              {row.length === 1 ? <View className="flex-1" /> : null}
            </View>
          ))}
          <View className="pt-2">
            <InlineNote icon="lock" centered size="sm">
              Only looks you choose to save appear here.
            </InlineNote>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          contentContainerClassName="gap-4 px-6 pb-6 pt-3"
          showsVerticalScrollIndicator={false}>
          {isError ? (
            <View accessibilityLiveRegion="polite" className="gap-2 rounded-lg bg-blush p-4">
              <Text className="font-sans-semibold text-label-s text-ink">We couldn’t load your Lookbook.</Text>
              <Text className="font-sans text-body-s text-muted">
                Your saved looks are safe. Check your connection and try again.
              </Text>
              <Text
                accessibilityRole="button"
                onPress={() => refetch()}
                className="self-start py-1.5 font-sans-semibold text-label-s text-plum">
                Retry
              </Text>
            </View>
          ) : null}
          <LookbookStack />
          <Text accessibilityRole="header" className="text-center font-serif text-title-lg text-ink">
            Your Lookbook <Text className="font-serif-italic text-plum">Is Waiting</Text>
          </Text>
          <Text className="-mt-1.5 mb-1.5 text-center font-sans text-body-l text-muted">
            {isPending ? 'Checking for saved looks…' : 'Try a style and save the looks you love.'}
          </Text>
          <Button label="Explore Styles" onPress={() => router.navigate('/explore')} />
          <Button
            label="Find My Look with AI"
            variant="secondary"
            icon="sparkle"
            onPress={() => router.push('/pending/look-finder')}
          />
          <View className="mt-1">
            <InlineNote icon="lock" centered size="sm">
              Only looks you choose to save appear here.
            </InlineNote>
          </View>
        </ScrollView>
      )}

      <Sheet
        visible={tutorialOpen}
        onClose={() => setTutorialOpen(false)}
        eyebrow="Lookbook"
        title={
          <>
            Your Personal <Text className="font-serif-italic text-plum">Style Collection</Text>
          </>
        }>
        <View className="gap-3 rounded-[22px] border border-blush bg-card p-3">
          {TUTORIAL_STEPS.map((step, index) => (
            <View key={step} className="flex-row items-center gap-3">
              <View
                className={`h-8 w-8 items-center justify-center rounded-full ${
                  index === 0 ? 'bg-plum' : 'bg-blush'
                }`}>
                <Text
                  className={`font-serif-italic text-[18px] leading-[22px] ${
                    index === 0 ? 'text-white' : 'text-plum'
                  }`}>
                  {index + 1}
                </Text>
              </View>
              <Text className="flex-1 font-sans text-body-m text-ink">{step}</Text>
            </View>
          ))}
        </View>
        <InlineNote icon="lock" size="sm">
          Your saved looks are private to you. Nothing is shared unless you choose to share it.
        </InlineNote>
        <Button label="Got It" onPress={() => setTutorialOpen(false)} />
      </Sheet>
    </View>
  );
}
