import { Image } from 'expo-image';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { FlowHeader, FooterBar, NailSwatches } from '@/features/nail/components';
import { customDesignFrom, useNailSession, type NailDesign, type PickedImage } from '@/features/nail/nail-session';
import { isPhotoReadable } from '@/lib/photo';
import { colors } from '@/theme';

function InputTile({
  label,
  image,
  action,
  onAction,
}: {
  label: string;
  image: PickedImage;
  action: string;
  onAction: () => void;
}) {
  return (
    <View className="flex-1 gap-2">
      <View className="overflow-hidden rounded-lg bg-blush">
        <Image
          source={{ uri: image.uri }}
          contentFit="cover"
          accessibilityLabel={label}
          style={{ width: '100%', aspectRatio: 1 }}
        />
        <View className="absolute left-2.5 top-2.5 rounded-full bg-canvas/95 px-2.5 py-[5px]">
          <Text className="font-sans-semibold text-caption text-ink">{label}</Text>
        </View>
      </View>
      <Text
        accessibilityRole="button"
        onPress={onAction}
        className="self-start py-1.5 font-sans-semibold text-label-s text-plum">
        {action}
      </Text>
    </View>
  );
}

// Review & consent for both flows: Nail Transfer (a reference photo) and, with `flow=custom`,
// Nail Virtual Try-On (a Nail Polish or Press-On customization).
export default function NailReview() {
  const insets = useSafeAreaInsets();
  const { flow } = useLocalSearchParams<{ flow?: string }>();
  const isCustom = flow === 'custom';
  const hand = useNailSession((state) => state.hand);
  const reference = useNailSession((state) => state.design);
  const mode = useNailSession((state) => state.vtoMode);
  const polish = useNailSession((state) => state.polish);
  const press = useNailSession((state) => state.press);
  const consent = useNailSession((state) => state.consent);
  const setConsent = useNailSession((state) => state.setConsent);
  const attempt = useNailSession((state) => state.attempt);
  const startAttempt = useNailSession((state) => state.startAttempt);
  // Selected photos live in the app cache, which Android may clear between sessions. A thumbnail
  // can still show from the image cache, so check the real files before offering Generate.
  const [missing, setMissing] = useState<'hand' | 'reference' | null>(null);
  const handUri = hand?.uri;
  const referenceUri = isCustom ? undefined : reference?.image.uri;
  useEffect(() => {
    let active = true;
    (async () => {
      const handOk = !handUri || (await isPhotoReadable(handUri));
      const referenceOk = !referenceUri || (await isPhotoReadable(referenceUri));
      if (active) setMissing(!handOk ? 'hand' : !referenceOk ? 'reference' : null);
    })();
    return () => {
      active = false;
    };
  }, [handUri, referenceUri]);

  if (!hand) return <Redirect href={isCustom ? '/nail/photo?next=editor' : '/nail/photo'} />;
  const design: NailDesign | null = isCustom ? customDesignFrom(mode, polish, press) : reference;
  if (!design) return <Redirect href="/nail/designs" />;

  // startAttempt() hands back the attempt already in flight, so a double tap — or coming back
  // here and tapping again — can never create (and pay for) a second task.
  const generate = () => {
    if (startAttempt(design)) router.push('/nail/generating');
  };

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <FlowHeader step={3} />
      <ScrollView contentContainerClassName="gap-4 px-5 pb-6 pt-1" showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" className="font-serif text-hero text-ink">
          Ready to See Your <Text className="font-serif-italic text-plum">Look?</Text>
        </Text>

        {design.source === 'reference' ? (
          <View className="flex-row gap-3">
            <InputTile
              label="Your Hand"
              image={hand}
              action="Edit photo"
              onAction={() => router.push('/nail/photo?edit=1')}
            />
            <InputTile
              label="Selected Nail Design"
              image={design.image}
              action="Change design"
              onAction={() => router.back()}
            />
          </View>
        ) : (
          <>
            <View className="flex-row gap-3">
              <InputTile
                label="Your Hand"
                image={hand}
                action="Change hand photo"
                onAction={() => router.push('/nail/photo?edit=1')}
              />
              <View className="flex-1 gap-2">
                <NailSwatches compact colors={design.swatches} tip={mode === 'press' ? press.tip : 'oval'} />
                <Text
                  accessibilityRole="button"
                  onPress={() => router.back()}
                  className="self-start py-1.5 font-sans-semibold text-label-s text-plum">
                  Edit customization
                </Text>
              </View>
            </View>
            <View className="gap-2.5 rounded-lg border border-blush bg-card p-4">
              {design.summary.map((row) => (
                <View key={row.label} className="flex-row justify-between gap-4">
                  <Text className="font-sans text-body-m text-muted">{row.label}</Text>
                  <Text className="flex-1 text-right font-sans-semibold text-body-m text-ink">{row.value}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <View className="flex-row gap-3 rounded-lg border border-blush bg-card p-4">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-blush">
            <Icon name="info" size={18} color={colors.plum} />
          </View>
          <Text className="flex-1 font-sans text-body-m text-ink">
            {design.source === 'reference' ? 'We’ll send this photo and design to ' : 'We’ll send this photo and these settings to '}
            <Text className="font-sans-bold">YouCam</Text>, our AI imaging partner, to create a visual
            simulation on your nails. It’s a preview, not a promise of a real-world result.
            {design.source === 'custom' ? ' The sample above illustrates your choices; it is not a result.' : ''} YouCam
            may keep uploaded images for up to 30 days under its own policy.
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
              I agree to GlamQuote and YouCam processing this photo to create my preview.{' '}
              <Text className="font-sans-semibold text-plum">Required</Text>
            </Text>
            <Text className="font-sans text-body-s text-muted">
              Nothing is saved to your Lookbook unless you choose Save.
            </Text>
          </View>
        </Pressable>

        <Text className="text-center font-sans text-body-s text-muted">
          AI preview only. Actual results may vary.
        </Text>
      </ScrollView>

      {missing ? (
        <View accessibilityLiveRegion="polite" className="mx-5 mb-2 gap-1 rounded-lg bg-blush p-4">
          <Text className="font-sans-semibold text-label-s text-ink">
            {missing === 'hand' ? 'Please choose your hand photo again.' : 'Please choose your nail design again.'}
          </Text>
          <Text className="font-sans text-body-s text-muted">
            The copy saved on this phone was cleared. Nothing has been sent.
          </Text>
          <Text
            accessibilityRole="button"
            onPress={() => (missing === 'hand' ? router.push('/nail/photo?edit=1') : router.back())}
            className="self-start py-1.5 font-sans-semibold text-label-s text-plum">
            {missing === 'hand' ? 'Choose Hand Photo' : 'Choose Design'}
          </Text>
        </View>
      ) : null}

      <FooterBar>
        {attempt?.taskId ? (
          <>
            <Button label="View Preview in Progress" onPress={() => router.push('/nail/generating')} />
            <Text className="text-center font-sans text-body-s text-muted">
              A preview is already being created — it won’t be requested twice.
            </Text>
          </>
        ) : attempt ? (
          // An earlier request never reached YouCam; it may hold a different photo or choices.
          <>
            <Button
              label="Discard Earlier Request"
              variant="secondary"
              onPress={() => useNailSession.getState().endAttempt()}
            />
            <Text className="text-center font-sans text-body-s text-muted">
              An earlier request wasn’t sent. Discard it to generate with what you see here.
            </Text>
          </>
        ) : (
          <>
            <Button
              label={isCustom ? 'Generate My Nail Preview' : 'Generate AI Preview'}
              disabled={!consent || missing !== null}
              onPress={generate}
            />
            <Text className="text-center font-sans text-body-s text-muted">
              {consent
                ? 'One preview per tap — the button locks while it works.'
                : 'Tick the consent box to continue.'}
            </Text>
          </>
        )}
      </FooterBar>
    </View>
  );
}
