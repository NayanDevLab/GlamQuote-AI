import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { FlowHeader } from '@/components/ui/flow-header';
import { FooterBar } from '@/components/ui/footer-bar';
import { Icon } from '@/components/ui/icon';
import { HAIR_STEPS } from '@/features/hair/components';
import { useHairSession } from '@/features/hair/hair-session';
import { isPhotoReadable } from '@/lib/photo';
import { colors } from '@/theme';

function Figure({
  label,
  uri,
  caption,
  action,
  onAction,
}: {
  label: string;
  uri: string;
  caption?: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <View className="flex-1 gap-2">
      <View className="overflow-hidden rounded-lg bg-blush">
        <Image
          source={{ uri }}
          contentFit="cover"
          accessibilityLabel={caption ? `${label}: ${caption}` : label}
          style={{ width: '100%', aspectRatio: 4 / 5 }}
        />
        <View className="absolute left-2.5 top-2.5 rounded-full bg-canvas/95 px-2.5 py-[5px]">
          <Text className="font-sans-semibold text-caption text-ink">{label}</Text>
        </View>
        {caption ? (
          <View className="absolute bottom-2.5 left-2.5 right-2.5 rounded-[12px] bg-canvas/95 px-2.5 py-1.5">
            <Text numberOfLines={2} className="font-sans-semibold text-caption text-ink">
              {caption}
            </Text>
          </View>
        ) : null}
      </View>
      <Text
        accessibilityRole="button"
        onPress={onAction}
        className="self-end py-1.5 font-sans-semibold text-label-s text-plum">
        {action}
      </Text>
    </View>
  );
}

// P4A-6 — Review & Consent. Nothing is uploaded before the box is ticked and Generate is tapped.
export default function HairReview() {
  const insets = useSafeAreaInsets();
  const selfie = useHairSession((state) => state.selfie);
  const template = useHairSession((state) => state.template);
  const consent = useHairSession((state) => state.consent);
  const setConsent = useHairSession((state) => state.setConsent);
  const attempt = useHairSession((state) => state.attempt);
  const startAttempt = useHairSession((state) => state.startAttempt);
  // The selfie lives in the app cache, which Android may clear. Check the file before Generate.
  const [missing, setMissing] = useState(false);
  const selfieUri = selfie?.uri;
  useEffect(() => {
    let active = true;
    (async () => {
      const ok = !selfieUri || (await isPhotoReadable(selfieUri));
      if (active) setMissing(!ok);
    })();
    return () => {
      active = false;
    };
  }, [selfieUri]);

  if (!selfie) return <Redirect href="/hair/photo" />;
  if (!template) return <Redirect href="/hair/styles" />;

  // startAttempt() hands back the attempt already in flight, so a double tap — or coming back
  // here and tapping again — can never create (and pay for) a second task.
  const generate = () => {
    if (startAttempt()) router.push('/hair/generating');
  };

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <FlowHeader step={3} steps={HAIR_STEPS} />
      <ScrollView contentContainerClassName="gap-4 px-5 pb-6 pt-1" showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" className="font-serif text-hero text-ink">
          Ready to Try Your <Text className="font-serif-italic text-plum">New Look?</Text>
        </Text>

        <View className="flex-row gap-3">
          <Figure
            label="Your Selfie"
            uri={selfie.uri}
            action="Edit Photo"
            onAction={() => router.push('/hair/photo?edit=1')}
          />
          <Figure
            label="Hairstyle"
            uri={template.thumb}
            caption={template.title}
            action="Change Hairstyle"
            onAction={() => router.back()}
          />
        </View>

        <View className="flex-row gap-3 rounded-lg border border-blush bg-card p-4">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-blush">
            <Icon name="info" size={18} color={colors.plum} />
          </View>
          <Text className="flex-1 font-sans text-body-m text-ink">
            Your selfie and the chosen style go to{' '}
            <Text className="font-sans-bold">YouCam AI Hairstyle Virtual Try-On</Text>, which processes the image
            on its servers to create a visual simulation. It’s a preview, not a promise of how a real cut will
            turn out.
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
              I agree to GlamQuote sending my photo to YouCam for processing to create this preview.{' '}
              <Text className="font-sans-semibold text-plum">Required</Text>
            </Text>
            <Text className="font-sans text-body-s text-muted">
              YouCam’s data terms apply to uploaded images, and YouCam may keep them for up to 30 days. Your
              photo is never shared with Gemini. Saving to your Lookbook is a separate, optional step.
            </Text>
          </View>
        </Pressable>

        <Text className="text-center font-sans text-body-s text-muted">AI preview only. Actual results may vary.</Text>
      </ScrollView>

      {missing ? (
        <View accessibilityLiveRegion="polite" className="mx-5 mb-2 gap-1 rounded-lg bg-blush p-4">
          <Text className="font-sans-semibold text-label-s text-ink">Please choose your photo again.</Text>
          <Text className="font-sans text-body-s text-muted">
            The copy saved on this phone was cleared. Nothing has been sent.
          </Text>
          <Text
            accessibilityRole="button"
            onPress={() => router.push('/hair/photo?edit=1')}
            className="self-start py-1.5 font-sans-semibold text-label-s text-plum">
            Choose Photo
          </Text>
        </View>
      ) : null}

      <FooterBar>
        {attempt?.taskId ? (
          <>
            <Button label="View Preview in Progress" onPress={() => router.push('/hair/generating')} />
            <Text className="text-center font-sans text-body-s text-muted">
              A preview is already being created — it won’t be requested twice.
            </Text>
          </>
        ) : attempt ? (
          // An earlier request never reached YouCam; it may hold a different photo or style.
          <>
            <Button
              label="Discard Earlier Request"
              variant="secondary"
              onPress={() => useHairSession.getState().endAttempt()}
            />
            <Text className="text-center font-sans text-body-s text-muted">
              An earlier request wasn’t sent. Discard it to generate with what you see here.
            </Text>
          </>
        ) : (
          <>
            <Button label="Generate Hairstyle Preview" disabled={!consent || missing} onPress={generate} />
            <Text className="text-center font-sans text-body-s text-muted">
              {consent
                ? 'One preview per tap — the button locks while it works.'
                : 'Tick the consent box to continue. Nothing is sent before you do.'}
            </Text>
          </>
        )}
      </FooterBar>
    </View>
  );
}
