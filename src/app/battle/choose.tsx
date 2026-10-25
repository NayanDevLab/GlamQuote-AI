import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { FooterBar } from '@/components/ui/footer-bar';
import { Segmented } from '@/components/ui/segmented';
import {
  BattleHeader,
  BattleTutorial,
  LookImage,
  OriginalRow,
  SavedStatus,
  TypeChip,
} from '@/features/battle/components';
import { useBattleSession } from '@/features/battle/battle-session';
import {
  canPair,
  groupByPhoto,
  typeLabel,
  type BattleCategory,
  type BattleLook,
  type PhotoGroup,
} from '@/features/battle/looks';
import { useBattleLooks } from '@/features/battle/use-battle-looks';
import { colors, shadows } from '@/theme';

const day = (time: number) => {
  const date = new Date(time);
  return date.toDateString() === new Date().toDateString()
    ? 'Today'
    : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

function PickTile({ look, letter, onPress }: { look: BattleLook; letter: 'A' | 'B' | null; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: letter !== null }}
      accessibilityLabel={`${look.title}, ${typeLabel(look)}, ${look.savedLookId ? 'saved' : 'not saved yet'}${letter ? `, Look ${letter}` : ''}`}
      onPress={onPress}
      style={letter ? shadows.card : undefined}
      className={`flex-1 gap-2 rounded-lg border-2 bg-card p-2 ${letter ? 'border-plum' : 'border-blush'}`}>
      <LookImage look={look}>
        <View
          className={`absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full ${
            letter ? 'bg-plum' : 'border-2 border-canvas bg-canvas/60'
          }`}>
          {letter ? <Text className="font-sans-bold text-label-s text-white">{letter}</Text> : null}
        </View>
      </LookImage>
      <View className="gap-1 px-1 pb-1">
        <Text numberOfLines={2} className="font-sans-semibold text-label-s text-ink">
          {look.title}
        </Text>
        <TypeChip look={look} />
        <SavedStatus look={look} />
      </View>
    </Pressable>
  );
}

function GroupSection({
  group,
  category,
  picks,
  onPick,
}: {
  group: PhotoGroup;
  category: BattleCategory;
  picks: string[];
  onPick: (key: string) => void;
}) {
  const types = [...new Set(group.looks.map((look) => typeLabel(look).split(' · ')[0]))].join(' and ');
  const rows: BattleLook[][] = [];
  for (let i = 0; i < group.looks.length; i += 2) rows.push(group.looks.slice(i, i + 2));
  return (
    <View className="gap-3">
      <OriginalRow
        uri={group.originalUri}
        subtitle={`${category === 'nails' ? 'Hand photo' : 'Your selfie'} · ${day(group.newest)} · ${group.looks.length} ${
          group.looks.length === 1 ? 'look' : 'looks'
        } · ${types}`}
      />
      {rows.map((row) => (
        <View key={row[0].key} className="flex-row gap-3">
          {row.map((look) => {
            const index = picks.indexOf(look.key);
            return (
              <PickTile
                key={look.key}
                look={look}
                letter={index === 0 ? 'A' : index === 1 ? 'B' : null}
                onPress={() => onPick(look.key)}
              />
            );
          })}
          {row.length === 1 ? <View className="flex-1" /> : null}
        </View>
      ))}
      {group.looks.length === 1 ? (
        <Text className="font-sans text-body-s text-muted">
          This photo has one preview so far — make another look from it to compare.
        </Text>
      ) : null}
    </View>
  );
}

