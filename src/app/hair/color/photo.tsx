import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HairFigure } from '@/components/illustrations';
import { Button } from '@/components/ui/button';
import { FooterBar } from '@/components/ui/footer-bar';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { Segmented } from '@/components/ui/segmented';
import { HAIR_COLOR_MAX_HEIGHT, HAIR_COLOR_MAX_WIDTH, HAIR_COLOR_MIN_SIDE } from '@/features/hair-color/hair-color-api';
import { useHairColorSession } from '@/features/hair-color/hair-color-session';
import type { HairColorMode } from '@/features/hair-color/presets';
import { useHairSession } from '@/features/hair/hair-session';
import { chooseFromGallery, isPhotoReadable, takePhoto, type PickedImage, type PickOutcome } from '@/lib/photo';
import { colors } from '@/theme';

const FIT = {
  maxWidth: HAIR_COLOR_MAX_WIDTH,
  maxHeight: HAIR_COLOR_MAX_HEIGHT,
};

// YouCam's documented Hair Color input requirements, in plain words.
const TIPS: { good: boolean; detail: string }[] = [
  { good: true, detail: 'One person, face visible, hair not covered' },
  {
    good: false,
    detail: 'Colored lights or heavy filters — soft daylight is best',
  },
  { good: true, detail: 'At least 320 × 320 px; JPG or PNG under 10 MB' },
  {
    good: true,
    detail: 'Large photos are resized on your phone before upload',
  },
];

const MODES = [
  { value: 'full', label: 'Full Hair Color' },
  { value: 'ombre', label: 'Ombre Hair Color' },
] as const;

const bigEnough = (image: PickedImage) => Math.min(image.width, image.height) >= HAIR_COLOR_MIN_SIDE;

type Notice = 'camera_denied' | 'failed' | 'too_small' | null;

