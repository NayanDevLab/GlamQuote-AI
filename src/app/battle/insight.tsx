import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { FooterBar } from '@/components/ui/footer-bar';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { IndeterminateBar } from '@/components/ui/progress';
import { assistErrorKind, preferenceLabels, type AssistErrorKind } from '@/features/assistant/api';
import {
  AssistTutorial,
  Bullets,
  InsightCard,
  InsightSection,
  PairCards,
  PreferenceSummary,
  StyleDetailsTable,
  useAssistPair,
  useInsight,
} from '@/features/assistant/components';
import { useAssistantSession } from '@/features/assistant/session';
import { useBattleSession } from '@/features/battle/battle-session';
import { BattleHeader } from '@/features/battle/components';
import { typeLabel } from '@/features/battle/looks';
import { colors } from '@/theme';

const BASED_ON = 'Based on your preferences and the available style details';
const COOLDOWN_MS = 30_000;

// P5B-7 copy (design), plus the case where the pair can't be checked on the server.
const ERRORS: Record<AssistErrorKind, { tag: string; body: string; retry: boolean; fallback: boolean; note?: string }> =
  {
    quota: {
      tag: 'Daily AI limit reached',
      body: 'You’ve used today’s style insights. They refresh tomorrow.',
      retry: false,
      fallback: true,
      note: 'Insights refresh tomorrow. Nothing else is affected.',
    },
    provider: {
      tag: 'Temporary problem',
      body: 'The AI service didn’t respond this time. Trying again usually works.',
      retry: true,
      fallback: true,
    },
    network: {
      tag: 'No connection',
      body: 'Check your connection and try again. Your answers are kept.',
      retry: true,
      fallback: true,
    },
    invalid: {
      tag: 'Couldn’t use that answer',
      body: 'The AI reply didn’t pass our checks, so we’re not showing it. You can try again.',
      retry: true,
      fallback: true,
    },
    noMetadata: {
      tag: 'Not enough style details',
      body: 'These looks don’t have enough shared style details for a useful AI insight. Comparing them visually works best.',
      retry: false,
      fallback: false,
      note: 'Trying again wouldn’t change this result.',
    },
    unavailable: {
      tag: 'Insight unavailable',
      body: 'Style insights aren’t available for these looks right now. You can still compare them and choose yourself.',
      retry: false,
      fallback: true,
      note: 'Trying again wouldn’t change this result.',
    },
  };