// P5A-3 — Choose two looks from the same original photo.
export default function ChooseLooks() {
  const insets = useSafeAreaInsets();
  const category = useBattleSession((state) => state.category);
  const setCategory = useBattleSession((state) => state.setCategory);
  const allPicks = useBattleSession((state) => state.picks);
  const togglePick = useBattleSession((state) => state.togglePick);
  const setPicks = useBattleSession((state) => state.setPicks);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const { looks, isPending } = useBattleLooks();

  const byKey = new Map(looks.map((look) => [look.key, look]));
  // Picks that are no longer eligible (e.g. an unsaved preview expired) are dropped.
  const picks = allPicks[category].filter((key) => byKey.get(key)?.category === category);
  const groups = groupByPhoto(looks, category);
  const pickedGroup =
    picks.length > 0 ? groups.find((group) => group.photoHash === byKey.get(picks[0])?.photoHash) : undefined;
  const shownGroups = pickedGroup ? [pickedGroup] : groups;
  const hiddenCount = pickedGroup
    ? groups.filter((group) => group !== pickedGroup).reduce((sum, group) => sum + group.looks.length, 0)
    : 0;
  const counts = {
    nails: groupByPhoto(looks, 'nails').reduce((sum, group) => sum + group.looks.length, 0),
    hair: groupByPhoto(looks, 'hair').reduce((sum, group) => sum + group.looks.length, 0),
  };
  const ready = picks.length === 2 && canPair(byKey.get(picks[0]), byKey.get(picks[1]));

  const pick = (key: string) => {
    const look = byKey.get(key);
    const first = picks[0] ? byKey.get(picks[0]) : undefined;
    // A look from another photo starts a new pair instead of mixing photos.
    if (look && first && first.photoHash !== look.photoHash) setPicks(category, [key]);
    else togglePick(category, key);
  };

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <BattleHeader
        title="Look Battle"
        backLabel="Back to Look Battle"
        parent="/battle"
        onHelp={() => setTutorialOpen(true)}
      />
      <ScrollView contentContainerClassName="gap-4 px-5 pb-6 pt-1" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-end justify-between gap-3">
          <Text accessibilityRole="header" className="flex-1 font-serif text-hero text-ink">
            Pick Your Two <Text className="font-serif-italic text-plum">Favorites.</Text>
          </Text>
          <View className="mb-2 rounded-full bg-plum px-3 py-1">
            <Text className="font-sans-bold text-label-s text-white">{picks.length}/2</Text>
          </View>
        </View>

        <Segmented
          label="Category"
          options={[
            { value: 'nails', label: `Nails · ${counts.nails}` },
            { value: 'hair', label: `Hair · ${counts.hair}` },
          ]}
          value={category}
          onChange={(next: BattleCategory) => setCategory(next)}
        />
        <Text className="font-sans text-body-s text-muted">
          Tap a selected look to remove it. You can swap A and B on the next screen.
        </Text>

        {isPending ? (
          <View className="items-center gap-3 py-10">
            <ActivityIndicator color={colors.plum} />
            <Text className="font-sans text-body-m text-muted">Finding your previews…</Text>
          </View>
        ) : shownGroups.length === 0 ? (
          <View className="gap-2 rounded-lg bg-blush p-4">
            <Text className="font-sans-semibold text-label-s text-ink">
              No {category === 'nails' ? 'nail' : 'hair'} previews yet.
            </Text>
            <Text className="font-sans text-body-s text-muted">
              Create a look in {category === 'nails' ? 'Nail Studio' : 'Hair Studio'} — then make a second one from the
              same photo to compare them here.
            </Text>
            <Text
              accessibilityRole="button"
              onPress={() => router.push(category === 'nails' ? '/nail' : '/hair')}
              className="self-start py-1.5 font-sans-semibold text-label-s text-plum">
              Open {category === 'nails' ? 'Nail Studio' : 'Hair Studio'}
            </Text>
          </View>
        ) : (
          shownGroups.map((group) => (
            <GroupSection key={group.photoHash} group={group} category={category} picks={picks} onPick={pick} />
          ))
        )}
        {hiddenCount > 0 ? (
          <Text className="text-center font-sans text-body-s text-muted">
            {hiddenCount} {hiddenCount === 1 ? 'look' : 'looks'} from a different original photo{' '}
            {hiddenCount === 1 ? 'is' : 'are'} hidden while you pick this pair.
          </Text>
        ) : null}
      </ScrollView>

      <FooterBar>
        <Button
          label="Compare Selected Looks"
          trailingIcon="arrowRight"
          disabled={!ready}
          onPress={() => router.push('/battle/compare')}
        />
        <Text className="text-center font-sans text-body-s text-muted">
          {ready ? 'Both from the same photo · no new previews are created' : 'Choose two looks from the same photo.'}
        </Text>
      </FooterBar>

      <BattleTutorial visible={tutorialOpen} onClose={() => setTutorialOpen(false)} />
    </View>
  );
}
