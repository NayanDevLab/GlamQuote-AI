import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { LOOKBOOK_QUERY_KEY, listSavedLooks, lookArea } from '@/features/lookbook/lookbook-api';
import { colors } from '@/theme';

/** A saved look, reopened from stored media. Viewing it never calls YouCam. */
export default function SavedLookDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: looks, isPending } = useQuery({ queryKey: LOOKBOOK_QUERY_KEY, queryFn: listSavedLooks });
  const look = looks?.find((item) => item.id === id);

  const ratio =
    look?.imageWidth && look.imageHeight ? Math.min(1.25, Math.max(0.75, look.imageWidth / look.imageHeight)) : 1;

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <View className="h-12 flex-row items-center justify-between px-2">
        <IconButton icon="arrowLeft" label="Back" strokeWidth={1.8} onPress={() => router.back()} />
        <Text className="pr-4 font-sans-semibold text-overline uppercase text-muted">Saved look</Text>
      </View>

      {look ? (
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          contentContainerClassName="gap-4 px-5 pt-1"
          showsVerticalScrollIndicator={false}>
          <View className="overflow-hidden rounded-lg bg-blush">
            <Image
              source={{ uri: look.imageUrl }}
              contentFit="cover"
              cachePolicy="disk"
              accessibilityLabel={`AI preview: ${look.title}`}
              style={{ width: '100%', aspectRatio: ratio, backgroundColor: colors.blush }}
            />
            <View className="absolute right-3 top-3 rounded-full bg-plum px-3 py-1.5">
              <Text className="font-sans-semibold text-caption text-white">{'AI Preview'}</Text>
            </View>
          </View>
          <View className="gap-1">
            <Text className="font-sans-semibold text-overline uppercase text-muted">
              {lookArea(look)} ·{' '}
              {look.kind === 'hairstyle'
                ? 'YouCam Hairstyle'
                : look.effectType === 'nail_polish'
                  ? 'Nail Polish'
                  : look.effectType === 'press_on_nails'
                    ? 'Press-On Nails'
                    : 'Nail Transfer'}
            </Text>
            <Text accessibilityRole="header" className="font-serif text-title-lg text-ink">
              {look.title}
            </Text>
            <Text className="font-sans text-body-m text-muted">
              Saved {new Date(look.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })} · private
              to you
            </Text>
          </View>
          <Text className="font-sans text-body-s text-muted">AI preview only. Actual results may vary.</Text>
        </ScrollView>
      ) : (
        <View className="flex-1 justify-center gap-3 px-5">
          <Text className="font-serif text-title-lg text-ink">
            {isPending ? 'Opening your look…' : 'This look isn’t in your Lookbook.'}
          </Text>
          {isPending ? null : (
            <Button label="Back to Lookbook" variant="secondary" onPress={() => router.back()} />
          )}
        </View>
      )}
    </View>
  );
}
