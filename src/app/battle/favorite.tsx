import { Redirect, router } from 'expo-router';
import { ActivityIndicator, KeyboardAvoidingView, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { FooterBar } from '@/components/ui/footer-bar';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Thumb } from '@/components/ui/thumb';
import { goBack, LookImage, TypeChip } from '@/features/battle/components';
import { useAssistantSession } from '@/features/assistant/session';
import { useBattleSession } from '@/features/battle/battle-session';
import { lookDetails, typeLabel } from '@/features/battle/looks';
import { useSaveLooks } from '@/features/battle/save';
import { useBattleLooks } from '@/features/battle/use-battle-looks';
import { EdgeFunctionError } from '@/lib/supabase';
import { colors } from '@/theme';

// P5A-7 — Favorite selected. Choosing is not saving: the look is stored only on Save.
export default function FavoriteSelected() {
  const insets = useSafeAreaInsets();
  const decision = useBattleSession((state) => state.decision);
  const setNote = useBattleSession((state) => state.setNote);
  const { looks, isPending } = useBattleLooks();
  const save = useSaveLooks();

  if (!decision) return <Redirect href="/battle" />;
  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color={colors.plum} />
      </View>
    );
  }
  const favorite = looks.find((look) => look.key === decision.favoriteKey);
  const other = looks.find((look) => look.key === decision.comparedWithKey);
  // The favorite's preview is no longer available (e.g. an unsaved result expired).
  if (!favorite) return <Redirect href="/battle/choose" />;

  const note = decision.note.trim();
  const noteChanged = note.length > 0 && note !== (favorite.note ?? '');
  const saved = Boolean(favorite.savedLookId);
  const saveError = save.error
    ? save.error instanceof EdgeFunctionError
      ? save.error.message
      : 'Couldn’t save. Check your connection and try again — it won’t be saved twice.'
    : null;
  const details = lookDetails(favorite);

  return (
    <KeyboardAvoidingView behavior="height" className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <View className="h-12 flex-row items-center justify-between px-2">
        <IconButton
          icon="arrowLeft"
          label="Back to Look Battle"
          strokeWidth={1.8}
          onPress={() => goBack('/battle/compare')}
        />
        <Text className="font-sans-semibold text-overline uppercase text-muted">Your favorite</Text>
        <IconButton
          icon="close"
          label="Close and return to Look Battle"
          strokeWidth={1.8}
          onPress={() => router.dismissTo('/battle')}
        />
      </View>

      <ScrollView
        contentContainerClassName="gap-4 px-5 pb-6 pt-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" className="font-serif text-hero text-ink">
          You Found Your <Text className="font-serif-italic text-plum">Favorite.</Text>
        </Text>

        <LookImage look={favorite} aspectRatio={favorite.aspectRatio}>
          <View className="absolute left-3 top-3 flex-row items-center gap-1.5 rounded-full bg-plum px-2.5 py-1">
            <Icon name="heart" size={13} color={colors.white} filled />
            <Text className="font-sans-semibold text-caption text-white">Your favorite</Text>
          </View>
          {other ? (
            <View className="absolute bottom-3 right-3 max-w-[70%] flex-row items-center gap-2 rounded-[14px] bg-canvas/95 p-1.5 pr-3">
              <Thumb uri={other.imageUrl} size={32} />
              <View className="flex-shrink">
                <Text className="font-sans text-[11px] leading-[14px] text-muted">Chosen over</Text>
                <Text numberOfLines={1} className="font-sans-semibold text-caption text-ink">
                  {other.title} · {typeLabel(other)}
                </Text>
              </View>
            </View>
          ) : null}
        </LookImage>

        <View className="gap-1.5">
          <Text className="font-serif text-title-lg text-ink">{favorite.title}</Text>
          <TypeChip look={favorite} />
        </View>

        <View className="gap-2 rounded-lg border border-blush bg-card p-4">
          <Text className="font-sans-semibold text-overline uppercase text-muted">What you chose</Text>
          {details.map((row) => (
            <View key={row.label} className="flex-row gap-3 border-b border-line py-2">
              <Text className="w-[104px] font-sans text-body-s text-muted">{row.label}</Text>
              <Text className="flex-1 font-sans-semibold text-body-s text-ink">{row.value}</Text>
            </View>
          ))}
          {other ? (
            <View className="flex-row gap-3 py-2">
              <Text className="w-[104px] font-sans text-body-s text-muted">Instead of</Text>
              <Text className="flex-1 font-sans-semibold text-body-s text-ink">
                {other.title} · {typeLabel(other)}
              </Text>
            </View>
          ) : null}
        </View>

        <View className="gap-1.5">
          <Text className="font-sans-semibold text-label-s text-ink">
            Note <Text className="font-sans text-muted">· optional</Text>
          </Text>
          <TextInput
            value={decision.note}
            onChangeText={setNote}
            placeholder="Why this one? e.g. for the wedding weekend"
            placeholderTextColor={colors.placeholder}
            accessibilityLabel="Personal note, optional"
            multiline
            maxLength={280}
            className="min-h-[72px] rounded-[18px] border border-line bg-card px-4 py-3 font-sans text-[16px] text-ink"
            style={{ textAlignVertical: 'top' }}
          />
          <Text className="font-sans text-body-s text-muted">Kept only if you save this look. Never shared.</Text>
        </View>

        {saved && !noteChanged ? (
          <View accessibilityLiveRegion="polite" className="flex-row items-center gap-3 rounded-lg bg-blush p-4">
            <Icon name="bookmark" size={18} color={colors.plum} filled />
            <Text className="flex-1 font-sans text-body-m text-ink">
              {favorite.note ? 'Saved to your Lookbook with your note.' : 'Saved to your Lookbook.'}
            </Text>
            <Text
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/look/[id]', params: { id: favorite.savedLookId as string } })}
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
        <Text className="text-center font-sans text-body-s text-muted">
          AI preview by YouCam. Actual results may vary.
        </Text>
      </ScrollView>

      <FooterBar>
        {/* One Save control: Save, Save Note (already saved, new note), or the saved state. */}
        <Button
          label={
            save.isPending
              ? 'Saving…'
              : !saved
                ? 'Save to My Lookbook'
                : noteChanged
                  ? 'Save Note'
                  : 'Saved to Lookbook'
          }
          icon="bookmark"
          variant={saved && !noteChanged ? 'secondary' : 'primary'}
          disabled={save.isPending || (saved && !noteChanged)}
          onPress={() => save.mutate({ looks: [favorite], note: note || undefined })}
        />
        <View className="flex-row gap-2.5">
          <Button
            label="Compare Again"
            variant="secondary"
            className="flex-1"
            onPress={() => router.dismissTo('/battle/choose')}
          />
          <Button
            label="Get AI Insight"
            icon="sparkle"
            variant="secondary"
            className="flex-1"
            onPress={() => {
              if (other) useAssistantSession.getState().setPair([favorite.key, other.key]);
              router.push('/battle/decide?entry=favorite');
            }}
          />
        </View>
      </FooterBar>

    </KeyboardAvoidingView>
  );
}
