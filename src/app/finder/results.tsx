import { useQueryClient } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { IndeterminateBar, StatusRow } from '@/components/ui/progress';
import { answerLabels, finderErrorKind, useLookFinderPicks, type FinderErrorKind } from '@/features/look-finder/api';
import { ruleBasedPicks, TYPE_LABEL, type CatalogueStyle } from '@/features/look-finder/catalogue';
import { StyleThumb } from '@/features/look-finder/components';
import { openStyle } from '@/features/look-finder/open-style';
import { useLookFinderSession } from '@/features/look-finder/session';
import { colors, shadows } from '@/theme';

const ERROR_COPY: Record<FinderErrorKind, { tag: string; detail: string; retry: boolean }> = {
  error: {
    tag: 'Temporary problem',
    detail: 'Our AI helper hit a snag. Your answers are saved, so trying again only takes a tap.',
    retry: true,
  },
  offline: {
    tag: 'No connection',
    detail: 'You seem to be offline. Check your connection, then try again — your answers are saved.',
    retry: true,
  },
  quota: {
    tag: 'Busy right now',
    detail: 'Look Finder is in high demand. Please try again in a little while — Studios work as usual.',
    retry: false,
  },
  nomatch: {
    tag: 'No exact match',
    detail: 'None of our current styles fit every choice. Loosening one preference usually helps.',
    retry: false,
  },
};

function useTryLook() {
  const queryClient = useQueryClient();
  const [opening, setOpening] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const tryLook = async (style: CatalogueStyle) => {
    if (opening) return;
    setOpening(style.id);
    setProblem(null);
    try {
      await openStyle(style, queryClient);
    } catch (error) {
      setProblem(error instanceof Error ? error.message : 'This style couldn’t be opened right now.');
    } finally {
      setOpening(null);
    }
  };
  return { tryLook, opening, problem };
}

function PickCard({
  index,
  style,
  reason,
  opening,
  onTry,
}: {
  index: number;
  style: CatalogueStyle;
  reason: string;
  opening: boolean;
  onTry: () => void;
}) {
  const first = index === 0;
  return (
    <View
      style={first ? shadows.card : undefined}
      className={`gap-3 rounded-lg border-2 bg-card p-3.5 ${first ? 'border-plum' : 'border-blush'}`}>
      <View className="flex-row gap-3.5">
        <StyleThumb style={style} />
        <View className="flex-1 gap-1">
          <Text className="font-sans-semibold text-overline uppercase text-muted">
            Pick {index + 1} · {style.category === 'hair' ? 'Hair' : 'Nails'}
          </Text>
          <Text className="font-serif text-title text-ink">{style.name}</Text>
          <View className="self-start rounded-full bg-blush px-2 py-0.5">
            <Text className="font-sans-semibold text-[11px] leading-[15px] text-plum">{TYPE_LABEL[style.type]}</Text>
          </View>
          <Text className="font-sans text-body-s text-ink">{reason}</Text>
        </View>
      </View>
      <Button
        label={opening ? 'Opening…' : 'Try This Look'}
        trailingIcon="arrowRight"
        variant={first ? 'primary' : 'secondary'}
        disabled={opening}
        onPress={onTry}
      />
    </View>
  );
}

