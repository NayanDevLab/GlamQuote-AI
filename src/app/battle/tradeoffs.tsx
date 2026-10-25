import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { FooterBar } from '@/components/ui/footer-bar';
import { IconButton } from '@/components/ui/icon-button';
import { assistErrorKind, QUESTIONS, requestAnswer, type Question } from '@/features/assistant/api';
import { Bullets, InsightCard, InsightSection, sharedNote, useAssistPair } from '@/features/assistant/components';
import { useAssistantSession } from '@/features/assistant/session';
import { useBattleSession } from '@/features/battle/battle-session';
import { comparisonRows } from '@/features/battle/looks';
import { colors } from '@/theme';

const ERROR_TEXT: Record<ReturnType<typeof assistErrorKind>, string> = {
  quota: 'You’ve used today’s style insights. They refresh tomorrow — the style details above still apply.',
  provider: 'The AI service didn’t respond this time. You can pick the question again in a moment.',
  network: 'You seem to be offline. Check your connection and pick the question again.',
  invalid: 'The AI reply didn’t pass our checks, so we’re not showing it.',
  noMetadata: 'These looks don’t have enough shared style details for this question.',
  unavailable: 'This answer isn’t available right now.',
};

// P5B-5 — Explore the trade-offs: one of four fixed questions at a time (not a chatbot).
export default function ExploreTradeoffs() {
  const insets = useSafeAreaInsets();
  const { pair } = useAssistPair();
  const preferences = useAssistantSession((state) => state.preferences);
  const note = useAssistantSession((state) => sharedNote(state.note, state.shareNote));
  const decision = useBattleSession((state) => state.decision);
  const [question, setQuestion] = useState<Question | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [a, b] = pair ?? [];

  // "What are the differences" is answered from the stored details alone — no Gemini request.
  const askAi = question !== null && question !== 'diff';
  const answer = useQuery({
    queryKey: ['style-answer', a?.key, b?.key, preferences, note, question],
    queryFn: () =>
      requestAnswer({
        lookA: a!.key,
        lookB: b!.key,
        preferences,
        note,
        question: question as Exclude<Question, 'diff'>,
      }),
    enabled: askAi && Boolean(pair),
    retry: false,
    staleTime: Infinity,
    gcTime: 30 * 60_000,
  });

  if (!pair || !a || !b) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-canvas px-8">
        <Text className="text-center font-sans text-body-m text-muted">
          These two looks can’t be compared any more.
        </Text>
        <Button label="Choose Two Looks" onPress={() => router.dismissTo('/battle/choose')} />
      </View>
    );
  }

  const preselected = decision && [a.key, b.key].includes(decision.favoriteKey) ? decision.favoriteKey : null;
  const chosen = picked ?? preselected;
  const label = QUESTIONS.find((item) => item.id === question)?.label;
  const diffRows = comparisonRows(a, b).filter((row) => row.differs);

  const choose = () => {
    if (!chosen) return;
    const other = chosen === a.key ? b : a;
    useBattleSession.getState().decide({ favoriteKey: chosen, comparedWithKey: other.key, category: a.category });
    router.dismissTo('/battle/favorite');
  };

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <View className="h-12 flex-row items-center justify-between px-2">
        <IconButton icon="arrowLeft" label="Back to insights" strokeWidth={1.8} onPress={() => router.back()} />
        <Text className="font-sans-semibold text-overline uppercase text-muted">Explore trade-offs</Text>
        <View className="w-12" />
      </View>
      <ScrollView contentContainerClassName="gap-4 px-5 pb-6 pt-1" showsVerticalScrollIndicator={false}>
        <View className="gap-1.5">
          <Text accessibilityRole="header" className="font-serif text-hero text-ink">
            Explore What <Text className="font-serif-italic text-plum">Matters.</Text>
          </Text>
          <Text className="font-sans text-body-l text-muted">
            Pick one question about <Text className="font-sans-semibold text-ink">{a.title}</Text> vs{' '}
            <Text className="font-sans-semibold text-ink">{b.title}</Text>.
          </Text>
        </View>

        <View accessibilityRole="radiogroup" className="gap-2.5">
          {QUESTIONS.map((item) => {
            const on = question === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => setQuestion(item.id)}
                className={`flex-row items-center gap-3 rounded-lg bg-card px-4 py-3.5 ${on ? 'border-2 border-plum' : 'border border-line'}`}>
                <View
                  className={`h-5 w-5 items-center justify-center rounded-full border-2 ${on ? 'border-plum' : 'border-line-strong'}`}>
                  {on ? <View className="h-2.5 w-2.5 rounded-full bg-plum" /> : null}
                </View>
                <Text className="flex-1 font-sans-semibold text-body-m text-ink">{item.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {question === 'diff' ? (
          <InsightCard
            title="Answer"
            subtitle="From the recorded style details — no AI needed"
            badge="Rule-based · not AI">
            <Text className="font-sans-semibold text-label text-ink">{label}</Text>
            <InsightSection title="What the details show">
              {diffRows.length ? (
                <Bullets items={diffRows.map((row) => `${row.label}: Look A — ${row.a}; Look B — ${row.b}`)} />
              ) : (
                <Text className="font-sans text-body-m text-ink">
                  The recorded details are the same for both looks.
                </Text>
              )}
            </InsightSection>
          </InsightCard>
        ) : askAi ? (
          <InsightCard title="Answer" subtitle="From the style details and your preferences" badge="AI text guidance">
            <Text className="font-sans-semibold text-label text-ink">{label}</Text>
            {answer.isFetching ? (
              <View className="flex-row items-center gap-2 py-2">
                <ActivityIndicator color={colors.plum} />
                <Text className="font-sans text-body-m text-muted">Thinking it through…</Text>
              </View>
            ) : answer.isError ? (
              <Text accessibilityLiveRegion="polite" className="font-sans text-body-m text-ink">
                {ERROR_TEXT[assistErrorKind(answer.error)]}
              </Text>
            ) : answer.data ? (
              <>
                <InsightSection title="What the details show">
                  <Bullets items={answer.data.answer.points} />
                </InsightSection>
                {answer.data.answer.unknowns.length ? (
                  <View className="gap-1.5 rounded-[14px] bg-blush p-3">
                    <Text className="font-sans-bold text-overline uppercase text-muted">What we don’t know</Text>
                    <Bullets items={answer.data.answer.unknowns} />
                  </View>
                ) : null}
                <Text className="font-sans text-caption text-muted">
                  Based on your preferences and the available style details. Gemini hasn’t seen your photos.
                </Text>
              </>
            ) : null}
          </InsightCard>
        ) : null}
      </ScrollView>

      <FooterBar>
        <View className="flex-row items-center gap-2.5">
          <Text className="font-sans-semibold text-body-s text-muted">Your pick</Text>
          {([a, b] as const).map((look, index) => {
            const on = chosen === look.key;
            return (
              <Pressable
                key={look.key}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`Look ${index === 0 ? 'A' : 'B'}: ${look.title}`}
                onPress={() => setPicked(look.key)}
                className={`h-12 flex-1 items-center justify-center rounded-full ${on ? 'bg-plum' : 'border-[1.5px] border-line-strong'}`}>
                <Text className={`font-sans-semibold text-label ${on ? 'text-white' : 'text-ink'}`}>
                  Look {index === 0 ? 'A' : 'B'}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Button label="Choose My Favorite" icon={chosen ? 'heart' : undefined} disabled={!chosen} onPress={choose} />
        <Text
          accessibilityRole="button"
          onPress={() => router.back()}
          className="self-center py-1 font-sans-semibold text-label-s text-plum">
          Back to Insights
        </Text>
      </FooterBar>
    </View>
  );
}
