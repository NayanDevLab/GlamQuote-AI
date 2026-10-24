import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { Icon } from '@/components/ui/icon';
import { Slider } from '@/components/ui/slider';
import { FlowHeader, FooterBar, NailSwatches, Thumb } from '@/features/nail/components';
import { customDesignFrom, useNailSession } from '@/features/nail/nail-session';
import {
  advancedControls,
  BASE_SHAPES,
  COLOR_PRESETS,
  colorName,
  FINGERS,
  isHexColor,
  LENGTH_PRESETS,
  POLISH_FINISHES,
  PRESS_FINISHES,
  TIP_SHAPES,
  type Advanced,
  type Finger,
  type VtoMode,
} from '@/features/nail/vto';
import { colors } from '@/theme';

function SectionLabel({ title, value }: { title: string; value?: string }) {
  return (
    <View className="flex-row items-baseline gap-1.5">
      <Text className="font-sans-semibold text-overline uppercase text-muted">{title}</Text>
      {value ? <Text className="font-sans-medium text-body-s text-ink">· {value}</Text> : null}
    </View>
  );
}

function ModeToggle({ mode, onChange }: { mode: VtoMode; onChange: (mode: VtoMode) => void }) {
  return (
    <View accessibilityRole="tablist" className="flex-row rounded-full bg-blush p-1">
      {(
        [
          ['polish', 'Nail Polish'],
          ['press', 'Press-On Nails'],
        ] as const
      ).map(([id, label]) => (
        <Pressable
          key={id}
          accessibilityRole="tab"
          accessibilityState={{ selected: mode === id }}
          onPress={() => onChange(id)}
          className={`h-10 flex-1 items-center justify-center rounded-full ${mode === id ? 'bg-plum' : ''}`}>
          <Text className={`text-label-s ${mode === id ? 'font-sans-semibold text-white' : 'font-sans-medium text-ink'}`}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Curated swatches plus a custom HEX field. Only a valid six-digit HEX is ever applied. */
function ColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const isPreset = COLOR_PRESETS.some((color) => color.hex.toLowerCase() === value.toLowerCase());
  const [draft, setDraft] = useState(isPreset ? '' : value);
  const draftInvalid = draft.length > 0 && !isHexColor(draft);

  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-3">
        {COLOR_PRESETS.map((color) => {
          const selected = color.hex.toLowerCase() === value.toLowerCase();
          return (
            <Pressable
              key={color.hex}
              accessibilityRole="radio"
              accessibilityLabel={color.name}
              accessibilityState={{ selected }}
              onPress={() => {
                setDraft('');
                onChange(color.hex);
              }}
              className={`h-12 w-12 items-center justify-center rounded-full ${
                selected ? 'border-2 border-plum' : 'border border-line'
              }`}>
              <View style={{ backgroundColor: color.hex }} className="h-9 w-9 rounded-full border border-canvas" />
            </Pressable>
          );
        })}
      </View>
      <View className={`h-12 flex-row items-center gap-2.5 rounded-full border bg-card px-4 ${draftInvalid ? 'border-ink' : 'border-line'}`}>
        <View
          style={{ backgroundColor: isHexColor(draft) ? draft : colors.blush }}
          className="h-6 w-6 rounded-full border border-line"
        />
        <TextInput
          value={draft}
          onChangeText={(text) => {
            const next = text.trim().startsWith('#') || text.trim() === '' ? text.trim() : `#${text.trim()}`;
            setDraft(next.slice(0, 7));
            if (isHexColor(next.slice(0, 7))) onChange(next.slice(0, 7).toUpperCase());
          }}
          placeholder="Custom HEX, e.g. #B05C7A"
          placeholderTextColor={colors.placeholder}
          accessibilityLabel="Custom HEX color"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={7}
          className="h-12 flex-1 p-0 font-sans text-[16px] text-ink"
        />
      </View>
      {draftInvalid ? (
        <Text accessibilityLiveRegion="polite" className="font-sans text-body-s text-ink">
          Enter six HEX digits, such as #B05C7A. The color changes once it is valid.
        </Text>
      ) : null}
    </View>
  );
}

function ChipRow<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => (
        <Chip key={option.id} label={option.label} selected={value === option.id} onPress={() => onChange(option.id)} />
      ))}
    </View>
  );
}

