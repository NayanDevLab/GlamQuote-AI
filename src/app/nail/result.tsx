import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BeforeAfter } from '@/components/ui/before-after';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { LOOKBOOK_QUERY_KEY, saveLook } from '@/features/lookbook/lookbook-api';
import { FooterBar, NailErrorState } from '@/features/nail/components';
import { useNailSession } from '@/features/nail/nail-session';
import { getNailTask } from '@/features/nail/nail-transfer-api';
import { EdgeFunctionError } from '@/lib/supabase';
import { colors } from '@/theme';

export default function NailResult() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const preview = useNailSession((state) => state.previews.find((p) => p.taskId === taskId));
  const updatePreview = useNailSession((state) => state.updatePreview);
  // 'refreshing' = the temporary link stopped loading and a new one is being requested.
  const [media, setMedia] = useState<'ok' | 'refreshing' | 'unavailable'>('ok');

  const save = useMutation({
    mutationFn: () => {
      if (!preview) throw new Error('No preview to save.');
      return saveLook({ taskId: preview.taskId, title: preview.designName, designSource: preview.designSource });
    },
    // "Saved" is shown only once the image is stored and the look is recorded.
    onSuccess: (look) => {
      updatePreview(look.taskId, { savedLookId: look.id });
      queryClient.invalidateQueries({ queryKey: LOOKBOOK_QUERY_KEY });
    },
  });

  // Only a real result this guest generated is ever shown here.
  if (!preview) return <Redirect href="/nail" />;

  // Result links expire after about two hours. Reading the task again issues a fresh one and
  // creates nothing new; if that fails too, say so instead of showing a broken image.
  const refreshResult = async () => {
    if (media !== 'ok') return;
    setMedia('refreshing');
    try {
      const task = await getNailTask(preview.kind, preview.taskId);
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

  const isVto = preview.kind === 'nail_vto';
  const designRoute = isVto ? '/nail/editor' : '/nail/designs';
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
          label="Back to Nail Studio"
          strokeWidth={1.8}
          onPress={() => router.dismissTo('/nail')}
        />
      </View>

      {media === 'unavailable' ? (
        <NailErrorState
          kind="expired"
          hand={preview.hand}
          custom={preview.kind === 'nail_vto'}
          onAction={(action) => router.dismissTo(action === 'change_design' ? designRoute : '/nail')}
        />
      ) : (
        <>
          <ScrollView contentContainerClassName="gap-4 px-5 pb-6 pt-1" showsVerticalScrollIndicator={false}>
            <View className="gap-1">
              <Text accessibilityRole="header" className="font-serif text-hero text-ink">
                Meet Your New <Text className="font-serif-italic text-plum">Nails.</Text>
              </Text>
              <Text className="font-sans text-body-m text-muted">
                <Text className="font-sans-semibold text-ink">{preview.designName}</Text> · applied by YouCam
                {isVto ? ' AI Nail Virtual Try-On' : ' AI Nail Transfer'}
              </Text>
            </View>

            <BeforeAfter
              before={preview.hand.uri}
              after={preview.resultUrl}
              aspectRatio={Math.min(1.25, Math.max(0.75, preview.hand.width / preview.hand.height))}
              onAfterError={refreshResult}
            />

            <Text className="text-center font-sans text-body-s text-muted">
              AI preview only. Actual results may vary.
            </Text>

            {preview.summary.length > 0 ? (
              <View className="gap-2.5 rounded-lg border border-blush bg-card p-4">
                {preview.summary.map((row) => (
                  <View key={row.label} className="flex-row justify-between gap-4">
                    <Text className="font-sans text-body-m text-muted">{row.label}</Text>
                    <Text className="flex-1 text-right font-sans-semibold text-body-m text-ink">{row.value}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {saved ? (
              <View accessibilityLiveRegion="polite" className="flex-row items-center gap-3 rounded-lg bg-blush p-4">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-plum">
                  <Icon name="bookmark" size={18} color={colors.white} filled />
                </View>
                <View className="flex-1">
                  <Text className="font-sans-semibold text-label-s text-ink">Saved to your Lookbook</Text>
                  <Text className="font-sans text-body-s text-muted">
                    Private to you. Open it anytime — no need to generate it again.
                  </Text>
                </View>
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
              <Button label="View My Lookbook" icon="bookmark" onPress={() => router.navigate('/lookbook')} />
            ) : (
              <Button
                label={save.isPending ? 'Saving…' : saveError ? 'Try Save Again' : 'Save to Lookbook'}
                icon="bookmark"
                disabled={save.isPending}
                onPress={() => save.mutate()}
              />
            )}
            <Button
              label={isVto ? 'Try Another Variation' : 'Try Another Design'}
              variant="secondary"
              onPress={() => router.dismissTo(designRoute)}
            />
            {/* Look Battle pairs it with another preview of the same photo, or says one is needed. */}
            <Button
              label="Compare Looks"
              variant="secondary"
              icon="compare"
              onPress={() => router.push({ pathname: '/battle/compare', params: { from: preview.taskId } })}
            />
          </FooterBar>
        </>
      )}
    </View>
  );
}
