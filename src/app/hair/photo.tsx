import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HairFigure } from '@/components/illustrations';
import { Button } from '@/components/ui/button';
import { FlowHeader } from '@/components/ui/flow-header';
import { FooterBar } from '@/components/ui/footer-bar';
import { Icon } from '@/components/ui/icon';
import { HAIR_STEPS } from '@/features/hair/components';
import { HAIR_MAX_LONG_SIDE } from '@/features/hair/hair-api';
import { useHairSession } from '@/features/hair/hair-session';
import { chooseFromGallery, takePhoto, type PickOutcome } from '@/lib/photo';
import { colors } from '@/theme';

// YouCam's documented selfie requirements (one face, pose limits, shoulders visible) in plain words.
const TIPS: { good: boolean; detail: string }[] = [
  { good: true, detail: 'One person, whole face visible — no sunglasses or hands' },
  { good: true, detail: 'Head and shoulders in frame; hair not cropped' },
  { good: true, detail: 'Look straight ahead, head level' },
  { good: false, detail: 'Strong shadows, hats or hair covered' },
];

// YouCam needs a face at least 128 px wide; a photo smaller than this can't contain one.
const MIN_SHORT_SIDE = 256;

type Notice = 'camera_denied' | 'failed' | 'too_small' | null;

// P4A-3/4 — Selfie (empty and selected).
export default function HairPhoto() {
  const insets = useSafeAreaInsets();
  // `edit=1` means we were opened from a later step to swap the photo, so Continue goes back there.
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const selfie = useHairSession((state) => state.selfie);
  const template = useHairSession((state) => state.template);
  const setSelfie = useHairSession((state) => state.setSelfie);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const run = async (pick: () => Promise<PickOutcome>) => {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    const outcome = await pick();
    setBusy(false);
    if (outcome.kind === 'picked') {
      // Converted to a JPEG within YouCam's 1024 px limit on the device; nothing is uploaded yet.
      if (Math.min(outcome.image.width, outcome.image.height) < MIN_SHORT_SIDE) setNotice('too_small');
      else setSelfie(outcome.image);
    } else if (outcome.kind !== 'canceled') {
      setNotice(outcome.kind);
    }
  };
  const fromCamera = () => run(() => takePhoto({ maxLongSide: HAIR_MAX_LONG_SIDE, front: true }));
  const fromGallery = () => run(() => chooseFromGallery({ maxLongSide: HAIR_MAX_LONG_SIDE }));

  const proceed = () => {
    if (edit) router.back();
    else router.push('/hair/styles');
  };

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <FlowHeader step={1} steps={HAIR_STEPS} />
      <ScrollView contentContainerClassName="gap-4 px-5 pb-6 pt-1" showsVerticalScrollIndicator={false}>
        <View className="gap-1.5">
          <Text accessibilityRole="header" className="font-serif text-hero text-ink">
            Let’s See Your <Text className="font-serif-italic text-plum">Hair.</Text>
          </Text>
          <Text className="font-sans text-body-l text-muted">
            One clear photo of you, head and shoulders in frame.
          </Text>
        </View>

        {selfie ? (
          <View className="overflow-hidden rounded-lg bg-blush">
            <Image
              source={{ uri: selfie.uri }}
              contentFit="cover"
              accessibilityLabel="Your selected photo"
              style={{ width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.blush }}
            />
            <View className="absolute left-3 top-3 rounded-full bg-canvas/95 px-2.5 py-[5px]">
              <Text className="font-sans-semibold text-caption text-ink">Your photo</Text>
            </View>
          </View>
        ) : (
          <View className="items-center gap-2 rounded-lg border border-dashed border-champagne bg-card px-6 pb-6 pt-4">
            {busy ? (
              <View className="h-[150px] items-center justify-center">
                <ActivityIndicator color={colors.plum} />
              </View>
            ) : (
              <HairFigure variant="user" width={120} height={150} />
            )}
            <Text className="pt-1 text-center font-sans-semibold text-label text-ink">
              Line up your face and shoulders
            </Text>
            <Text className="text-center font-sans text-body-m text-muted">
              Face the camera, keep your whole hairstyle in frame.
            </Text>
          </View>
        )}

        {template ? (
          <View className="flex-row items-center gap-2.5 rounded-lg bg-blush px-4 py-3">
            <Icon name="check" size={16} color={colors.plum} strokeWidth={2.4} />
            <Text className="flex-1 font-sans text-body-m text-ink">
              Your chosen style is kept: <Text className="font-sans-semibold">{template.title}</Text>
            </Text>
          </View>
        ) : null}

        {notice === 'camera_denied' ? (
          <View accessibilityLiveRegion="polite" className="gap-2 rounded-lg bg-blush p-4">
            <Text className="font-sans-semibold text-label-s text-ink">Camera access is turned off.</Text>
            <Text className="font-sans text-body-s text-muted">
              You can still choose a photo from your gallery, or allow the camera in Android Settings.
            </Text>
            <Text
              accessibilityRole="button"
              onPress={() => Linking.openSettings()}
              className="self-start py-1.5 font-sans-semibold text-label-s text-plum">
              Open Settings
            </Text>
          </View>
        ) : null}
        {notice === 'failed' || notice === 'too_small' ? (
          <View accessibilityLiveRegion="polite" className="gap-1 rounded-lg bg-blush p-4">
            <Text className="font-sans-semibold text-label-s text-ink">
              {notice === 'failed' ? 'That photo couldn’t be opened.' : 'That photo is too small.'}
            </Text>
            <Text className="font-sans text-body-s text-muted">
              {notice === 'failed'
                ? 'Try another photo — any common format works.'
                : 'Choose a larger photo where your face is clearly visible.'}
            </Text>
          </View>
        ) : null}

        <View className="gap-2.5">
          <Text className="font-sans-semibold text-overline uppercase text-muted">For the best preview</Text>
          {TIPS.map((tip) => (
            <View key={tip.detail} className="flex-row items-center gap-2.5">
              <View
                className={`h-6 w-6 items-center justify-center rounded-full ${tip.good ? 'bg-plum' : 'bg-blush'}`}>
                <Icon
                  name={tip.good ? 'check' : 'close'}
                  size={13}
                  color={tip.good ? colors.white : colors.ink}
                  strokeWidth={2.4}
                />
              </View>
              <Text className="flex-1 font-sans text-body-m text-ink">
                <Text className="font-sans-semibold">{tip.good ? 'Good:' : 'Avoid:'}</Text> {tip.detail}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <FooterBar>
        {selfie ? (
          <>
            <Button label="Continue" trailingIcon="arrowRight" disabled={busy} onPress={proceed} />
            <View className="flex-row gap-2.5">
              <Button
                label="Change Photo"
                variant="secondary"
                disabled={busy}
                className="flex-1"
                onPress={fromGallery}
              />
              <Button label="Retake" variant="secondary" disabled={busy} className="flex-1" onPress={fromCamera} />
            </View>
            <Text className="text-center font-sans text-body-s text-muted">
              Nothing is uploaded until you agree on the Review screen.
            </Text>
          </>
        ) : (
          <>
            <Button label="Take Photo" icon="camera" disabled={busy} onPress={fromCamera} />
            <Button label="Choose from Gallery" variant="secondary" icon="image" disabled={busy} onPress={fromGallery} />
            <Text className="text-center font-sans text-body-s text-muted">
              Camera access is optional — a gallery photo works too.
            </Text>
          </>
        )}
      </FooterBar>
    </View>
  );
}
