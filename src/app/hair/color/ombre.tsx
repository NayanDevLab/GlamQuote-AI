import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { Segmented } from '@/components/ui/segmented';
import { Slider } from '@/components/ui/slider';
import { ColorModel, HairSwatch, SwatchTile } from '@/features/hair-color/components';
import { ChoiceFooter, EditorHeader, HexField, PhotoRow, SampleHero } from '@/features/hair-color/editor-parts';
import { useHairColorSession } from '@/features/hair-color/hair-color-session';
import {
  colorName,
  OMBRE_BOTTOM_PICKS,
  OMBRE_PRESETS,
  OMBRE_TOP_PICKS,
  ombreChoice,
  offsetLabel,
  type ColorSource,
  type OmbreDraft,
} from '@/features/hair-color/presets';
import { colors } from '@/theme';

const SOURCES = [
  { value: 'preset', label: 'Ombre Presets' },
  { value: 'custom', label: 'Custom Ombre' },
] as const;

const signed = (value: number) => `${value > 0 ? '+' : ''}${(value / 100).toFixed(2)}`;

// Where the sample's colors meet, from the design: the split follows line_offset, the soft band
// widens with blend strength. Only a rough illustration — YouCam renders the real blend.
const sampleSplit = (offset: number) => 0.22 + 0.68 * (0.5 + offset / 200);
const sampleSoftness = (blend: number) => (4 + blend * 0.26) / 100;

function SectionLabel({ children }: { children: string }) {
  return <Text className="font-sans-semibold text-overline uppercase text-muted">{children}</Text>;
}

function RangeEnds({ left, right }: { left: string; right: string }) {
  return (
    <View className="-mt-1 flex-row justify-between">
      <Text className="font-sans text-caption text-muted">{left}</Text>
      <Text className="font-sans text-caption text-muted">{right}</Text>
    </View>
  );
}

function ColorCard({
  title,
  hex,
  picks,
  tile,
  onChange,
  conflict,
}: {
  title: string;
  hex: string;
  picks: readonly { name: string; hex: string }[];
  tile: number;
  onChange: (hex: string) => void;
  conflict: string | null;
}) {
  return (
    <View className="gap-3 rounded-lg border border-blush bg-card p-4">
      <View className="flex-row items-center gap-3">
        <HairSwatch swatch={[hex]} width={34} height={42} radius={10} />
        <View>
          <SectionLabel>{title}</SectionLabel>
          <Text className="font-sans-semibold text-label text-ink">
            {colorName(hex)} <Text className="text-plum">{hex}</Text>
          </Text>
        </View>
      </View>
      <View accessibilityLabel={`${title} swatches`} className="flex-row flex-wrap gap-2">
        {picks.map((pick) => (
          <SwatchTile
            key={pick.hex}
            swatch={[pick.hex]}
            label={pick.name}
            size={tile}
            hideLabel
            selected={pick.hex === hex}
            onPress={() => onChange(pick.hex)}
          />
        ))}
      </View>
      <HexField label={`${title} HEX code`} value={hex} onChange={onChange} conflict={conflict} />
    </View>
  );
}

