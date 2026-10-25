import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BeforeAfter } from '@/components/ui/before-after';
import { Button } from '@/components/ui/button';
import { FooterBar } from '@/components/ui/footer-bar';
import { IconButton } from '@/components/ui/icon-button';
import { HairErrorState } from '@/features/hair/components';
import { getHairstyleTask } from '@/features/hair/hair-api';
import { useHairSession } from '@/features/hair/hair-session';
import { LOOKBOOK_QUERY_KEY, saveLook } from '@/features/lookbook/lookbook-api';
import { EdgeFunctionError } from '@/lib/supabase';

// P4A-8 — Result. Shows only the `results.url` of a successful task, never the template image.
export default function HairResult() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const preview = useHairSession((state) => state.previews.find((p) => p.taskId === taskId));
  const updatePreview = useHairSession((state) => state.updatePreview);
  // 'refreshing' = the temporary link stopped loading and a new one is being requested.
  const [media, setMedia] = useState<'ok' | 'refreshing' | 'unavailable'>('ok');

  const save = useMutation({
    mutationFn: () => {
      if (!preview) throw new Error('No preview to save.');
      return saveLook({
        taskId: preview.taskId,
        title: preview.template.title,
        designSource: 'template',
        designId: preview.template.id,
      });
    },
    // "Saved" is shown only once the image is stored and the look is recorded.
    onSuccess: (look) => {
      updatePreview(look.taskId, { savedLookId: look.id });
      queryClient.invalidateQueries({ queryKey: LOOKBOOK_QUERY_KEY });
      router.push({ pathname: '/hair/saved', params: { taskId: look.taskId } });
    },
  });

  // Only a real result this guest generated is ever shown here.
  if (!preview) return <Redirect href="/hair" />;

  // Result links expire after about two hours. Reading the task again issues a fresh one and
  // creates nothing new; if that fails too, say so instead of showing a broken image.
  const refreshResult = async () => {
    if (media !== 'ok') return;
    setMedia('refreshing');
    try {
      const task = await getHairstyleTask(preview.taskId);
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
        <Text className="font-sans-semibold text-overline uppercase text-muted">Your preview</Text>
        <IconButton
          icon="close"
          label="Back to Hair Studio"
          strokeWidth={1.8}
          onPress={() => router.dismissTo('/hair')}
        />
      </View>

      {media === 'unavailable' ? (
        <HairErrorState
          kind="expired"
          selfie={preview.selfie}
          template={preview.template}
          onAction={(action) => router.dismissTo(action === 'change_style' ? '/hair/styles' : '/hair')}
        />
      ) : (
        <>
          <ScrollView contentContainerClassName="gap-4 px-5 pb-6 pt-1" showsVerticalScrollIndicator={false}>
            <View className="gap-1">
              <Text accessibilityRole="header" className="font-serif text-hero text-ink">
                Meet Your New <Text className="font-serif-italic text-plum">Hairstyle.</Text>
              </Text>
              <Text className="font-sans text-body-m text-muted">
                <Text className="font-sans-semibold text-ink">{preview.template.title}</Text> · applied by YouCam AI
                Hairstyle Virtual Try-On
              </Text>
            </View>

            <BeforeAfter
              before={preview.selfie.uri}
              after={preview.resultUrl}
              aspectRatio={Math.min(1.25, Math.max(0.75, preview.selfie.width / preview.selfie.height))}
              onAfterError={refreshResult}
            />

            <Text className="text-center font-sans text-body-s text-muted">AI preview only. Actual results may vary.</Text>

            {saveError ? (
              <View accessibilityLiveRegion="polite" className="gap-1 rounded-lg bg-blush p-4">
                <Text className="font-sans-semibold text-label-s text-ink">Not saved yet</Text>
                <Text className="font-sans text-body-s text-muted">{saveError}</Text>
              </View>
            ) : null}
          </ScrollView>

          <FooterBar>
            {saved ? (
              <Button label="View My Lookbook" icon="bookmark" onPress={() => router.navigate('/lookbook')} />
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
                label="Try Another Hairstyle"
                variant="secondary"
                className="flex-1"
                onPress={() => router.dismissTo('/hair/styles')}
              />
              {/* Look Battle pairs it with another preview of the same photo, or says one is needed. */}
              <Button
                label="Compare Looks"
                variant="secondary"
                icon="compare"
                className="flex-1"
                onPress={() => router.push({ pathname: '/battle/compare', params: { from: preview.taskId } })}
              />
            </View>
          </FooterBar>
        </>
      )}
    </View>
  );
}
