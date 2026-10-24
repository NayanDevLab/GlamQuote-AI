import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { FlowHeader, FooterBar } from '@/features/nail/components';
import { useNailSession } from '@/features/nail/nail-session';
import { chooseFromGallery, takePhoto, type PickOutcome } from '@/lib/photo';
import { colors } from '@/theme';

// From YouCam's documented input guidance plus the approved design's photo tips.
const TIPS: { good: boolean; label: string; detail: string }[] = [
  { good: true, label: 'Good', detail: 'bright, even daylight' },
  { good: true, label: 'Good', detail: 'all nails in view, hand filling the frame' },
  { good: false, label: 'Avoid', detail: 'dark or blurry photos' },
  { good: false, label: 'Avoid', detail: 'nails covered or cropped' },
];

type Notice = 'camera_denied' | 'failed' | null;

export default function NailPhoto() {
  const insets = useSafeAreaInsets();
  // `edit=1` means we were opened from a later step to swap the photo, so Continue goes back there.
  // `next=editor` continues into Customize My Nails instead of design selection.
  const { edit, next } = useLocalSearchParams<{ edit?: string; next?: string }>();
  const hand = useNailSession((state) => state.hand);
  const setHand = useNailSession((state) => state.setHand);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const run = async (pick: () => Promise<PickOutcome>) => {
    if (busy) return;
    setBusy(true);
    setNotice(null);
    const outcome = await pick();
    setBusy(false);
    if (outcome.kind === 'picked') setHand(outcome.image);
    else if (outcome.kind !== 'canceled') setNotice(outcome.kind);
  };

  const proceed = () => {
    if (edit) router.back();
    else router.push(next === 'editor' ? '/nail/editor' : '/nail/designs');
  };

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <FlowHeader step={1} />
      <ScrollView contentContainerClassName="gap-4 px-5 pb-6 pt-1" showsVerticalScrollIndicator={false}>
        <View className="gap-1.5">
          <Text accessibilityRole="header" className="font-serif text-hero text-ink">
            Let’s See Your <Text className="font-serif-italic text-plum">Nails.</Text>
          </Text>
          <Text className="font-sans text-body-l text-muted">
            One clear photo of your hand is all we need.
          </Text>
        </View>

        {hand ? (
          <View className="gap-2.5 rounded-lg border border-blush bg-card p-2">
            <Image
              source={{ uri: hand.uri }}
              contentFit="cover"
              accessibilityLabel="Your selected hand photo"
              style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: 18, backgroundColor: colors.blush }}
            />
            <View className="flex-row items-center justify-between px-2 pb-1.5">
              <Text className="font-sans-semibold text-label-s text-ink">Your hand</Text>
              <Text
                accessibilityRole="button"
                onPress={() => setHand(null)}
                className="py-1.5 pl-4 font-sans-semibold text-label-s text-plum">
                Remove
              </Text>
            </View>
          </View>
        ) : (
          <View className="items-center gap-2 rounded-lg border border-dashed border-champagne bg-card px-6 py-8">
            {busy ? (
              <ActivityIndicator color={colors.plum} />
            ) : (
              <Icon name="image" size={34} color={colors.plum} strokeWidth={1.4} />
            )}
            <Text className="pt-1 text-center font-sans-semibold text-label text-ink">
              Place your hand like this
            </Text>
            <Text className="text-center font-sans text-body-m text-muted">
              Flat on a plain surface, fingers slightly apart, all five nails facing the camera.
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
        {notice === 'failed' ? (
          <View accessibilityLiveRegion="polite" className="gap-1 rounded-lg bg-blush p-4">
            <Text className="font-sans-semibold text-label-s text-ink">That photo couldn’t be opened.</Text>
            <Text className="font-sans text-body-s text-muted">
              Try another photo — JPEG and PNG work best.
            </Text>
          </View>
        ) : null}

        <View className="gap-2.5">
          <Text className="font-sans-semibold text-overline uppercase text-muted">For the best preview</Text>
          {TIPS.map((tip) => (
            <View key={tip.detail} className="flex-row items-center gap-2.5">
              <View
                className={`h-6 w-6 items-center justify-center rounded-full ${
                  tip.good ? 'bg-plum' : 'bg-blush'
                }`}>
                <Icon
                  name={tip.good ? 'check' : 'close'}
                  size={13}
                  color={tip.good ? colors.white : colors.ink}
                  strokeWidth={2.4}
                />
              </View>
              <Text className="flex-1 font-sans text-body-m text-ink">
                <Text className="font-sans-semibold">{tip.label}:</Text> {tip.detail}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <FooterBar>
        {hand ? (
          <>
            <Button label="Continue" trailingIcon="arrowRight" onPress={proceed} />
            <View className="flex-row gap-2.5">
              <Button
                label="Retake"
                variant="secondary"
                icon="camera"
                disabled={busy}
                className="flex-1"
                onPress={() => run(takePhoto)}
              />
              <Button
                label="Choose Another"
                variant="secondary"
                icon="image"
                disabled={busy}
                className="flex-1"
                onPress={() => run(chooseFromGallery)}
              />
            </View>
            <Text className="text-center font-sans text-body-s text-muted">
              Nothing is generated or uploaded yet.
            </Text>
          </>
        ) : (
          <>
            <Button label="Take Photo" icon="camera" disabled={busy} onPress={() => run(takePhoto)} />
            <Button
              label="Choose from Gallery"
              variant="secondary"
              icon="image"
              disabled={busy}
              onPress={() => run(chooseFromGallery)}
            />
            <Text className="text-center font-sans text-body-s text-muted">
              Camera access is optional — a gallery photo works too.
            </Text>
          </>
        )}
      </FooterBar>
    </View>
  );
}
