import { Image } from 'expo-image';
import { Redirect, router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { FlowHeader, FooterBar } from '@/features/nail/components';
import { useNailSession, type PickedImage } from '@/features/nail/nail-session';
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

export default function NailReview() {
  const insets = useSafeAreaInsets();
  const hand = useNailSession((state) => state.hand);
  const design = useNailSession((state) => state.design);
  const consent = useNailSession((state) => state.consent);
  const setConsent = useNailSession((state) => state.setConsent);
  const attempt = useNailSession((state) => state.attempt);
  const startAttempt = useNailSession((state) => state.startAttempt);

  if (!hand) return <Redirect href="/nail/photo" />;
  if (!design) return <Redirect href="/nail/designs" />;

  // startAttempt() hands back the attempt already in flight, so a double tap — or coming back
  // here and tapping again — can never create (and pay for) a second task.
  const generate = () => {
    if (startAttempt()) router.push('/nail/generating');
  };

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <FlowHeader step={3} />
      <ScrollView contentContainerClassName="gap-4 px-5 pb-6 pt-1" showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" className="font-serif text-hero text-ink">
          Ready to See Your <Text className="font-serif-italic text-plum">Look?</Text>
        </Text>

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

        <View className="flex-row gap-3 rounded-lg border border-blush bg-card p-4">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-blush">
            <Icon name="info" size={18} color={colors.plum} />
          </View>
          <Text className="flex-1 font-sans text-body-m text-ink">
            We’ll send this photo and design to <Text className="font-sans-bold">YouCam</Text>, our AI
            imaging partner, to create a visual simulation of the design on your nails. It’s a preview,
            not a promise of a real-world result. YouCam may keep uploaded images for up to 30 days under
            its own policy.
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

      <FooterBar>
        {attempt ? (
          <>
            <Button label="View Preview in Progress" onPress={() => router.push('/nail/generating')} />
            <Text className="text-center font-sans text-body-s text-muted">
              A preview is already being created — it won’t be requested twice.
            </Text>
          </>
        ) : (
          <>
            <Button label="Generate AI Preview" disabled={!consent} onPress={generate} />
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
