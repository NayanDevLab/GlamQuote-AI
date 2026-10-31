import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { homeImages } from '@/assets/images';
import { LookbookTeaser } from '@/components/illustrations';
import { Monogram, Wordmark } from '@/components/ui/brand';
import { Button } from '@/components/ui/button';
import { ComingSoonTile, StudioCard } from '@/components/ui/cards';
import { IconButton } from '@/components/ui/icon-button';
import { HOW_IT_WORKS_ICONS, StepList, type Step } from '@/components/ui/step-list';
import { InlineNote, Overline, SectionHeader } from '@/components/ui/typography';
import { LOOKBOOK_QUERY_KEY, listSavedLooks } from '@/features/lookbook/lookbook-api';

const STEPS: Step[] = [
  { icon: HOW_IT_WORKS_ICONS[0], title: 'Discover', body: 'Find styles matching your preferences.' },
  { icon: HOW_IT_WORKS_ICONS[1], title: 'Try On', body: 'Generate AI previews from your photo.' },
  {
    icon: HOW_IT_WORKS_ICONS[2],
    title: 'Compare & Decide',
    body: 'Compare looks and save your favourite.',
  },
];

export default function Home() {
  const insets = useSafeAreaInsets();
  // Same query as the Lookbook tab, so the count is the guest's real saved looks.
  const { data: looks } = useQuery({ queryKey: LOOKBOOK_QUERY_KEY, queryFn: listSavedLooks });
  const savedCount = looks?.length ?? 0;

  return (
    // The top inset sits on the fixed wrapper, not the scroll content, so nothing scrolls under the status bar.
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between pb-1 pl-5 pr-3 pt-3">
          <View className="flex-row items-center gap-2.5">
            <Monogram />
            <Wordmark />
          </View>
          <View className="flex-row gap-1">
            <IconButton icon="help" label="Tutorials and help" onPress={() => router.push('/help')} />
            <IconButton
              icon="user"
              label="Profile and settings"
              tonal
              onPress={() => router.push('/settings')}
            />
          </View>
        </View>

        <View className="gap-3 px-5 pt-3">
          <Overline>AI try-on for hair & nails</Overline>
          <Text accessibilityRole="header" className="font-serif text-display text-ink">
            Find your next look with <Text className="font-serif-italic text-plum">confidence.</Text>
          </Text>
          <Text className="font-sans text-body-l text-muted">
            Discover styles, preview them on your photo, and choose your next look with confidence.
          </Text>
          <View className="gap-2.5 pt-1">
            <Button
              label="Find My Look"
              icon="scanFace"
              onPress={() => router.push('/finder')}
            />
            <Button
              label="Explore Styles"
              variant="secondary"
              trailingIcon="arrowRight"
              onPress={() => router.navigate('/explore')}
            />
            <InlineNote icon="check" centered>
              Personalised by Gemini · No account needed
            </InlineNote>
          </View>
        </View>

        <View className="gap-3 px-5 pt-6">
          <SectionHeader title="Studios" note="Preview before you change" />
          <View className="flex-row gap-3">
            <StudioCard
              title="Nail Studio"
              description="Try nail designs on your own hands."
              tone="warm"
              image={homeImages.nailStudio}
              onPress={() => router.push('/nail')}
            />
            <StudioCard
              title="Hair Studio"
              description="Preview hairstyles on your own photo."
              tone="cool"
              image={homeImages.hairStudio}
              onPress={() => router.push('/hair')}
            />
          </View>
          <View className="gap-2.5 pt-3">
            <Overline rule={false}>Coming soon</Overline>
            <View className="flex-row gap-3">
              <ComingSoonTile title="Makeup" icon="makeup" />
              <ComingSoonTile title="Beard" icon="beard" />
            </View>
          </View>
        </View>

        <View className="gap-4 px-5 pt-10">
          <SectionHeader title="How it works" />
          <StepList steps={STEPS} />
        </View>

        <View className="gap-4 px-5 pt-10">
          {/* Only saved YouCam previews count; the note waits for the real number. */}
          <SectionHeader title="My Lookbook" note={looks ? `${savedCount} saved` : undefined} />
          <View className="items-center gap-3 rounded-lg bg-blush px-6 pb-6 pt-7">
            <LookbookTeaser />
            {/* self-stretch: Android measures centred serif text too narrowly and clips the last word. */}
            <Text className="self-stretch text-center font-serif text-title text-ink">
              {savedCount ? 'Your looks are saved' : 'Your lookbook is waiting'}
            </Text>
            <Text className="max-w-[290px] text-center font-sans text-body-m text-muted">
              {savedCount
                ? `${savedCount} ${savedCount === 1 ? 'preview' : 'previews'} in your Lookbook, ready to revisit or compare side by side.`
                : 'Save the previews you like, compare them side by side, and keep your favourite here.'}
            </Text>
            <Button
              label={savedCount ? 'Open My Lookbook' : 'Try your first look'}
              variant="tonal"
              trailingIcon="arrowRight"
              className="mt-2"
              onPress={() => router.navigate(savedCount ? '/lookbook' : '/explore')}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