// P4B-5 / P4B-5b — Ombre Hair Color editor: a YouCam ombre preset, or a custom two-color blend.
export default function OmbreHairColor() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const photo = useHairColorSession((state) => state.photo);
  const draft = useHairColorSession((state) => state.ombre);
  const updateOmbre = useHairColorSession((state) => state.updateOmbre);
  const resetCustom = useHairColorSession((state) => state.resetCustom);
  const [fineTune, setFineTune] = useState(false);

  if (!photo) return <Redirect href="/hair/color/photo" />;

  const custom = draft.source === 'custom';
  const choice = ombreChoice(draft);
  const preset = OMBRE_PRESETS[draft.presetIndex];
  const top = custom ? draft.top : preset.top.hex;
  const bottom = custom ? draft.bottom : preset.bottom.hex;
  const same = custom && choice === null;
  const conflict = same ? 'Top and bottom are the same — pick two different colors.' : null;
  const set = (patch: Partial<OmbreDraft>) => updateOmbre(patch);
  const presetTile = Math.floor((width - 40 - 3 * 8) / 4);
  const pickTile = Math.floor((width - 40 - 32 - 5 * 8) / 6);

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <EditorHeader title="Ombre Hair Color" />
      <ScrollView
        contentContainerClassName="gap-4 px-5 pb-6 pt-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" className="font-serif text-hero text-ink">
          {custom ? 'Blend Your Own ' : 'Create Your Ombre '}
          <Text className="font-serif-italic text-plum">{custom ? 'Colors.' : 'Look.'}</Text>
        </Text>

        <PhotoRow photo={photo} />

        <SampleHero
          figure={
            <ColorModel
              swatch={[top, bottom]}
              width={176}
              height={220}
              split={sampleSplit(custom ? draft.offset : 0)}
              softness={sampleSoftness(custom ? draft.blend : 50)}
            />
          }
          note={custom ? 'Sample color — not applied to your photo' : undefined}>
          {custom ? (
            <>
              <Text className="font-sans-semibold text-overline uppercase text-muted">Top</Text>
              <Text className="-mt-1.5 font-sans-semibold text-label text-ink">{colorName(draft.top)}</Text>
              <Text className="-mt-1.5 font-sans text-caption text-plum">{draft.top}</Text>
              <Text className="font-sans text-caption text-muted">
                Position {signed(draft.offset)} · softness {draft.blend}
              </Text>
              <Text className="font-sans-semibold text-overline uppercase text-muted">Bottom</Text>
              <Text className="-mt-1.5 font-sans-semibold text-label text-ink">{colorName(draft.bottom)}</Text>
              <Text className="-mt-1.5 font-sans text-caption text-plum">{draft.bottom}</Text>
            </>
          ) : (
            <>
              <Text className="font-sans-semibold text-overline uppercase text-muted">Selected ombre</Text>
              <View className="flex-row items-center gap-2">
                <View style={{ backgroundColor: preset.top.hex }} className="h-4 w-4 rounded-full" />
                <Text className="flex-1 font-sans-semibold text-label text-ink">{preset.top.name}</Text>
              </View>
              <View className="ml-[7px] h-3 w-0.5 bg-line" />
              <View className="flex-row items-center gap-2">
                <View style={{ backgroundColor: preset.bottom.hex }} className="h-4 w-4 rounded-full" />
                <Text className="flex-1 font-sans-semibold text-label text-ink">{preset.bottom.name}</Text>
              </View>
              <Text className="font-sans-semibold text-body-s text-plum">YouCam preset</Text>
            </>
          )}
        </SampleHero>

        <Segmented
          label="Color source"
          options={SOURCES}
          value={draft.source}
          onChange={(source: ColorSource) => set({ source })}
        />

        {custom ? (
          <>
            <Text className="-mt-1 text-center font-sans text-body-s text-muted">
              Preset and custom choices are kept as separate drafts.
            </Text>

            <ColorCard
              title="Top color"
              hex={draft.top}
              picks={OMBRE_TOP_PICKS}
              tile={pickTile}
              onChange={(hex) => set({ top: hex })}
              conflict={conflict}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Swap top and bottom colors"
              onPress={() =>
                set({
                  top: draft.bottom,
                  bottom: draft.top,
                  topIntensity: draft.bottomIntensity,
                  topShine: draft.bottomShine,
                  bottomIntensity: draft.topIntensity,
                  bottomShine: draft.topShine,
                })
              }
              className="-my-1 flex-row items-center gap-1.5 self-center rounded-full border border-line-strong px-4 py-2 active:bg-blush">
              <Icon name="compare" size={14} color={colors.plum} strokeWidth={2} />
              <Text className="font-sans-semibold text-label-s text-plum">Swap colors</Text>
            </Pressable>
            <ColorCard
              title="Bottom color"
              hex={draft.bottom}
              picks={OMBRE_BOTTOM_PICKS}
              tile={pickTile}
              onChange={(hex) => set({ bottom: hex })}
              conflict={conflict}
            />

            <View className="gap-3 rounded-lg border border-blush bg-card p-4">
              <SectionLabel>Blend</SectionLabel>
              <Slider
                label={`Blend position · ${offsetLabel(draft.offset).split(' · ')[0]}`}
                value={draft.offset}
                min={-99}
                max={99}
                format={signed}
                onChange={(offset) => set({ offset })}
              />
              <RangeEnds left="↓ More bottom color" right="More top color ↓" />
              <Slider label="Blend strength" value={draft.blend} onChange={(blend) => set({ blend })} />
              <RangeEnds left="Lower" right="Higher" />
            </View>

            <View className="rounded-lg border border-blush bg-card">
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: fineTune }}
                onPress={() => setFineTune(!fineTune)}
                className="flex-row items-center gap-3 p-4">
                <View className="flex-1">
                  <Text className="font-sans-semibold text-label text-ink">Fine-Tune</Text>
                  <Text className="font-sans text-body-s text-muted">Optional · strength and shine for each color</Text>
                </View>
                <View
                  style={{
                    transform: [{ rotate: fineTune ? '-90deg' : '90deg' }],
                  }}>
                  <Icon name="chevronRight" size={18} color={colors.ink} />
                </View>
              </Pressable>
              {fineTune ? (
                <View className="gap-3 px-4 pb-4">
                  <SectionLabel>{`Top · ${colorName(draft.top)}`}</SectionLabel>
                  <Slider
                    label="Color strength"
                    value={draft.topIntensity}
                    onChange={(topIntensity) => set({ topIntensity })}
                  />
                  <RangeEnds left="Subtle" right="Vivid" />
                  <Slider label="Shine" value={draft.topShine} onChange={(topShine) => set({ topShine })} />
                  <RangeEnds left="Matte" right="Glossy" />
                  <SectionLabel>{`Bottom · ${colorName(draft.bottom)}`}</SectionLabel>
                  <Slider
                    label="Color strength"
                    value={draft.bottomIntensity}
                    onChange={(bottomIntensity) => set({ bottomIntensity })}
                  />
                  <RangeEnds left="Subtle" right="Vivid" />
                  <Slider label="Shine" value={draft.bottomShine} onChange={(bottomShine) => set({ bottomShine })} />
                  <RangeEnds left="Matte" right="Glossy" />
                </View>
              ) : null}
            </View>

            <Text className="text-center font-sans text-body-s text-muted">
              The sample shows roughly where colors meet. Nothing is generated until you review and agree.
            </Text>
          </>
        ) : (
          <>
            <View className="flex-row flex-wrap gap-x-2 gap-y-3">
              {OMBRE_PRESETS.map((item, index) => (
                <SwatchTile
                  key={item.top.name + item.bottom.name}
                  swatch={[item.top.hex, item.bottom.hex]}
                  label={item.top.name}
                  sublabel={item.bottom.name}
                  size={presetTile}
                  selected={index === draft.presetIndex}
                  onPress={() => set({ presetIndex: index })}
                />
              ))}
            </View>
            <Text
              accessibilityRole="button"
              onPress={() =>
                set({
                  source: 'custom',
                  top: preset.top.hex,
                  bottom: preset.bottom.hex,
                  offset: 0,
                  blend: 50,
                })
              }
              className="self-center px-4 py-2 font-sans-semibold text-label-s text-plum">
              Customize from this preset
            </Text>
            <Text className="-mt-2 text-center font-sans text-body-s text-muted">
              Swatches are samples — YouCam renders the real preset blend.
            </Text>
          </>
        )}
      </ScrollView>

      <ChoiceFooter
        swatch={[top, bottom]}
        title={choice ? choice.name : 'Pick two different colors'}
        detail={
          custom
            ? same
              ? 'Fix the colors to continue'
              : `Position ${signed(draft.offset)} · softness ${draft.blend}`
            : 'Preset · YouCam blend and split'
        }
        badge={custom ? 'Ombre · Custom' : 'Ombre'}
        actionLabel="Review My Ombre Look"
        disabled={!choice}
        onAction={() => router.push('/hair/color/review')}
        reset={custom ? { label: 'Reset Ombre', onPress: () => resetCustom('ombre') } : undefined}
      />
    </View>
  );
}
