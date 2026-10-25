import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { FooterBar } from '@/components/ui/footer-bar';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { CHANGE_OPTIONS, EFFORT_OPTIONS, OCCASION_OPTIONS, STYLE_OPTIONS } from '@/features/look-finder/api';
import type { LfCategory } from '@/features/look-finder/catalogue';
import { FinderTutorial } from '@/features/look-finder/components';
import { useLookFinderSession } from '@/features/look-finder/session';
import { colors, shadows } from '@/theme';

type OptionalKey = 'occasion' | 'style' | 'change' | 'effort';

const QUESTIONS: { key: OptionalKey; title: string; options: readonly { id: string; label: string }[] }[] = [
  { key: 'occasion', title: '2 · What’s the occasion?', options: OCCASION_OPTIONS },
  { key: 'style', title: '3 · Which style feels like you?', options: STYLE_OPTIONS },
  { key: 'change', title: '4 · How much change?', options: CHANGE_OPTIONS },
  { key: 'effort', title: '5 · Styling effort?', options: EFFORT_OPTIONS },
];

const CATEGORIES: { id: LfCategory; title: string; body: string }[] = [
  { id: 'hair', title: 'Hair', body: 'Cuts, colour, texture' },
  { id: 'nails', title: 'Nails', body: 'Shades, finishes, press-ons' },
];

// P2·3 — Look Finder preferences (P2·2 tutorial on the first visit). Only the category is required.
export default function LookFinderPreferences() {
  const insets = useSafeAreaInsets();
  const answers = useLookFinderSession((state) => state.answers);
  const hasSubmitted = useLookFinderSession((state) => state.hasSubmitted);
  const tutorialSeen = useLookFinderSession((state) => state.tutorialSeen);
  const { setAnswer, clearAnswers, markTutorialSeen, markSubmitted } = useLookFinderSession.getState();
  const [tutorialOpen, setTutorialOpen] = useState(!tutorialSeen);
  // A fast double tap must open Results once; unlocked when this screen is shown again.
  const submitting = useRef(false);
  useFocusEffect(
    useCallback(() => {
      submitting.current = false;
    }, []),
  );

  const answered = [answers.category, answers.occasion, answers.style, answers.change, answers.effort].filter(
    Boolean,
  ).length;
  const closeTutorial = () => {
    markTutorialSeen();
    setTutorialOpen(false);
  };

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <View className="h-12 flex-row items-center justify-between px-2">
        <IconButton icon="arrowLeft" label="Back" strokeWidth={1.8} onPress={() => router.back()} />
        <Text className="font-sans-semibold text-overline uppercase text-muted">AI Look Finder</Text>
        <IconButton icon="help" label="How Look Finder works — replay tutorial" onPress={() => setTutorialOpen(true)} />
      </View>

      <ScrollView contentContainerClassName="gap-5 px-5 pb-6 pt-1" showsVerticalScrollIndicator={false}>
        <View className="gap-1.5">
          <Text accessibilityRole="header" className="font-serif text-hero text-ink">
            Let’s Find Your <Text className="font-serif-italic text-plum">Look</Text>
          </Text>
          <Text className="font-sans text-body-l text-muted">A few choices will help us narrow things down.</Text>
        </View>

        <View accessible accessibilityLabel={`${answered} of 5 answered`} className="flex-row items-center gap-1.5">
          {[0, 1, 2, 3, 4].map((index) => (
            <View key={index} className={`h-1 flex-1 rounded-full ${index < answered ? 'bg-plum' : 'bg-line'}`} />
          ))}
          <Text className="pl-2 font-sans-semibold text-caption text-muted">{answered} of 5 answered</Text>
        </View>

        {hasSubmitted ? (
          <View className="flex-row items-center gap-2.5 rounded-lg bg-blush px-3.5 py-3">
            <Icon name="clock" size={16} color={colors.ink} />
            <Text className="flex-1 font-sans text-body-s text-ink">
              Your previous answers are kept. Change any you like.
            </Text>
            <Text
              accessibilityRole="button"
              onPress={clearAnswers}
              className="py-1 pl-2 font-sans-semibold text-label-s text-plum">
              Clear
            </Text>
          </View>
        ) : null}

        <View className="gap-2.5">
          <Text className="font-sans-semibold text-label text-ink">
            1 · What would you like to explore? <Text className="text-caption text-plum">Required</Text>
          </Text>
          <View className="flex-row gap-3">
            {CATEGORIES.map((category) => {
              const on = answers.category === category.id;
              return (
                <Pressable
                  key={category.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => setAnswer('category', category.id)}
                  style={on ? shadows.card : undefined}
                  className={`flex-1 gap-0.5 rounded-lg border-2 bg-card p-3.5 ${on ? 'border-plum' : 'border-blush'}`}>
                  <View className="flex-row items-center justify-between">
                    <Text className="font-sans-semibold text-label-l text-ink">{category.title}</Text>
                    {on ? (
                      <View className="h-5 w-5 items-center justify-center rounded-full bg-plum">
                        <Icon name="check" size={12} color={colors.white} strokeWidth={2.6} />
                      </View>
                    ) : null}
                  </View>
                  <Text className="font-sans text-body-s text-muted">{category.body}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {QUESTIONS.map((question) => {
          const value = answers[question.key];
          return (
            <View key={question.key} className="gap-2.5">
              <View className="flex-row items-baseline justify-between gap-2">
                <Text className="flex-1 font-sans-semibold text-label text-ink">
                  {question.title} <Text className="font-sans text-caption text-muted">Optional</Text>
                </Text>
                {value ? (
                  <Text
                    accessibilityRole="button"
                    onPress={() => setAnswer(question.key, null)}
                    className="py-1 pl-2 font-sans-semibold text-caption text-plum">
                    Skip
                  </Text>
                ) : null}
              </View>
              <View className="flex-row flex-wrap gap-2">
                {question.options.map((option) => (
                  <Chip
                    key={option.id}
                    size="md"
                    label={option.label}
                    selected={value === option.id}
                    onPress={() => setAnswer(question.key, (value === option.id ? null : option.id) as never)}
                  />
                ))}
              </View>
            </View>
          );
        })}

        <View className="flex-row gap-2">
          <Icon name="lock" size={14} color={colors.muted} />
          <Text className="flex-1 font-sans text-caption text-muted">
            Only your answers and GlamQuote’s list of supported styles go to Google’s Gemini — no photos, names or
            account details.
          </Text>
        </View>
      </ScrollView>

      <FooterBar>
        <Button
          label="Find My Styles"
          trailingIcon="arrowRight"
          disabled={!answers.category}
          onPress={() => {
            if (submitting.current) return;
            submitting.current = true;
            markSubmitted();
            router.push('/finder/results');
          }}
        />
        <Text
          accessibilityRole="button"
          onPress={() => router.navigate('/explore')}
          className="self-center py-1 font-sans-semibold text-label-s text-plum underline">
          {answers.category ? 'Browse manually instead' : 'Choose hair or nails to continue'}
        </Text>
      </FooterBar>

      <FinderTutorial visible={tutorialOpen} onClose={closeTutorial} />
    </View>
  );
}
