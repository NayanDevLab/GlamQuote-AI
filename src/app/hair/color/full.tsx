import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Segmented } from '@/components/ui/segmented';
import { Slider } from '@/components/ui/slider';
import { ColorModel, HairSwatch, SwatchTile } from '@/features/hair-color/components';
import { ChoiceFooter, EditorHeader, HexField, PhotoRow, SampleHero } from '@/features/hair-color/editor-parts';
import { useHairColorSession } from '@/features/hair-color/hair-color-session';
import {
  FULL_PRESETS,
  FULL_QUICK_PICKS,
  fullChoice,
  hexToHueDepth,
  hslToHex,
  type ColorSource,
} from '@/features/hair-color/presets';

const SOURCES = [
  { value: 'preset', label: 'Presets' },
  { value: 'custom', label: 'Custom Color' },
] as const;

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

// P4B-4 / P4B-4b — Full Hair Color editor: a YouCam preset, or a custom color.
export default function FullHairColor() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const photo = useHairColorSession((state) => state.photo);
  const draft = useHairColorSession((state) => state.full);
  const updateFull = useHairColorSession((state) => state.updateFull);
  const resetCustom = useHairColorSession((state) => state.resetCustom);
  // Hue and depth follow the HEX unless the user is dragging them (avoids rounding jitter).
  const [picker, setPicker] = useState<{
    hex: string;
    hue: number;
    depth: number;
  } | null>(null);

  if (!photo) return <Redirect href="/hair/color/photo" />;

  const custom = draft.source === 'custom';
  const choice = fullChoice(draft);
  const hueDepth = picker && picker.hex === draft.hex ? picker : { hex: draft.hex, ...hexToHueDepth(draft.hex) };
  const pickHueDepth = (hue: number, depth: number) => {
    const hex = hslToHex(hue, 48, depth);
    setPicker({ hex, hue, depth });
    updateFull({ hex });
  };
  // Five swatches per row inside the 20px page gutters.
  const tile = Math.floor((width - 40 - 4 * 8) / 5);

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <EditorHeader title="Full Hair Color" />
      <ScrollView
        contentContainerClassName="gap-4 px-5 pb-6 pt-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" className="font-serif text-hero text-ink">
          {custom ? 'Create Your Own ' : 'Find Your Perfect '}
          <Text className="font-serif-italic text-plum">Shade.</Text>
        </Text>

        <PhotoRow photo={photo} />

        <SampleHero
          figure={<ColorModel swatch={choice.swatch} width={176} height={220} />}
          note={custom ? 'Sample color — not applied to your photo' : undefined}>
          <Text className="font-sans-semibold text-overline uppercase text-muted">
            {custom ? 'Your custom shade' : 'Selected shade'}
          </Text>
          <Text numberOfLines={2} className="font-serif text-title-lg text-ink">
            {custom ? choice.name.replace(/^Custom #.*/, 'Custom shade') : choice.name}
          </Text>
          <Text className="font-sans-semibold text-body-s text-plum">{custom ? draft.hex : 'YouCam preset'}</Text>
          {custom ? (
            <View className="mt-1">
              <HairSwatch swatch={[draft.hex]} width={40} height={50} radius={12} />
            </View>
          ) : null}
        </SampleHero>

        <Segmented
          label="Color source"
          options={SOURCES}
          value={draft.source}
          onChange={(source: ColorSource) => updateFull({ source })}
        />

        {custom ? (
          <>
            <Text className="-mt-1 text-center font-sans text-body-s text-muted">
              Preset and custom choices are kept as separate drafts.
            </Text>

            <View className="gap-3">
              <SectionLabel>Curated quick picks</SectionLabel>
              <View className="flex-row flex-wrap gap-x-2 gap-y-3">
                {FULL_QUICK_PICKS.map((pick) => (
                  <SwatchTile
                    key={pick.hex}
                    swatch={[pick.hex]}
                    label={pick.name}
                    size={tile}
                    selected={pick.hex === draft.hex}
                    onPress={() => updateFull({ hex: pick.hex })}
                  />
                ))}
              </View>
            </View>

            <View className="gap-3 rounded-lg border border-blush bg-card p-4">
              <SectionLabel>Pick any color</SectionLabel>
              <Slider
                label="Hue"
                value={hueDepth.hue}
                min={0}
                max={359}
                onChange={(hue) => pickHueDepth(hue, hueDepth.depth)}
              />
              <Slider
                label="Depth · dark to light"
                value={hueDepth.depth}
                min={8}
                max={88}
                onChange={(depth) => pickHueDepth(hueDepth.hue, depth)}
              />
              <HexField label="Custom color HEX code" value={draft.hex} onChange={(hex) => updateFull({ hex })} />
              <Text className="font-sans text-body-s text-muted">
                Hue and Depth only help you choose a HEX value — they aren’t sent to YouCam.
              </Text>
            </View>

            <View className="gap-3 rounded-lg border border-blush bg-card p-4">
              <SectionLabel>Sent to YouCam after consent</SectionLabel>
              <Slider
                label="Color strength"
                value={draft.intensity}
                onChange={(intensity) => updateFull({ intensity })}
              />
              <RangeEnds left="Subtle" right="Vivid" />
              <Slider label="Shine" value={draft.shine} onChange={(shine) => updateFull({ shine })} />
              <RangeEnds left="Matte" right="Glossy" />
            </View>

            <Text className="text-center font-sans text-body-s text-muted">
              Nothing is generated here. Your preview is created only after Review & Consent.
            </Text>
          </>
        ) : (
          <>
            <View className="flex-row flex-wrap gap-x-2 gap-y-3">
              {FULL_PRESETS.map((preset, index) => (
                <SwatchTile
                  key={preset.name}
                  swatch={[preset.hex]}
                  label={preset.name}
                  size={tile}
                  selected={index === draft.presetIndex}
                  onPress={() => updateFull({ presetIndex: index })}
                />
              ))}
            </View>
            <Text
              accessibilityRole="button"
              onPress={() =>
                updateFull({
                  source: 'custom',
                  hex: FULL_PRESETS[draft.presetIndex].hex,
                })
              }
              className="self-center px-4 py-2 font-sans-semibold text-label-s text-plum">
              Fine-tune a similar custom shade
            </Text>
            <Text className="-mt-2 text-center font-sans text-body-s text-muted">
              Swatches are samples — YouCam renders the real {FULL_PRESETS[draft.presetIndex].name} preset.
            </Text>
          </>
        )}
      </ScrollView>

      <ChoiceFooter
        swatch={choice.swatch}
        title={choice.name}
        detail={
          custom ? `${draft.hex} · strength ${draft.intensity} · shine ${draft.shine}` : 'Preset · YouCam intensity'
        }
        badge={custom ? 'Full · Custom' : 'Full'}
        actionLabel="Review My Hair Color"
        onAction={() => router.push('/hair/color/review')}
        reset={
          custom
            ? {
                label: 'Reset Custom Color',
                onPress: () => resetCustom('full'),
              }
            : undefined
        }
      />
    </View>
  );
}
