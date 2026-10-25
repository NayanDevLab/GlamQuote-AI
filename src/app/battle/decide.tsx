import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { FooterBar } from '@/components/ui/footer-bar';
import { Icon } from '@/components/ui/icon';
import { CHANGES, GEMINI_TERMS_URL, MATTERS, NOTE_MAX, NOTE_PII, OCCASIONS } from '@/features/assistant/api';
import { AssistTutorial, PairCards, useAssistPair } from '@/features/assistant/components';
import { useAssistantSession } from '@/features/assistant/session';
import { finderToAssistant } from '@/features/look-finder/reuse';
import { BattleHeader, goBack } from '@/features/battle/components';
import { colors } from '@/theme';

function Question({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <View className="gap-2.5">
      <View className="flex-row items-baseline justify-between gap-2">
        <Text className="flex-1 font-sans-semibold text-label text-ink">{title}</Text>
        <Text className="font-sans-semibold text-caption text-muted">{hint}</Text>
      </View>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}

// P5B-2 — Your decision preferences. Everything is optional. `entry=favorite` comes from P5A-7.
export default function DecisionPreferences() {
  const insets = useSafeAreaInsets();
  const { entry } = useLocalSearchParams<{ entry?: string }>();
  const fromFavorite = entry === 'favorite';
  const { pair, isPending } = useAssistPair();
  const preferences = useAssistantSession((state) => state.preferences);
  const note = useAssistantSession((state) => state.note);
  const shareNote = useAssistantSession((state) => state.shareNote);
  const { setPreferences, toggleMatter, setNote, setShareNote, markTutorialSeen } = useAssistantSession.getState();
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const prefilled = useAssistantSession((state) => state.prefilledFromFinder);
  // Offer this guest's Look Finder answers as editable defaults (same category, empty answers only).
  const pairCategory = pair?.[0].category;
  useEffect(() => {
    if (!pairCategory) return;
    const mapped = finderToAssistant(pairCategory);
    if (mapped) useAssistantSession.getState().prefillFromFinder(mapped);
  }, [pairCategory]);

  const noteHasPii = NOTE_PII.test(note);
  const back = () => goBack(fromFavorite ? '/battle/favorite' : '/battle/compare');

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-canvas">
        <ActivityIndicator color={colors.plum} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior="height" className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <BattleHeader
        title="Help Me Decide"
        backLabel="Back to Look Battle"
        parent={fromFavorite ? '/battle/favorite' : '/battle/compare'}
        onHelp={() => setTutorialOpen(true)}
      />
      <ScrollView
        contentContainerClassName="gap-5 px-5 pb-6 pt-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="gap-1.5">
          <Text accessibilityRole="header" className="font-serif text-hero text-ink">
            What Matters Most <Text className="font-serif-italic text-plum">to You?</Text>
          </Text>
          <Text className="font-sans text-body-l text-muted">A few preferences can make your choice easier.</Text>
        </View>

        {pair ? (
          <View className="gap-2">
            <PairCards pair={pair} />
            <View className="flex-row gap-2">
              <Icon name="lock" size={14} color={colors.muted} />
              <Text className="flex-1 font-sans text-caption text-muted">
                Shown in the app only — Gemini never receives photos, previews or image links, just your answers and
                style details.
              </Text>
            </View>
          </View>
        ) : (
          <View className="gap-2 rounded-lg bg-blush p-4">
            <Text className="font-sans-semibold text-label-s text-ink">Pick two looks first.</Text>
            <Text className="font-sans text-body-s text-muted">
              Choose two previews from the same photo in Look Battle.
            </Text>
            <Text
              accessibilityRole="button"
              onPress={() => router.replace('/battle/choose')}
              className="self-start py-1.5 font-sans-semibold text-label-s text-plum">
              Choose Two Looks
            </Text>
          </View>
        )}

        {prefilled ? (
          <View className="flex-row items-center gap-2.5 rounded-lg bg-blush px-3.5 py-3">
            <Text className="flex-1 font-sans text-body-s text-ink">
              Prefilled from your <Text className="font-sans-semibold">Look Finder</Text> answers.
            </Text>
            <Text
              accessibilityRole="button"
              onPress={() => useAssistantSession.getState().dismissPrefill()}
              className="py-1 pl-2 font-sans-semibold text-label-s text-plum">
              Clear
            </Text>
          </View>
        ) : null}

        <Question title="1. What’s the occasion?" hint="Optional">
          {OCCASIONS.map((item) => (
            <Chip
              key={item.id}
              size="md"
              label={item.label}
              selected={preferences.occasion === item.id}
              onPress={() => setPreferences({ occasion: preferences.occasion === item.id ? null : item.id })}
            />
          ))}
        </Question>

        <Question title="2. What matters most?" hint="Optional · up to 2">
          {MATTERS.map((item) => {
            const on = preferences.matters.includes(item.id);
            const full = !on && preferences.matters.length >= 2;
            return (
              <View key={item.id} style={{ opacity: full ? 0.5 : 1 }}>
                <Chip size="md" label={item.label} selected={on} onPress={() => toggleMatter(item.id)} />
              </View>
            );
          })}
        </Question>

        <Question title="3. How much change do you prefer?" hint="Optional">
          {CHANGES.map((item) => (
            <Chip
              key={item.id}
              size="md"
              label={item.label}
              selected={preferences.change === item.id}
              onPress={() => setPreferences({ change: preferences.change === item.id ? null : item.id })}
            />
          ))}
        </Question>

        <View className="gap-2">
          <View className="flex-row items-baseline justify-between gap-2">
            <Text className="flex-1 font-sans-semibold text-label text-ink">4. Anything else that matters to you?</Text>
            <Text className="font-sans-semibold text-caption text-muted">Optional</Text>
          </View>
          <TextInput
            value={note}
            onChangeText={(text) => setNote(text.slice(0, NOTE_MAX))}
            placeholder="e.g. I type a lot at work"
            placeholderTextColor={colors.placeholder}
            accessibilityLabel="Anything else that matters to you, optional"
            maxLength={NOTE_MAX}
            multiline
            className={`min-h-[64px] rounded-[16px] border-[1.5px] bg-card px-3.5 py-3 font-sans text-[15px] text-ink ${
              noteHasPii ? 'border-[#A0525F]' : 'border-line'
            }`}
            style={{ textAlignVertical: 'top' }}
          />
          <View className="flex-row justify-between gap-2">
            <Text className={`flex-1 font-sans text-caption ${noteHasPii ? 'text-[#8A3446]' : 'text-muted'}`}>
              {noteHasPii
                ? 'Please remove contact details or links — they’re never sent to AI.'
                : 'Style preferences only. No names or personal details.'}
            </Text>
            <Text className="font-sans text-caption text-muted">
              {note.length}/{NOTE_MAX}
            </Text>
          </View>
          {note.trim() ? (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: shareNote, disabled: noteHasPii }}
              disabled={noteHasPii}
              onPress={() => setShareNote(!shareNote)}
              className="flex-row items-center gap-2.5 py-1">
              <View
                className={`h-6 w-6 items-center justify-center rounded-[6px] ${
                  shareNote && !noteHasPii ? 'bg-plum' : 'border-[1.5px] border-ink bg-card'
                }`}>
                {shareNote && !noteHasPii ? (
                  <Icon name="check" size={15} color={colors.white} strokeWidth={2.6} />
                ) : null}
              </View>
              <Text className="flex-1 font-sans text-body-s text-ink">
                Share this note with AI. Off by default — otherwise it stays on this phone.
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View className="gap-1.5 rounded-[14px] border border-blush bg-card p-3">
          <View className="flex-row items-center justify-center gap-2">
            <Icon name="lock" size={14} color={colors.plum} />
            <Text className="font-sans-semibold text-body-s text-plum">
              AI uses your answers and style details, not your photos.
            </Text>
          </View>
          <Text className="text-center font-sans text-caption text-muted">
            Your answers and the looks’ style names and settings are processed by Google’s Gemini API, which may use
            them to improve its products.{' '}
            <Text
              accessibilityRole="link"
              onPress={() => Linking.openURL(GEMINI_TERMS_URL)}
              className="font-sans-semibold text-plum">
              Gemini API terms
            </Text>
          </Text>
        </View>
      </ScrollView>

      <FooterBar>
        <Button
          label="Get My AI Insight"
          icon="sparkle"
          disabled={!pair || noteHasPii}
          onPress={() => router.push(fromFavorite ? '/battle/insight?entry=favorite' : '/battle/insight')}
        />
        <Button label="Compare Without AI" variant="secondary" onPress={back} />
      </FooterBar>

      <AssistTutorial
        visible={tutorialOpen}
        onClose={() => {
          markTutorialSeen();
          setTutorialOpen(false);
        }}
        onStart={() => undefined}
      />
    </KeyboardAvoidingView>
  );
}