// P4B-3 — Photo. Reuses the original Hair Studio photo when it qualifies; never an AI preview.
export default function HairColorPhoto() {
  const insets = useSafeAreaInsets();
  // `edit=1` means we were opened from a later step to swap the photo, so Continue goes back there.
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const photo = useHairColorSession((state) => state.photo);
  const setPhoto = useHairColorSession((state) => state.setPhoto);
  const mode = useHairColorSession((state) => state.mode);
  const setMode = useHairColorSession((state) => state.setMode);
  const hairSelfie = useHairSession((state) => state.selfie);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  // Offer the Hair Studio original only if its file is still here and it meets the size rules.
  const [reusable, setReusable] = useState<PickedImage | null>(null);
  const candidateUri = !photo && hairSelfie && bigEnough(hairSelfie) ? hairSelfie.uri : undefined;
  useEffect(() => {
    let active = true;
    (async () => {
      const ok = candidateUri ? await isPhotoReadable(candidateUri) : false;
      if (active) setReusable(ok ? useHairSession.getState().selfie : null);
    })();
    return () => {
      active = false;
    };
  }, [candidateUri]);

  const run = async (pick: () => Promise<PickOutcome>) => {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    const outcome = await pick();
    setBusy(false);
    if (outcome.kind === 'picked') {
      // Re-encoded as a JPEG on the device, so width < 1920 and height < 1080; nothing is uploaded.
      if (!bigEnough(outcome.image)) setNotice('too_small');
      else setPhoto(outcome.image);
    } else if (outcome.kind !== 'canceled') {
      setNotice(outcome.kind);
    }
  };
  const fromCamera = () => run(() => takePhoto({ ...FIT, front: true }));
  const fromGallery = () => run(() => chooseFromGallery(FIT));

  const proceed = () => {
    if (edit) router.back();
    else router.push(mode === 'full' ? '/hair/color/full' : '/hair/color/ombre');
  };

  const shown = photo ?? reusable;

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <View className="h-12 flex-row items-center justify-between px-2">
        <IconButton
          icon="arrowLeft"
          label="Back to Hair Color Studio"
          strokeWidth={1.8}
          onPress={() => router.back()}
        />
        <Text className="font-sans-semibold text-overline uppercase text-muted">Hair Color · Photo</Text>
        <View className="w-12" />
      </View>

      <ScrollView contentContainerClassName="gap-4 px-5 pb-6 pt-1" showsVerticalScrollIndicator={false}>
        <View className="gap-1.5">
          <Text accessibilityRole="header" className="font-serif text-hero text-ink">
            Show Us Your <Text className="font-serif-italic text-plum">Hair.</Text>
          </Text>
          <Text className="font-sans text-body-l text-muted">
            One clear photo with your hair fully in frame and good light.
          </Text>
        </View>

        {edit ? null : (
          <Segmented
            label="Color style"
            options={MODES}
            value={mode}
            onChange={(next: HairColorMode) => setMode(next)}
          />
        )}

        {shown ? (
          <View className={`gap-2.5 rounded-lg bg-card p-2 ${photo ? 'border border-solid border-blush' : 'border-2 border-solid border-plum'}`}>
            <View className="overflow-hidden rounded-[18px] bg-blush">
              <Image
                source={{ uri: shown.uri }}
                contentFit="cover"
                accessibilityLabel={photo ? 'Your selected photo' : 'Your original photo from Hair Studio'}
                style={{
                  width: '100%',
                  aspectRatio: 4 / 3,
                  backgroundColor: colors.blush,
                }}
              />
              <View className="absolute left-2.5 top-2.5 rounded-full bg-canvas/95 px-2.5 py-[5px]">
                <Text className="font-sans-semibold text-caption text-ink">
                  {photo ? 'Your photo' : 'Original photo · Hair Studio'}
                </Text>
              </View>
              <View className="absolute bottom-2.5 left-2.5 flex-row items-center gap-1.5 rounded-full bg-canvas/95 px-2.5 py-[5px]">
                <Icon name="check" size={13} color={colors.plum} strokeWidth={2.6} />
                <Text className="font-sans-semibold text-caption text-ink">
                  Size OK · {shown.width} × {shown.height}
                </Text>
              </View>
            </View>
            {photo ? null : (
              <View className="gap-1 px-2 pb-1.5">
                <Text className="font-sans-semibold text-label text-ink">Reuse your Hair Studio photo?</Text>
                <Text className="font-sans text-body-s text-muted">
                  We’ll use your original photo — not an AI hairstyle preview — so the color is applied to your real
                  hair.
                </Text>
              </View>
            )}
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
              Fit all of your hair in the frame
            </Text>
            <Text className="text-center font-sans text-body-m text-muted">
              Include the lengths and ends — that’s where color shows most.
            </Text>
          </View>
        )}

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
                ? 'Try another photo — JPG and PNG work best.'
                : 'Hair color needs at least 320 × 320 pixels. A recent phone photo is best.'}
            </Text>
          </View>
        ) : null}

        <View className="gap-2.5">
          <Text className="font-sans-semibold text-overline uppercase text-muted">For an accurate color preview</Text>
          {TIPS.map((tip) => (
            <View key={tip.detail} className="flex-row items-center gap-2.5">
              <View className={`h-6 w-6 items-center justify-center rounded-full ${tip.good ? 'bg-plum' : 'bg-blush'}`}>
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
        {photo ? (
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
          </>
        ) : (
          <>
            {reusable ? (
              <Button
                label="Use This Photo"
                trailingIcon="arrowRight"
                onPress={() => {
                  setPhoto(reusable);
                  proceed();
                }}
              />
            ) : null}
            <View className="flex-row gap-2.5">
              <Button label="Take Photo" variant="secondary" disabled={busy} className="flex-1" onPress={fromCamera} />
              <Button
                label="Choose from Gallery"
                variant="secondary"
                disabled={busy}
                className="flex-1"
                onPress={fromGallery}
              />
            </View>
          </>
        )}
        <Text className="text-center font-sans text-body-s text-muted">
          Nothing is uploaded until you agree on the Review screen.
        </Text>
      </FooterBar>
    </View>
  );
}