// P2·4 loading → P2·5 Your Look Matches · P2·6 error / no match with a rule-based fallback.
export default function LookFinderResults() {
  const insets = useSafeAreaInsets();
  const answers = useLookFinderSession((state) => state.submitted);
  const query = useLookFinderPicks(answers);
  const { tryLook, opening, problem } = useTryLook();

  if (!answers) return <Redirect href="/finder" />;
  const labels = answerLabels(answers);
  const area = answers.category === 'hair' ? 'Hair' : 'Nails';

  const header = (
    <View className="h-12 flex-row items-center justify-between px-2">
      <IconButton icon="arrowLeft" label="Back to your answers" strokeWidth={1.8} onPress={() => router.back()} />
      <Text className="pr-4 font-sans-semibold text-overline uppercase text-muted">AI Look Finder</Text>
    </View>
  );

  // ---------------------------------------------------------------- P2·4 loading
  if (query.isFetching) {
    return (
      <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
        {header}
        <View className="flex-1 justify-center gap-5 px-5">
          <View className="h-20 w-20 items-center justify-center self-center rounded-full bg-blush">
            <Icon name="sparkle" size={30} color={colors.plum} />
          </View>
          <Text
            accessibilityRole="header"
            accessibilityLiveRegion="polite"
            className="text-center font-serif text-title-lg text-ink">
            Finding styles <Text className="font-serif-italic text-plum">for you…</Text>
          </Text>
          <Text className="text-center font-sans text-body-m text-muted">
            Matching your preferences with looks you can actually try.
          </Text>
          <View className="self-center">
            <IndeterminateBar />
          </View>
          <View className="gap-3 rounded-lg border border-blush bg-card p-4">
            <StatusRow state="done" label="Reading your answers" />
            <StatusRow state="done" label="Checking our style catalogue" />
            <StatusRow state="active" label="Choosing a few to try" />
          </View>
          <Text
            accessibilityRole="button"
            onPress={() => router.back()}
            className="self-center px-4 py-3 font-sans-semibold text-label text-plum">
            Cancel
          </Text>
        </View>
      </View>
    );
  }

  const preferenceCard = (
    <View className="gap-2.5 rounded-lg bg-blush p-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-sans-semibold text-overline uppercase text-muted">Your preferences</Text>
        <Text
          accessibilityRole="button"
          onPress={() => router.back()}
          className="py-1 pl-3 font-sans-semibold text-label-s text-plum">
          Edit
        </Text>
      </View>
      <View className="flex-row flex-wrap gap-2">
        {labels.map((label) => (
          <View key={label} className="rounded-full bg-canvas px-3 py-1">
            <Text className="font-sans-semibold text-caption text-ink">{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const nailTransferNote =
    answers.category === 'nails' ? (
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/nail/designs')}
        className="flex-row items-center gap-3 rounded-lg border border-blush bg-card p-3.5 active:bg-canvas">
        <Icon name="upload" size={18} color={colors.plum} />
        <View className="flex-1">
          <Text className="font-sans-semibold text-label-s text-ink">Have your own nail inspiration?</Text>
          <Text className="font-sans text-body-s text-muted">
            Nail Transfer copies a design from a reference photo you add.
          </Text>
        </View>
        <Icon name="chevronRight" size={18} color={colors.ink} />
      </Pressable>
    ) : null;

  const footer = (
    <View className="gap-2.5">
      {problem ? (
        <Text accessibilityLiveRegion="polite" className="text-center font-sans text-body-s text-[#8A3446]">
          {problem}
        </Text>
      ) : null}
      <Button label="Refine My Preferences" variant="secondary" onPress={() => router.back()} />
      <Text
        accessibilityRole="button"
        onPress={() => router.navigate('/explore')}
        className="self-center py-1 font-sans-semibold text-label-s text-plum underline">
        Browse All Styles
      </Text>
      <Text className="text-center font-sans text-caption text-muted">
        AI previews are illustrative. Actual results may vary.
      </Text>
    </View>
  );

  // ---------------------------------------------------------------- P2·6 error / no match + fallback
  const picks = query.data?.picks ?? [];
  if (query.isError || (query.isSuccess && picks.length === 0)) {
    const kind: FinderErrorKind = query.isError ? finderErrorKind(query.error) : 'nomatch';
    const copy = ERROR_COPY[kind];
    const fallback = ruleBasedPicks(answers);
    return (
      <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
        {header}
        <ScrollView
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          contentContainerClassName="gap-4 px-5 pt-2">
          <View className="items-center gap-2">
            <View className="h-20 w-20 items-center justify-center rounded-full border border-champagne bg-blush">
              <Icon name="info" size={28} color={colors.plum} />
            </View>
            <Text className="font-sans-bold text-overline uppercase text-muted">{copy.tag}</Text>
            <Text
              accessibilityRole="header"
              accessibilityLiveRegion="polite"
              className="text-center font-serif text-title-lg text-ink">
              We couldn’t find your picks <Text className="font-serif-italic text-plum">right now.</Text>
            </Text>
            <Text className="text-center font-sans text-body-m text-muted">{copy.detail}</Text>
          </View>
          {copy.retry ? <Button label="Try Again" onPress={() => query.refetch({ cancelRefetch: false })} /> : null}
          <Button label="Browse Styles Manually" variant="secondary" onPress={() => router.navigate('/explore')} />

          <View className="gap-3 rounded-lg border border-blush bg-card p-4">
            <View className="flex-row items-center justify-between gap-2">
              <Text className="font-serif text-title text-ink">Popular picks</Text>
              <View className="rounded-full border border-dashed border-line-strong px-2 py-0.5">
                <Text className="font-sans-bold text-[11px] text-muted">Not AI · rule-based</Text>
              </View>
            </View>
            <Text className="font-sans text-body-s text-muted">
              Matched by simple filters on your answers: {labels.join(' · ')}. Not personalised by AI. Styling effort
              isn’t documented, so it isn’t used.
            </Text>
            {fallback.map((style) => (
              <Pressable
                key={style.id}
                accessibilityRole="button"
                accessibilityLabel={`Try ${style.name}, ${TYPE_LABEL[style.type]}`}
                disabled={Boolean(opening)}
                onPress={() => tryLook(style)}
                className="flex-row items-center gap-3 rounded-[16px] border border-blush p-2 active:bg-canvas">
                <StyleThumb style={style} size={56} />
                <View className="flex-1">
                  <Text className="font-sans-semibold text-label-s text-ink">{style.name}</Text>
                  <Text className="font-sans text-caption text-muted">{TYPE_LABEL[style.type]}</Text>
                </View>
                {opening === style.id ? (
                  <ActivityIndicator color={colors.plum} />
                ) : (
                  <Icon name="chevronRight" size={18} color={colors.ink} />
                )}
              </Pressable>
            ))}
          </View>
          {nailTransferNote}
          {footer}
        </ScrollView>
      </View>
    );
  }

  // ---------------------------------------------------------------- P2·5 Your Look Matches
  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      {header}
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        contentContainerClassName="gap-4 px-5 pt-1"
        showsVerticalScrollIndicator={false}>
        <View className="gap-1">
          <Text className="font-sans-semibold text-overline uppercase text-muted">Recommended · {area}</Text>
          <Text accessibilityRole="header" className="font-serif text-hero text-ink">
            Your Look <Text className="font-serif-italic text-plum">Matches</Text>
          </Text>
          <Text className="font-sans text-body-l text-muted">Picked based on what matters to you.</Text>
        </View>
        {preferenceCard}
        <View className="flex-row gap-2">
          <Icon name="info" size={14} color={colors.muted} />
          <Text className="flex-1 font-sans text-caption text-muted">
            Suggested by Gemini, using only styles you can try on in GlamQuote. Picks are a starting point, not a
            verdict.
            {query.data?.summary ? ` ${query.data.summary}` : ''}
          </Text>
        </View>
        {picks.map((pick, index) => (
          <PickCard
            key={pick.style.id}
            index={index}
            style={pick.style}
            reason={pick.reason}
            opening={opening === pick.style.id}
            onTry={() => tryLook(pick.style)}
          />
        ))}
        {query.data?.limitations.length ? (
          <View className="gap-1 rounded-lg bg-blush p-3.5">
            <Text className="font-sans-bold text-overline uppercase text-muted">Good to know</Text>
            {query.data.limitations.map((item) => (
              <Text key={item} className="font-sans text-body-s text-ink">
                {item}
              </Text>
            ))}
          </View>
        ) : null}
        {nailTransferNote}
        <View className="flex-row gap-2">
          <Icon name="bookmark" size={14} color={colors.muted} />
          <Text className="flex-1 font-sans text-caption text-muted">
            Try a look first — you can save the preview to My Lookbook once it’s ready. Nothing is generated until you
            add your photo and tap Generate.
          </Text>
        </View>
        {footer}
      </ScrollView>
    </View>
  );
}
