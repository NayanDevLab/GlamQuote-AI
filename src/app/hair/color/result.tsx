import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BeforeAfter } from '@/components/ui/before-after';
import { Button } from '@/components/ui/button';
import { FooterBar } from '@/components/ui/footer-bar';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { ColorErrorState, HairSwatch } from '@/features/hair-color/components';
import { getHairColorTask } from '@/features/hair-color/hair-color-api';
import { previewsFromSamePhoto, useHairColorSession } from '@/features/hair-color/hair-color-session';
import { LOOKBOOK_QUERY_KEY, saveLook } from '@/features/lookbook/lookbook-api';
import { EdgeFunctionError } from '@/lib/supabase';
import { colors } from '@/theme';

// P4B-8 — Result. Shows only the `results.url` of a successful task, never a sample swatch.
export default function HairColorResult() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const preview = useHairColorSession((state) => state.previews.find((p) => p.taskId === taskId));
  const previews = useHairColorSession((state) => state.previews);
  const updatePreview = useHairColorSession((state) => state.updatePreview);
  // 'refreshing' = the temporary link stopped loading and a new one is being requested.
  const [media, setMedia] = useState<'ok' | 'refreshing' | 'unavailable'>('ok');

  const save = useMutation({
    mutationFn: () => {
      if (!preview) throw new Error('No preview to save.');
      return saveLook({
        taskId: preview.taskId,
        title: preview.choice.name,
        designSource: preview.choice.source,
      });
    },
    // "Saved" is shown only once the image is stored and the look is recorded.
    onSuccess: (look) => {
      updatePreview(look.taskId, { savedLookId: look.id });
      queryClient.invalidateQueries({ queryKey: LOOKBOOK_QUERY_KEY });
    },
  });

  // Only a real result this guest generated is ever shown here.
  if (!preview) return <Redirect href="/hair/color" />;
  const editor = preview.choice.mode === 'full' ? '/hair/color/full' : '/hair/color/ombre';

  // Result links expire after about two hours. Reading the task again issues a fresh one and
  // creates nothing new; if that fails too, say so instead of showing a broken image.
  const refreshResult = async () => {
    if (media !== 'ok') return;
    setMedia('refreshing');
    try {
      const task = await getHairColorTask(preview.taskId);
      if (task.status === 'success' && task.resultUrl && task.resultUrl !== preview.resultUrl) {
        updatePreview(preview.taskId, { resultUrl: task.resultUrl });
        setMedia('ok');
        return;
      }
    } catch {
      // Falls through to the unavailable state.
    }
    setMedia('unavailable');
  };

  const comparable = previewsFromSamePhoto(previews, preview).length >= 2;
  const saved = preview.savedLookId !== null;
  const saveError = save.error
    ? save.error instanceof EdgeFunctionError
      ? save.error.message
      : 'Couldn’t save. Check your connection and try again — it won’t be saved twice.'
    : null;

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <View className="h-12 flex-row items-center justify-between px-2">
        <IconButton icon="arrowLeft" label="Back" strokeWidth={1.8} onPress={() => router.back()} />
        <Text className="font-sans-semibold text-overline uppercase text-muted">Your color preview</Text>
        <IconButton
          icon="close"
          label="Back to Hair Color Studio"
          strokeWidth={1.8}
          onPress={() => router.dismissTo('/hair/color')}
        />
      </View>

      {media === 'unavailable' ? (
        <ColorErrorState
          kind="expired"
          photo={preview.photo}
          choice={preview.choice}
          onAction={(action) => router.dismissTo(action === 'edit_colors' ? editor : '/hair/color')}
        />
      ) : (
        <>
          <ScrollView contentContainerClassName="gap-4 px-5 pb-6 pt-1" showsVerticalScrollIndicator={false}>
            <View className="gap-2">
              <Text accessibilityRole="header" className="font-serif text-hero text-ink">
                Meet Your New <Text className="font-serif-italic text-plum">Hair Color.</Text>
              </Text>
              <View className="flex-row flex-wrap items-center gap-2">
                <View className="rounded-full bg-blush px-2.5 py-1">
                  <Text className="font-sans-semibold text-caption uppercase tracking-[1px] text-muted">
                    {preview.choice.mode === 'full' ? 'Full color' : 'Ombre'}
                  </Text>
                </View>
                <HairSwatch swatch={preview.choice.swatch} width={16} height={18} radius={5} />
                <Text className="font-sans-semibold text-body-m text-ink">{preview.choice.name}</Text>
                <Text className="font-sans text-body-m text-muted">{preview.choice.source}</Text>
              </View>
            </View>

            <BeforeAfter
              before={preview.photo.uri}
              after={preview.resultUrl}
              aspectRatio={Math.min(1.25, Math.max(0.75, preview.photo.width / preview.photo.height))}
              onAfterError={refreshResult}
            />

            <Text className="text-center font-sans text-body-s text-muted">
              AI preview by YouCam. Actual results may vary with your hair and real-world coloring.
            </Text>

            {saved ? (
              <View accessibilityLiveRegion="polite" className="flex-row items-center gap-3 rounded-lg bg-blush p-4">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-plum">
                  <Icon name="bookmark" size={18} color={colors.white} filled />
                </View>
                <Text className="flex-1 font-sans text-body-m text-ink">
                  Saved to your Lookbook with its color details.
                </Text>
                <Text
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: '/look/[id]',
                      params: { id: preview.savedLookId as string },
                    })
                  }
                  className="py-2 pl-2 font-sans-semibold text-label-s text-plum">
                  View
                </Text>
              </View>
            ) : null}
            {saveError ? (
              <View accessibilityLiveRegion="polite" className="gap-1 rounded-lg bg-blush p-4">
                <Text className="font-sans-semibold text-label-s text-ink">Not saved yet</Text>
                <Text className="font-sans text-body-s text-muted">{saveError}</Text>
              </View>
            ) : null}
          </ScrollView>

          <FooterBar>
            {saved ? (
              <Button
                label="Saved to Lookbook"
                icon="bookmark"
                variant="secondary"
                onPress={() => router.navigate('/lookbook')}
              />
            ) : (
              <Button
                label={save.isPending ? 'Saving…' : saveError ? 'Try Save Again' : 'Save to Lookbook'}
                icon="bookmark"
                disabled={save.isPending}
                onPress={() => save.mutate()}
              />
            )}
            <View className="flex-row gap-2.5">
              <Button
                label="Try Another Color"
                variant="secondary"
                className="flex-1"
                onPress={() => router.dismissTo(editor)}
              />
              {/* Compare needs two real hair color previews of the same original photo. */}
              <Button
                label={comparable ? 'Compare Variations' : 'Create a Variation'}
                variant="secondary"
                icon={comparable ? 'compare' : undefined}
                className="flex-1"
                onPress={() => (comparable ? router.push('/pending/look-battle') : router.dismissTo(editor))}
              />
            </View>
          </FooterBar>
        </>
      )}
    </View>
  );
}
