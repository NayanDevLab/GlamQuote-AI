import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { FlowHeader } from '@/components/ui/flow-header';
import { FooterBar } from '@/components/ui/footer-bar';
import { Icon } from '@/components/ui/icon';
import { COLOR_STEPS, HairSwatch } from '@/features/hair-color/components';
import { useHairColorSession } from '@/features/hair-color/hair-color-session';
import { fullChoice, ombreChoice } from '@/features/hair-color/presets';
import { isPhotoReadable } from '@/lib/photo';
import { colors } from '@/theme';

// P4B-6 — Review & Consent. Nothing is uploaded before the box is ticked and Generate is tapped.
export default function HairColorReview() {
  const insets = useSafeAreaInsets();
  const photo = useHairColorSession((state) => state.photo);
  const mode = useHairColorSession((state) => state.mode);
  const full = useHairColorSession((state) => state.full);
  const ombre = useHairColorSession((state) => state.ombre);
  const consent = useHairColorSession((state) => state.consent);
  const setConsent = useHairColorSession((state) => state.setConsent);
  const attempt = useHairColorSession((state) => state.attempt);
  const startAttempt = useHairColorSession((state) => state.startAttempt);
  // The photo lives in the app cache, which Android may clear. Check the file before Generate.
  const [missing, setMissing] = useState(false);
  const photoUri = photo?.uri;
  useEffect(() => {
    let active = true;
    (async () => {
      const ok = !photoUri || (await isPhotoReadable(photoUri));
      if (active) setMissing(!ok);
    })();
    return () => {
      active = false;
    };
  }, [photoUri]);

  if (!photo) return <Redirect href="/hair/color/photo" />;
  const choice = mode === 'full' ? fullChoice(full) : ombreChoice(ombre);
  if (!choice) return <Redirect href="/hair/color/ombre" />;
  const editor = mode === 'full' ? '/hair/color/full' : '/hair/color/ombre';

  // startAttempt() hands back the attempt already in flight, so a double tap — or coming back
  // here and tapping again — can never create (and pay for) a second task.
  const generate = () => {
    if (startAttempt(choice)) router.push('/hair/color/generating');
  };

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <FlowHeader step={3} steps={COLOR_STEPS} />
      <ScrollView contentContainerClassName="gap-4 px-5 pb-6 pt-1" showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" className="font-serif text-hero text-ink">
          Ready to See Your <Text className="font-serif-italic text-plum">New Color?</Text>
        </Text>

        <View className="flex-row gap-3">
          <View className="flex-1 gap-2">
            <View className="overflow-hidden rounded-lg bg-blush">
              <Image
                source={{ uri: photo.uri }}
                contentFit="cover"
                accessibilityLabel="Your original photo"
                style={{ width: '100%', aspectRatio: 1 }}
              />
              <View className="absolute left-2.5 top-2.5 rounded-full bg-canvas/95 px-2.5 py-[5px]">
                <Text className="font-sans-semibold text-caption text-ink">Original photo</Text>
              </View>
            </View>
            <Text
              accessibilityRole="button"
              onPress={() => router.push('/hair/color/photo?edit=1')}
              className="self-end py-1.5 font-sans-semibold text-label-s text-plum">
              Change Photo
            </Text>
          </View>
          <View className="flex-1 gap-2">
            <View
              accessible
              accessibilityLabel={`Sample swatch of ${choice.name}. Not your AI preview.`}
              style={{ aspectRatio: 1 }}
              className="items-center justify-center gap-2 rounded-lg border border-blush bg-card">
              <View className="absolute left-2.5 top-2.5 rounded-full bg-blush px-2.5 py-[5px]">
                <Text className="font-sans-semibold text-caption text-ink">Sample swatch</Text>
              </View>
              <View className="mt-6">
                <HairSwatch swatch={choice.swatch} width={72} height={88} radius={22} />
              </View>
              <Text className="font-sans-semibold text-caption text-muted">Not your AI preview</Text>
            </View>
            <Text
              accessibilityRole="button"
              onPress={() => router.dismissTo(editor)}
              className="self-end py-1.5 font-sans-semibold text-label-s text-plum">
              Edit Colors
            </Text>
          </View>
        </View>

        <View className="gap-2.5 rounded-lg border border-blush bg-card p-4">
          {choice.summary.map((row, index) => (
            <View
              key={row.label}
              className={`flex-row justify-between gap-4 ${index > 0 ? 'border-t border-line pt-2.5' : ''}`}>
              <Text className="font-sans text-body-m text-muted">{row.label}</Text>
              <Text className="flex-1 text-right font-sans-semibold text-body-m text-ink">{row.value}</Text>
            </View>
          ))}
          {choice.source === 'preset' ? (
            <Text className="font-sans text-body-s text-muted">
              Want to adjust intensity? Use {mode === 'full' ? 'Custom Color' : 'Custom Ombre'} in the editor.
            </Text>
          ) : null}
        </View>

        <View className="flex-row gap-3 rounded-lg border border-blush bg-card p-4">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-blush">
            <Icon name="info" size={18} color={colors.plum} />
          </View>
          <Text className="flex-1 font-sans text-body-m text-ink">
            Your original photo and these color settings go to{' '}
            <Text className="font-sans-bold">YouCam AI Hair Color Virtual Try-On</Text>, which recolors the hair in your
            photo on its servers. One tap creates one preview.
          </Text>
        </View>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: consent }}
          onPress={() => setConsent(!consent)}
          className={`flex-row gap-3 rounded-lg p-4 ${consent ? 'bg-blush' : 'border border-line bg-card'}`}>
          <View
            className={`mt-0.5 h-6 w-6 items-center justify-center rounded-[6px] ${
              consent ? 'bg-plum' : 'border-[1.5px] border-ink bg-card'
            }`}>
            {consent ? <Icon name="check" size={15} color={colors.white} strokeWidth={2.6} /> : null}
          </View>
          <View className="flex-1 gap-1.5">
            <Text className="font-sans text-body-l text-ink">
              I agree to GlamQuote sending my photo to YouCam to create this hair color preview.{' '}
              <Text className="font-sans-semibold text-plum">Required</Text>
            </Text>
            <Text className="font-sans text-body-s text-muted">
              YouCam’s data terms apply, and it may keep uploaded images for up to 30 days. Your photo is never shared
              with Gemini. Saving to your Lookbook is a separate, optional step.
            </Text>
          </View>
        </Pressable>

        <Text className="text-center font-sans text-body-s text-muted">
          AI preview only. Actual results may vary with your hair, lighting and real-world coloring.
        </Text>
      </ScrollView>

      {missing ? (
        <View accessibilityLiveRegion="polite" className="mx-5 mb-2 gap-1 rounded-lg bg-blush p-4">
          <Text className="font-sans-semibold text-label-s text-ink">Please choose your photo again.</Text>
          <Text className="font-sans text-body-s text-muted">
            The copy saved on this phone was cleared. Nothing has been sent.
          </Text>
          <Text
            accessibilityRole="button"
            onPress={() => router.push('/hair/color/photo?edit=1')}
            className="self-start py-1.5 font-sans-semibold text-label-s text-plum">
            Choose Photo
          </Text>
        </View>
      ) : null}

      <FooterBar>
        {attempt?.taskId ? (
          <>
            <Button label="View Preview in Progress" onPress={() => router.push('/hair/color/generating')} />
            <Text className="text-center font-sans text-body-s text-muted">
              A preview is already being created — it won’t be requested twice.
            </Text>
          </>
        ) : attempt ? (
          // An earlier request never reached YouCam; it may hold a different photo or colors.
          <>
            <Button
              label="Discard Earlier Request"
              variant="secondary"
              onPress={() => useHairColorSession.getState().endAttempt()}
            />
            <Text className="text-center font-sans text-body-s text-muted">
              An earlier request wasn’t sent. Discard it to generate with what you see here.
            </Text>
          </>
        ) : (
          <>
            <Button label="Generate Hair Color Preview" disabled={!consent || missing} onPress={generate} />
            <Text className="text-center font-sans text-body-s text-muted">
              {consent
                ? 'The button locks while your preview is being created.'
                : 'Tick the consent box to continue. Nothing is sent before you do.'}
            </Text>
          </>
        )}
      </FooterBar>
    </View>
  );
}
