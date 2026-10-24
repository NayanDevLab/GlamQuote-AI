import { Image } from 'expo-image';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Thumb } from '@/components/ui/thumb';
import type { PickedImage } from '@/lib/photo';
import { colors } from '@/theme';

import { HAIR_ACTION_LABELS, HAIR_ERRORS, SELFIE_ERRORS, type HairErrorAction, type HairErrorKind } from './errors';
import type { HairTemplate } from './hair-api';

export const HAIR_STEPS = ['Photo', 'Style', 'Review'] as const;

/** YouCam's sample image of a hairstyle. A style reference only — never the user's result. */
export function TemplateImage({ template, size }: { template: HairTemplate; size?: number }) {
  return (
    <Image
      source={{ uri: template.thumb }}
      contentFit="cover"
      cachePolicy="disk"
      accessibilityLabel={`${template.title} hairstyle sample`}
      style={
        size
          ? { width: size, height: size, borderRadius: 12, backgroundColor: colors.blush }
          : { width: '100%', aspectRatio: 1, borderRadius: 16, backgroundColor: colors.blush }
      }
    />
  );
}

type HairErrorStateProps = {
  kind: HairErrorKind;
  onAction: (action: HairErrorAction) => void;
  selfie?: PickedImage | null;
  template?: HairTemplate | null;
};

/**
 * One reusable recovery state (P4A-10): what happened, what was kept, and two next steps. It is
 * never shown in place of a result and never says a preview exists when the task failed.
 */
export function HairErrorState({ kind, onAction, selfie, template }: HairErrorStateProps) {
  const copy = HAIR_ERRORS[kind];
  // An input that caused the error is not offered back as "kept".
  const keptSelfie = SELFIE_ERRORS.includes(kind) ? null : selfie;
  const keptTemplate = kind === 'template' || kind === 'hair_too_short' ? null : template;
  const showStudioLink = copy.primary !== 'studio' && copy.secondary !== 'studio';

  return (
    <View className="flex-1 justify-center gap-5 px-5">
      <View className="gap-3">
        <Text className="font-sans-semibold text-overline uppercase text-plum">{copy.tag}</Text>
        <Text accessibilityRole="header" accessibilityLiveRegion="polite" className="font-serif text-title-lg text-ink">
          {copy.title}
        </Text>
        <Text className="font-sans text-body-l text-muted">{copy.body}</Text>
      </View>

      {keptSelfie || keptTemplate ? (
        <View className="gap-2.5 rounded-lg border border-blush bg-card p-3.5">
          <Text className="font-sans-semibold text-overline uppercase text-muted">Kept for you</Text>
          <View className="flex-row flex-wrap gap-4">
            {keptSelfie ? (
              <View className="flex-row items-center gap-2.5">
                <Thumb uri={keptSelfie.uri} size={48} />
                <Text className="font-sans-medium text-body-s text-ink">Your photo</Text>
              </View>
            ) : null}
            {keptTemplate ? (
              <View className="flex-row items-center gap-2.5">
                <TemplateImage template={keptTemplate} size={48} />
                <Text numberOfLines={1} className="max-w-[140px] font-sans-medium text-body-s text-ink">
                  {keptTemplate.title}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      <View className="gap-2.5">
        <Button label={HAIR_ACTION_LABELS[copy.primary]} onPress={() => onAction(copy.primary)} />
        <Button
          label={HAIR_ACTION_LABELS[copy.secondary]}
          variant="secondary"
          onPress={() => onAction(copy.secondary)}
        />
        {showStudioLink ? (
          <Text
            accessibilityRole="button"
            onPress={() => onAction('studio')}
            className="self-center px-4 py-3 font-sans-semibold text-label text-plum">
            Back to Hair Studio
          </Text>
        ) : null}
      </View>
    </View>
  );
}
