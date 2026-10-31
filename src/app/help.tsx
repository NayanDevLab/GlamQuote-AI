import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { InlineNote } from '@/components/ui/typography';
import { AssistTutorial } from '@/features/assistant/components';
import { useAssistantSession } from '@/features/assistant/session';
import { BattleTutorial } from '@/features/battle/components';
import { useBattleSession } from '@/features/battle/battle-session';
import { useHairColorSession } from '@/features/hair-color/hair-color-session';
import { useHairSession } from '@/features/hair/hair-session';
import { FinderTutorial } from '@/features/look-finder/components';
import { useLookFinderSession } from '@/features/look-finder/session';
import { useNailSession } from '@/features/nail/nail-session';
import { SettingsRow, SettingsScreen, SettingsSection } from '@/features/settings/list';
import { HairColorTutorial, HairTutorial, LookbookTutorial, NailTutorial } from '@/features/tutorials/sheets';
import { useAppStore } from '@/state/app-store';
import { colors } from '@/theme';

type Guide = 'nail' | 'hair' | 'color' | 'battle' | 'finder' | 'assist' | 'lookbook';

type Row = { guide: Guide; icon: IconName; title: string; subtitle: string };

const SECTIONS: { title: string; rows: Row[] }[] = [
  {
    title: 'YouCam features',
    rows: [
      {
        guide: 'nail',
        icon: 'image',
        title: 'Nail Studio',
        subtitle: 'Nail Transfer, polish and press-ons on your hand',
      },
      { guide: 'hair', icon: 'scanFace', title: 'Hairstyle Try-On', subtitle: 'Preview a new cut on your photo' },
      { guide: 'color', icon: 'sparkle', title: 'Hair Color Try-On', subtitle: 'Full color or ombre on your own hair' },
    ],
  },
  {
    title: 'Decision tools',
    rows: [
      { guide: 'battle', icon: 'compare', title: 'Look Battle', subtitle: 'Two of your previews, side by side' },
      { guide: 'finder', icon: 'search', title: 'Gemini Look Finder', subtitle: 'Style ideas from your preferences' },
      { guide: 'assist', icon: 'help', title: 'AI Decision Assistant', subtitle: 'Talk through trade-offs, text only' },
    ],
  },
  {
    title: 'My collection',
    rows: [{ guide: 'lookbook', icon: 'bookmark', title: 'My Lookbook', subtitle: 'Everything you chose to save' }],
  },
];

/** Where each guide's main button leads: the feature's own start screen — never a preview. */
const OPEN: Record<Exclude<Guide, 'lookbook'>, Href> = {
  nail: '/nail',
  hair: '/hair',
  color: '/hair/color',
  battle: '/battle',
  finder: '/finder',
  // Help Me Decide starts from a Look Battle pair.
  assist: '/battle',
};

function ReplayButton({ label, onPress }: { label: string; onPress: () => void }) {
  // Narrow screens or large text: drop the icon so the guide's title keeps its room.
  const { width, fontScale } = useWindowDimensions();
  const compact = width / fontScale < 400;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Replay ${label} tutorial`}
      onPress={onPress}
      className={`h-10 flex-row items-center gap-1 rounded-full border-[1.5px] border-line-strong active:bg-blush ${
        compact ? 'px-2.5' : 'px-3'
      }`}>
      {compact ? null : <Icon name="replay" size={15} color={colors.plum} strokeWidth={2} />}
      <Text numberOfLines={1} className="font-sans-semibold text-[13px] leading-[16px] text-plum">
        Replay
      </Text>
    </Pressable>
  );
}

// P7A-2 — Tutorials & Help Center. Replays the same sheets each feature shows on its first visit.
export default function HelpCenter() {
  const [open, setOpen] = useState<Guide | null>(null);
  const seen: Record<Guide, boolean | null> = {
    nail: useNailSession((state) => state.tutorialSeen),
    hair: useHairSession((state) => state.tutorialSeen),
    color: useHairColorSession((state) => state.tutorialSeen),
    battle: useBattleSession((state) => state.tutorialSeen),
    finder: useLookFinderSession((state) => state.tutorialSeen),
    assist: useAssistantSession((state) => state.tutorialSeen),
    // The Lookbook guide is only ever opened from its ?, so it has no seen state.
    lookbook: null,
  };

  // Watching a guide here counts as seeing it, so the feature won't show it again on arrival.
  const close = () => {
    if (open === 'nail') useNailSession.getState().markTutorialSeen();
    if (open === 'hair') useHairSession.getState().markTutorialSeen();
    if (open === 'color') useHairColorSession.getState().markTutorialSeen();
    if (open === 'battle') useBattleSession.getState().markTutorialSeen();
    if (open === 'finder') useLookFinderSession.getState().markTutorialSeen();
    if (open === 'assist') useAssistantSession.getState().markTutorialSeen();
    setOpen(null);
  };
  const go = (guide: Exclude<Guide, 'lookbook'>) => () => router.push(OPEN[guide]);

  return (
    <SettingsScreen title="Tutorials & Help" backLabel="Back">
      <View className="gap-1.5 px-1">
        <Text accessibilityRole="header" className="font-serif text-title-xl text-ink">
          Learn <Text className="font-serif-italic text-plum">GlamQuote</Text>
        </Text>
        <Text className="font-sans text-body-m text-muted">Everything you need to explore your next look.</Text>
      </View>

      <SettingsSection title="Getting started">
        <SettingsRow
          first
          icon="compass"
          title="App Introduction"
          subtitle="What GlamQuote does, in three screens"
          trailing={
            <ReplayButton
              label="App Introduction"
              onPress={() => {
                useAppStore.getState().replayOnboarding('/help');
                router.push('/discover');
              }}
            />
          }
        />
      </SettingsSection>

      {SECTIONS.map((section) => (
        <SettingsSection key={section.title} title={section.title}>
          {section.rows.map((row, index) => (
            <SettingsRow
              key={row.guide}
              first={index === 0}
              icon={row.icon}
              title={row.title}
              subtitle={row.subtitle}
              badge={seen[row.guide] === null ? undefined : seen[row.guide] ? 'Seen' : 'New'}
              trailing={<ReplayButton label={row.title} onPress={() => setOpen(row.guide)} />}
            />
          ))}
        </SettingsSection>
      ))}

      <InlineNote icon="info" centered size="sm">
        Replaying a guide never starts a try-on. Each feature remembers its own guide.
      </InlineNote>

      <NailTutorial visible={open === 'nail'} onClose={close} onStart={go('nail')} />
      <HairTutorial visible={open === 'hair'} onClose={close} onStart={go('hair')} />
      <HairColorTutorial visible={open === 'color'} onClose={close} onStart={go('color')} />
      <BattleTutorial visible={open === 'battle'} onClose={close} onStart={go('battle')} />
      <FinderTutorial visible={open === 'finder'} onClose={close} onStart={go('finder')} />
      <AssistTutorial visible={open === 'assist'} onClose={close} onStart={go('assist')} />
      <LookbookTutorial visible={open === 'lookbook'} onClose={close} />
    </SettingsScreen>
  );
}
