import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { SavedImage } from '@/components/ui/saved-image';
import { Sheet } from '@/components/ui/sheet';
import { Thumb } from '@/components/ui/thumb';
import {
  deleteLook,
  LOOKBOOK_QUERY_KEY,
  listSavedLooks,
  lookArea,
  type SavedLook,
} from '@/features/lookbook/lookbook-api';
import { EdgeFunctionError } from '@/lib/supabase';
import { colors } from '@/theme';

function lookType(look: SavedLook): string {
  if (look.kind === 'hairstyle') return 'YouCam Hairstyle';
  if (look.kind === 'hair_color') return look.effectType === 'ombre' ? 'Ombre Hair Color' : 'Full Hair Color';
  if (look.effectType === 'nail_polish') return 'Nail Polish';
  if (look.effectType === 'press_on_nails') return 'Press-On Nails';
  return 'Nail Transfer';
}

const savedOn = (look: SavedLook) => new Date(look.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' });

/**
 * P6A-7 — Delete Look confirmation. Success is shown only after the server has deleted both the
 * saved image and the record; a partial failure says so and offers Retry.
 */
function DeleteLookSheet({ look, visible, onClose }: { look: SavedLook; visible: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const remove = useMutation({
    mutationFn: () => deleteLook(look.id),
    // One request per tap; never retried automatically.
    retry: false,
    onSuccess: () => {
      queryClient.setQueryData<SavedLook[]>(LOOKBOOK_QUERY_KEY, (looks) => looks?.filter((item) => item.id !== look.id));
      queryClient.invalidateQueries({ queryKey: LOOKBOOK_QUERY_KEY });
      onClose();
      router.back();
    },
    onError: (error) => {
      // Already gone (e.g. deleted from another screen): the Lookbook just needs refreshing.
      if (error instanceof EdgeFunctionError && error.code === 'not_found') {
        queryClient.invalidateQueries({ queryKey: LOOKBOOK_QUERY_KEY });
      }
    },
  });
  const failure = remove.error;
  const incomplete = failure instanceof EdgeFunctionError && failure.code === 'delete_incomplete';
  const gone = failure instanceof EdgeFunctionError && failure.code === 'not_found';
  const close = () => {
    if (remove.isPending) return;
    if (incomplete) {
      // Hidden on the server and retried later: leave the details screen too.
      queryClient.invalidateQueries({ queryKey: LOOKBOOK_QUERY_KEY });
      onClose();
      router.back();
      return;
    }
    remove.reset();
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      onClose={close}
      eyebrow={incomplete ? 'Deletion isn’t finished yet' : undefined}
      title={
        incomplete ? (
          <Text className="font-serif text-title-lg text-ink">1 saved image couldn’t be deleted yet</Text>
        ) : (
          <>
            Delete This <Text className="font-serif-italic text-danger">Look?</Text>
          </>
        )
      }>
      <View className="flex-row items-center gap-3 rounded-[18px] border border-blush bg-card p-3">
        <Thumb uri={look.imageUrl} size={56} />
        <View className="flex-1 gap-0.5">
          <Text numberOfLines={1} className="font-sans-semibold text-label-s text-ink">
            {look.title}
          </Text>
          <Text className="font-sans text-caption text-muted">
            {lookType(look)} · saved {savedOn(look)}
          </Text>
        </View>
      </View>

      {incomplete ? (
        <Text className="font-sans text-body-m text-ink">
          This look is hidden from your Lookbook, but its saved image couldn’t be deleted yet. We haven’t removed
          everything, so we won’t say it’s gone. We’ll retry each time you open your Lookbook, or you can retry now.
        </Text>
      ) : gone ? (
        <Text className="font-sans text-body-m text-ink">This look has already been removed from your Lookbook.</Text>
      ) : (
        <>
          <View className="gap-2">
            {[
              'Removes this look, its title and note from your Lookbook.',
              'Deletes the saved AI preview from GlamQuote’s storage. Your original photo was never stored.',
            ].map((line) => (
              <View key={line} className="flex-row gap-2">
                <Icon name="check" size={16} color={colors.plum} strokeWidth={2.2} />
                <Text className="flex-1 font-sans text-body-s text-ink">{line}</Text>
              </View>
            ))}
          </View>
          <View className="gap-1 rounded-[14px] bg-danger-tint p-3">
            <Text className="font-sans-semibold text-label-s text-danger">This can’t be undone</Text>
            <Text className="font-sans text-caption text-ink">
              Copies you’ve already shared or downloaded aren’t affected. YouCam handles images it processed under its
              own retention policy, which this doesn’t change.
            </Text>
          </View>
        </>
      )}

      {failure && !incomplete && !gone ? (
        <Text accessibilityLiveRegion="polite" className="font-sans text-body-s text-danger">
          {failure instanceof EdgeFunctionError
            ? failure.message
            : 'Nothing was deleted. Check your connection and try again.'}
        </Text>
      ) : null}

      {remove.isPending ? (
        <View accessibilityLiveRegion="polite" className="flex-row items-center justify-center gap-2 py-3">
          <ActivityIndicator color={colors.plum} />
          <Text className="font-sans-semibold text-label-s text-ink">Deleting your look…</Text>
        </View>
      ) : gone ? (
        <Button label="Back to Lookbook" onPress={() => router.navigate('/lookbook')} />
      ) : (
        <>
          <Button
            label={incomplete ? 'Retry Deletion' : failure ? 'Try Again' : 'Delete Look'}
            icon={incomplete ? 'replay' : 'trash'}
            onPress={() => remove.mutate()}
          />
          <Button label={incomplete ? 'Back to Lookbook' : 'Keep My Look'} variant="secondary" onPress={close} />
        </>
      )}
    </Sheet>
  );
}

/** A saved look, reopened from stored media. Viewing it never calls YouCam. */
export default function SavedLookDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: looks, isPending } = useQuery({ queryKey: LOOKBOOK_QUERY_KEY, queryFn: listSavedLooks });
  const look = looks?.find((item) => item.id === id);
  const [deleteOpen, setDeleteOpen] = useState(false);

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
            <SavedImage uri={look.imageUrl} label={`AI preview: ${look.title}`} style={{ width: '100%', aspectRatio: ratio }} />
            <View className="absolute right-3 top-3 rounded-full bg-plum px-3 py-1.5">
              <Text className="font-sans-semibold text-caption text-white">{'AI Preview'}</Text>
            </View>
          </View>
          <View className="gap-1">
            <Text className="font-sans-semibold text-overline uppercase text-muted">
              {lookArea(look)} · {lookType(look)}
            </Text>
            <Text accessibilityRole="header" className="font-serif text-title-lg text-ink">
              {look.title}
            </Text>
            <Text className="font-sans text-body-m text-muted">Saved {savedOn(look)} · private to you</Text>
          </View>
          {look.note ? (
            <View className="gap-1 rounded-lg border border-blush bg-card p-4">
              <Text className="font-sans-semibold text-overline uppercase text-muted">Your note</Text>
              <Text className="font-sans text-body-m text-ink">{look.note}</Text>
            </View>
          ) : null}
          <Text className="font-sans text-body-s text-muted">AI preview only. Actual results may vary.</Text>
          <View className="items-center border-t border-blush pt-3">
            <Text
              accessibilityRole="button"
              accessibilityLabel={`Delete ${look.title}`}
              onPress={() => setDeleteOpen(true)}
              className="px-4 py-2.5 font-sans-semibold text-label-s text-danger">
              Delete Look
            </Text>
          </View>
          <DeleteLookSheet look={look} visible={deleteOpen} onClose={() => setDeleteOpen(false)} />
        </ScrollView>
      ) : (
        <View className="flex-1 justify-center gap-3 px-5">
          <Text className="font-serif text-title-lg text-ink">
            {isPending ? 'Opening your look…' : 'This look isn’t in your Lookbook.'}
          </Text>
          {isPending ? null : <Button label="Back to Lookbook" variant="secondary" onPress={() => router.back()} />}
        </View>
      )}
    </View>
  );
}