export default function NailEditor() {
  const insets = useSafeAreaInsets();
  const hand = useNailSession((state) => state.hand);
  const mode = useNailSession((state) => state.vtoMode);
  const setMode = useNailSession((state) => state.setVtoMode);
  const polish = useNailSession((state) => state.polish);
  const press = useNailSession((state) => state.press);
  const updatePolish = useNailSession((state) => state.updatePolish);
  const updatePress = useNailSession((state) => state.updatePress);
  const resetDraft = useNailSession((state) => state.resetDraft);
  const [fineTuneOpen, setFineTuneOpen] = useState(false);

  // Both modes start from the user's own hand photo.
  if (!hand) return <Redirect href="/nail/photo?next=editor" />;

  const design = customDesignFrom(mode, polish, press);
  const finish = mode === 'polish' ? polish.finish : press.finish;
  const advanced = mode === 'polish' ? polish.advanced : press.advanced;
  const setAdvanced = (patch: Partial<Advanced>) =>
    mode === 'polish'
      ? updatePolish({ advanced: { ...polish.advanced, ...patch } })
      : updatePress({ advanced: { ...press.advanced, ...patch } });

  // Polish colour applies to every nail, or to one finger when the user is customizing it.
  const activeColor = mode === 'polish' ? polish.colors[polish.applyToAll ? 'thumb' : polish.finger] : press.color;
  const setColor = (hex: string) => {
    if (mode === 'press') return updatePress({ color: hex });
    if (polish.applyToAll) {
      return updatePolish({ colors: { thumb: hex, index: hex, middle: hex, ring: hex, pinky: hex } });
    }
    return updatePolish({ colors: { ...polish.colors, [polish.finger]: hex } });
  };

  const fingerOptions: { id: Finger | 'all'; label: string }[] = [{ id: 'all', label: 'All fingers' }, ...FINGERS];

  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <FlowHeader step={2} />
      <ScrollView
        contentContainerClassName="gap-5 px-5 pb-6 pt-1"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="gap-2">
          <Text accessibilityRole="header" className="font-serif text-hero text-ink">
            Create Your Perfect <Text className="font-serif-italic text-plum">Nail Look</Text>
          </Text>
          <View className="self-start rounded-full bg-blush px-3 py-1.5">
            <Text className="font-sans-semibold text-caption text-plum">YouCam AI Nail Virtual Try-On</Text>
          </View>
        </View>

        <View className="flex-row items-center gap-3 rounded-lg border border-blush bg-card p-3">
          <Thumb image={hand} size={48} />
          <View className="flex-1">
            <Text className="font-sans-semibold text-label-s text-ink">Your photo</Text>
            <Text className="font-sans text-body-s text-muted">Kept while you customize</Text>
          </View>
          <Text
            accessibilityRole="button"
            onPress={() => router.push('/nail/photo?edit=1')}
            className="py-2 pl-3 font-sans-semibold text-label-s text-plum">
            Change
          </Text>
        </View>

        <ModeToggle mode={mode} onChange={setMode} />
        <NailSwatches colors={design.swatches} tip={mode === 'press' ? press.tip : 'oval'} />

        {mode === 'polish' ? (
          <View className="gap-2.5">
            <SectionLabel title="Apply color to" />
            <ChipRow
              options={fingerOptions}
              value={polish.applyToAll ? 'all' : polish.finger}
              onChange={(id) =>
                id === 'all'
                  ? // Back to one colour everywhere: the finger being edited sets it.
                    updatePolish({
                      applyToAll: true,
                      colors: {
                        thumb: activeColor,
                        index: activeColor,
                        middle: activeColor,
                        ring: activeColor,
                        pinky: activeColor,
                      },
                    })
                  : updatePolish({ applyToAll: false, finger: id })
              }
            />
          </View>
        ) : (
          <>
            <View className="gap-2.5">
              <SectionLabel title="Tip shape" />
              <ChipRow options={TIP_SHAPES} value={press.tip} onChange={(tip) => updatePress({ tip })} />
            </View>
            <View className="gap-2.5">
              <SectionLabel title="Base shape" value="near the cuticle" />
              <ChipRow options={BASE_SHAPES} value={press.base} onChange={(base) => updatePress({ base })} />
            </View>
            <View className="gap-2.5">
              <SectionLabel title="Length" />
              <ChipRow
                options={LENGTH_PRESETS.map((preset) => ({ id: preset.value, label: preset.label }))}
                value={press.length}
                onChange={(length) => updatePress({ length })}
              />
            </View>
          </>
        )}

        <View className="gap-2.5">
          <SectionLabel title="Color" value={colorName(activeColor)} />
          {/* Re-keyed so the custom HEX field follows the finger or mode being edited. */}
          <ColorPicker
            key={`${mode}-${mode === 'polish' && !polish.applyToAll ? polish.finger : 'all'}`}
            value={activeColor}
            onChange={setColor}
          />
        </View>

        <View className="gap-2.5">
          <SectionLabel title="Finish" />
          {mode === 'polish' ? (
            <ChipRow options={POLISH_FINISHES} value={polish.finish} onChange={(next) => updatePolish({ finish: next })} />
          ) : (
            <>
              <ChipRow options={PRESS_FINISHES} value={press.finish} onChange={(next) => updatePress({ finish: next })} />
              <Text className="font-sans text-body-s text-muted">
                Press-on nails support Matte, Cream and Metallic finishes.
              </Text>
            </>
          )}
        </View>

        <View className="rounded-lg border border-blush bg-card">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: fineTuneOpen }}
            onPress={() => setFineTuneOpen(!fineTuneOpen)}
            className="flex-row items-center justify-between p-4">
            <View className="flex-1">
              <Text className="font-sans-semibold text-label-s text-ink">Fine-tune</Text>
              <Text className="font-sans text-body-s text-muted">Optional · only controls this finish supports</Text>
            </View>
            <View style={{ transform: [{ rotate: fineTuneOpen ? '-90deg' : '90deg' }] }}>
              <Icon name="chevronRight" size={18} color={colors.plum} />
            </View>
          </Pressable>
          {fineTuneOpen ? (
            <View className="gap-3 px-4 pb-4">
              {advancedControls(mode, finish).map((control) => (
                <Slider
                  key={control.key}
                  label={control.label}
                  value={advanced[control.key]}
                  onChange={(next) => setAdvanced({ [control.key]: next })}
                />
              ))}
            </View>
          ) : null}
        </View>

        <Text className="font-sans text-body-s text-muted">
          Changing these settings never creates a preview. Your real preview is generated only after you
          review and tap Generate.
        </Text>
      </ScrollView>

      <FooterBar>
        <View className="flex-row items-center justify-between gap-3">
          <Text numberOfLines={1} className="flex-1 font-sans-semibold text-label-s text-ink">
            {design.name}
          </Text>
          <Text
            accessibilityRole="button"
            onPress={() => resetDraft(mode)}
            className="py-1.5 pl-3 font-sans-semibold text-label-s text-plum">
            Reset
          </Text>
        </View>
        <Button
          label="Review My Look"
          trailingIcon="arrowRight"
          onPress={() => router.push('/nail/review?flow=custom')}
        />
      </FooterBar>
    </KeyboardAvoidingView>
  );
}