// P5B-3 processing → P5B-4 insight · P5B-6 balanced · P5B-7 error. No YouCam task, no auto-save.
export default function StyleInsight() {
  const insets = useSafeAreaInsets();
  const { entry } = useLocalSearchParams<{ entry?: string }>();
  const fromFavorite = entry === 'favorite';
  const { pair, isPending: pairPending } = useAssistPair();
  const preferences = useAssistantSession((state) => state.preferences);
  const decision = useBattleSession((state) => state.decision);
  const query = useInsight(pair);
  const [picked, setPicked] = useState<string | null>(null);
  const [failures, setFailures] = useState(0);
  const [coolingDown, setCoolingDown] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);

  // One manual retry, then a 30 s cooldown (design: provider failures).
  useEffect(() => {
    if (!coolingDown) return;
    const timer = setTimeout(() => setCoolingDown(false), COOLDOWN_MS);
    return () => clearTimeout(timer);
  }, [coolingDown]);

  const toLookBattle = () => router.dismissTo(fromFavorite ? '/battle/favorite' : '/battle/compare');

  if (pairPending || !pair) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-canvas px-8">
        {pairPending ? (
          <ActivityIndicator color={colors.plum} />
        ) : (
          <>
            <Text className="text-center font-sans text-body-m text-muted">
              These two looks can’t be compared any more.
            </Text>
            <Button label="Choose Two Looks" onPress={() => router.dismissTo('/battle/choose')} />
          </>
        )}
      </View>
    );
  }
  const [a, b] = pair;

  // ---------------------------------------------------------------- P5B-3 processing
  if (query.isPending || query.isFetching) {
    return (
      <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 16 }}>
        <View className="h-12 flex-row items-center justify-between px-2">
          <IconButton
            icon="close"
            label="Cancel and return to your answers"
            strokeWidth={1.8}
            onPress={() => router.back()}
          />
          <Text className="pr-4 font-sans-semibold text-overline uppercase text-muted">Help Me Decide</Text>
        </View>
        <ScrollView contentContainerClassName="items-center gap-4 px-5 pt-4" showsVerticalScrollIndicator={false}>
          <View aria-hidden className="h-[200px] w-[200px] items-center justify-center rounded-full bg-blush">
            <View className="absolute h-[176px] w-[176px] rounded-full border border-dashed border-champagne" />
            <View className="absolute left-3 top-14 h-24 w-[72px] -rotate-6 justify-end rounded-[14px] bg-card p-2">
              <Text className="font-serif-italic text-[18px] text-plum">A</Text>
            </View>
            <View className="absolute right-3 top-12 h-24 w-[72px] rotate-6 justify-end rounded-[14px] bg-card p-2">
              <Text className="self-end font-serif-italic text-[18px] text-plum">B</Text>
            </View>
            <View className="h-12 w-12 items-center justify-center rounded-full border-2 border-canvas bg-plum">
              <Icon name="sparkle" size={20} color={colors.white} />
            </View>
          </View>
          <Text
            accessibilityRole="header"
            accessibilityLiveRegion="polite"
            className="text-center font-serif text-title-lg text-ink">
            Thinking Through Your <Text className="font-serif-italic text-plum">Options…</Text>
          </Text>
          <Text className="text-center font-sans text-body-m text-muted">
            Comparing your preferences with the details of both looks.
          </Text>
          <IndeterminateBar />
          <View className="w-full gap-2.5 rounded-lg border border-blush bg-card p-4">
            {[a, b].map((look, index) => (
              <View key={look.key} className="flex-row items-center gap-2.5">
                <View className="h-6 w-6 items-center justify-center rounded-full bg-plum">
                  <Text className="font-sans-bold text-[12px] text-white">{index === 0 ? 'A' : 'B'}</Text>
                </View>
                <Text numberOfLines={1} className="flex-1 font-sans text-body-m text-ink">
                  <Text className="font-sans-semibold">{look.title}</Text> · {typeLabel(look)}
                </Text>
              </View>
            ))}
            {preferenceLabels(preferences).length ? (
              <View className="flex-row flex-wrap gap-2 border-t border-line pt-2.5">
                {preferenceLabels(preferences).map((label) => (
                  <View key={label} className="rounded-full bg-blush px-2.5 py-1">
                    <Text className="font-sans-semibold text-caption text-plum">{label}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
          <View className="flex-row gap-2">
            <Icon name="lock" size={14} color={colors.muted} />
            <Text className="flex-1 font-sans text-caption text-muted">
              Only these names, their style details and your answers are sent — no photos, previews or face details.
            </Text>
          </View>
          <Text
            accessibilityRole="button"
            onPress={() => router.back()}
            className="px-4 py-3 font-sans-semibold text-label text-plum">
            Cancel
          </Text>
          <Text className="-mt-3 font-sans text-body-s text-muted">Your answers and both looks stay selected.</Text>
        </ScrollView>
      </View>
    );
  }

  // ---------------------------------------------------------------- P5B-7 error + rule-based fallback
  if (query.isError) {
    const kind = assistErrorKind(query.error);
    const copy = ERRORS[kind];
    const retry = () => {
      const next = failures + 1;
      setFailures(next);
      if (next >= 2) setCoolingDown(true);
      query.refetch();
    };
    return (
      <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
        <View className="h-12 flex-row items-center justify-between px-2">
          <IconButton icon="arrowLeft" label="Back to your answers" strokeWidth={1.8} onPress={() => router.back()} />
          <Text className="pr-4 font-sans-semibold text-overline uppercase text-muted">Help Me Decide</Text>
        </View>
        <ScrollView contentContainerClassName="gap-4 px-5 pb-6 pt-2" showsVerticalScrollIndicator={false}>
          <View className="items-center gap-2">
            <View className="h-20 w-20 items-center justify-center rounded-full border border-champagne bg-blush">
              <Icon name="sparkle" size={28} color={colors.plum} />
            </View>
            <Text className="font-sans-bold text-overline uppercase text-muted">{copy.tag}</Text>
            <Text
              accessibilityRole="header"
              accessibilityLiveRegion="polite"
              className="text-center font-serif text-title-lg text-ink">
              Your Style Guide Is Taking <Text className="font-serif-italic text-plum">a Break.</Text>
            </Text>
            <Text className="text-center font-sans text-body-l text-muted">
              You can still compare your looks and choose your favorite.
            </Text>
            <Text className="text-center font-sans text-body-m text-ink">{copy.body}</Text>
            {copy.note && !copy.retry ? (
              <Text className="text-center font-sans text-body-s text-muted">{copy.note}</Text>
            ) : null}
          </View>
          <PairCards pair={pair} />
          {copy.fallback ? <StyleDetailsTable pair={pair} /> : null}
        </ScrollView>
        <FooterBar>
          {copy.retry ? (
            <Button
              label={coolingDown ? 'Try again in a moment' : 'Try Again'}
              disabled={coolingDown || (kind === 'invalid' && failures >= 1)}
              onPress={retry}
            />
          ) : null}
          <Button label="Continue Without AI" variant={copy.retry ? 'secondary' : 'primary'} onPress={toLookBattle} />
        </FooterBar>
      </View>
    );
  }

  // ---------------------------------------------------------------- P5B-4 insight / P5B-6 balanced
  const insight = query.data.insight;
  const balanced = insight.suggested_look === null;
  const preselected = decision && [a.key, b.key].includes(decision.favoriteKey) ? decision.favoriteKey : null;
  const chosen = picked ?? preselected;
  const chosenLetter = chosen === a.key ? 'A' : chosen === b.key ? 'B' : null;
  const suggested = insight.suggested_look === 'A' ? a : insight.suggested_look === 'B' ? b : null;

  const choose = () => {
    if (!chosen) return;
    const other = chosen === a.key ? b : a;
    useBattleSession.getState().decide({ favoriteKey: chosen, comparedWithKey: other.key, category: a.category });
    router.dismissTo('/battle/favorite');
  };

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <BattleHeader
        title="Your Style Insight"
        backLabel="Back to your answers"
        parent="/battle/decide"
        onHelp={() => setTutorialOpen(true)}
      />
      <ScrollView contentContainerClassName="gap-4 px-5 pb-6 pt-1" showsVerticalScrollIndicator={false}>
        <View className="gap-1.5">
          {balanced ? (
            <>
              <Text accessibilityRole="header" className="font-serif text-hero text-ink">
                Both Looks Have Something <Text className="font-serif-italic text-plum">to Offer.</Text>
              </Text>
              <Text className="font-sans text-body-l text-muted">
                Your answers fit both equally well, so there’s no clear pick — and we won’t invent one.
              </Text>
            </>
          ) : (
            <>
              <Text accessibilityRole="header" className="font-serif text-hero text-ink">
                Let’s Find Your <Text className="font-serif-italic text-plum">Favorite.</Text>
              </Text>
              <Text className="font-sans text-body-l text-muted">Helpful guidance based on your preferences.</Text>
            </>
          )}
        </View>

        <PairCards pair={pair} selected={chosen} onSelect={setPicked} />
        <PreferenceSummary preferences={preferences} onEdit={() => router.dismissTo('/battle/decide')} />

        <InsightCard title={balanced ? 'Balanced view' : 'Style insight'} subtitle={BASED_ON} badge="AI text guidance">
          <InsightSection letter="A" title={balanced ? 'Look A · known strengths' : 'Why Look A may suit you'}>
            <Text className="font-sans text-body-m text-ink">
              <Text className="font-sans-semibold">{a.title}</Text> — {insight.look_a_reason}
            </Text>
          </InsightSection>
          <InsightSection letter="B" title={balanced ? 'Look B · known strengths' : 'Why Look B may suit you'}>
            <Text className="font-sans text-body-m text-ink">
              <Text className="font-sans-semibold">{b.title}</Text> — {insight.look_b_reason}
            </Text>
          </InsightSection>
          <InsightSection title="Trade-offs to consider">
            <Bullets items={insight.tradeoffs} />
          </InsightSection>
          {suggested ? (
            <InsightSection title="A suggestion, based on your answers">
              <View className="gap-1 rounded-[14px] bg-blush p-3">
                <Text className="font-sans-semibold text-label-s text-ink">
                  Look {insight.suggested_look} · {suggested.title}
                </Text>
                <Text className="font-sans text-body-m text-ink">{insight.suggestion_reason}</Text>
                <Text className="font-sans text-caption text-muted">
                  A suggestion, not a verdict — the choice is yours.
                </Text>
              </View>
            </InsightSection>
          ) : null}
          {insight.limitations.length ? (
            <InsightSection title="Limits">
              <Bullets items={insight.limitations} />
            </InsightSection>
          ) : null}
          <Text className="font-sans text-caption text-muted">
            AI text guidance from Gemini. It hasn’t seen your photos or previews and doesn’t judge how you look.
          </Text>
        </InsightCard>

        <Text
          accessibilityRole="button"
          onPress={() => router.push('/battle/tradeoffs')}
          className="self-center px-4 py-2 font-sans-semibold text-label text-plum">
          Explore the trade-offs →
        </Text>
      </ScrollView>

      <FooterBar>
        <Button
          label={
            chosenLetter
              ? `Choose Look ${chosenLetter}`
              : balanced
                ? 'Choose My Favorite — tap A or B'
                : 'Tap Look A or B to choose'
          }
          icon={chosenLetter ? 'heart' : undefined}
          disabled={!chosenLetter}
          onPress={choose}
        />
        <View className="flex-row gap-2.5">
          <Button
            label={balanced ? 'Compare Visually' : 'Compare Again'}
            variant="secondary"
            className="flex-1"
            onPress={() => router.dismissTo('/battle/compare')}
          />
          <Button
            label={balanced ? 'Refine Preferences' : 'Refine My Preferences'}
            variant="secondary"
            className="flex-1"
            onPress={() => router.dismissTo('/battle/decide')}
          />
        </View>
      </FooterBar>

      <AssistTutorial visible={tutorialOpen} onClose={() => setTutorialOpen(false)} onStart={() => undefined} />
    </View>
  );
}
