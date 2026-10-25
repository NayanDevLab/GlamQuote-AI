import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { FooterBar } from '@/components/ui/footer-bar';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { previewsFromSameSelfie, useHairSession } from '@/features/hair/hair-session';
import { LOOKBOOK_QUERY_KEY, listSavedLooks } from '@/features/lookbook/lookbook-api';
import { colors, shadows } from '@/theme';

// P4A-9 — Saved. Shown only after the look is stored and recorded on the server.
export default function HairSaved() {
  const insets = useSafeAreaInsets();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const preview = useHairSession((state) => state.previews.find((p) => p.taskId === taskId));
  const previews = useHairSession((state) => state.previews);
  // The stored copy (private Cloudinary link), so this shows what the Lookbook will reopen.
  const { data: looks } = useQuery({ queryKey: LOOKBOOK_QUERY_KEY, queryFn: listSavedLooks });
  const look = looks?.find((item) => item.id === preview?.savedLookId);

  if (!preview?.savedLookId) return <Redirect href="/hair" />;
  const sameSelfie = previewsFromSameSelfie(previews, preview);

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <View className="h-12 flex-row items-center justify-between px-2">
        <View className="w-12" />
        <Text className="font-sans-semibold text-overline uppercase text-muted">Hair Studio</Text>
        <IconButton icon="close" label="Back to Hair Studio" strokeWidth={1.8} onPress={() => router.dismissTo('/hair')} />
      </View>

      <ScrollView contentContainerClassName="gap-5 px-5 pb-6 pt-2" showsVerticalScrollIndicator={false}>
        <View className="items-center gap-3">
          <View className="h-[72px] w-[72px] items-center justify-center rounded-full border border-champagne">
            <View className="h-[60px] w-[60px] items-center justify-center rounded-full bg-plum">
              <Icon name="check" size={28} color={colors.white} strokeWidth={2.4} />
            </View>
          </View>
          <Text accessibilityRole="header" accessibilityLiveRegion="polite" className="text-center font-serif text-title-lg text-ink">
            Saved to Your <Text className="font-serif-italic text-plum">Lookbook.</Text>
          </Text>
          <Text className="text-center font-sans text-body-m text-muted">
            Open it anytime — no need to generate it again.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open ${preview.template.title} in your Lookbook`}
          onPress={() => router.push({ pathname: '/look/[id]', params: { id: preview.savedLookId as string } })}
          style={shadows.card}
          className="flex-row gap-3.5 rounded-lg border border-blush bg-card p-3 active:bg-canvas">
          <View>
            <Image
              source={{ uri: look?.imageUrl ?? preview.resultUrl }}
              contentFit="cover"
              cachePolicy="disk"
              accessibilityLabel={`AI preview: ${preview.template.title}`}
              style={{ width: 120, height: 150, borderRadius: 16, backgroundColor: colors.blush }}
            />
            <View className="absolute left-2 top-2 rounded-full bg-plum px-2 py-1">
              <Text className="font-sans-semibold text-[11px] leading-[14px] text-white">{'AI Preview'}</Text>
            </View>
          </View>
          <View className="flex-1 justify-center gap-1">
            <Text className="font-sans-semibold text-overline uppercase text-muted">Hair · YouCam template</Text>
            <Text numberOfLines={2} className="font-serif text-headline text-ink">
              {preview.template.title}
            </Text>
            <Text className="font-sans text-body-s text-muted">Saved just now · private to you</Text>
          </View>
        </Pressable>

        {sameSelfie.length >= 2 ? (
          <View className="gap-3 rounded-lg bg-blush p-4">
            <Text className="font-sans-semibold text-label-l text-ink">
              {sameSelfie.length} hairstyle previews ready
            </Text>
            <Text className="font-sans text-body-s text-muted">
              Both made from the same photo. Look Battle compares your generated previews only.
            </Text>
            <Button label="Compare Looks" variant="secondary" onPress={() => router.push({ pathname: '/battle/compare', params: { from: preview.taskId } })} />
          </View>
        ) : null}
      </ScrollView>

      <FooterBar>
        <Button label="View Lookbook" onPress={() => router.navigate('/lookbook')} />
        <Button label="Try Another Hairstyle" variant="secondary" onPress={() => router.dismissTo('/hair/styles')} />
      </FooterBar>
    </View>
  );
}
