import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { IconButton } from '@/components/ui/icon-button';
import { FooterBar, NailSwatches } from '@/features/nail/components';
import { useNailSession } from '@/features/nail/nail-session';
import { FINGERS, type VtoMode } from '@/features/nail/vto';
import { colors, shadows } from '@/theme';

const MODES: { id: VtoMode; title: string; body: string }[] = [
  {
    id: 'polish',
    title: 'Nail Polish',
    body: 'Color your own nails. Nine finishes, with a different color per finger if you like.',
  },
  {
    id: 'press',
    title: 'Press-On Nails',
    body: 'Try a new shape and length too. Choose a tip, a base and one of three finishes.',
  },
];

/** Customize My Nails entry: pick Nail Polish or Press-On, then continue to the photo or editor. */
export default function NailCustomize() {
  const insets = useSafeAreaInsets();
  const mode = useNailSession((state) => state.vtoMode);
  const setMode = useNailSession((state) => state.setVtoMode);
  const polish = useNailSession((state) => state.polish);
  const press = useNailSession((state) => state.press);
  const hasHand = useNailSession((state) => state.hand !== null);

  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top }}>
      <View className="h-12 flex-row items-center justify-between px-2">
        <IconButton icon="arrowLeft" label="Back" strokeWidth={1.8} onPress={() => router.back()} />
        <Text className="pr-4 font-sans-semibold text-overline uppercase text-muted">Customize My Nails</Text>
      </View>

      <ScrollView contentContainerClassName="gap-4 px-5 pb-6 pt-1" showsVerticalScrollIndicator={false}>
        <View className="gap-2">
          <Text accessibilityRole="header" className="font-serif text-hero text-ink">
            Create Your Perfect <Text className="font-serif-italic text-plum">Nail Look</Text>
          </Text>
          <Text className="font-sans text-body-l text-muted">
            Choose how you’d like to customize. You can switch at any time — your choices in each are kept.
          </Text>
        </View>

        {MODES.map((option) => {
          const selected = mode === option.id;
          return (
            <Pressable
              key={option.id}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${option.title}. ${option.body}`}
              onPress={() => setMode(option.id)}
              style={selected ? shadows.card : undefined}
              className={`gap-3 rounded-lg bg-card p-3 ${selected ? 'border-2 border-plum' : 'border border-line'}`}>
              <NailSwatches
                colors={
                  option.id === 'polish' ? FINGERS.map(({ id }) => polish.colors[id]) : FINGERS.map(() => press.color)
                }
                tip={option.id === 'press' ? press.tip : 'oval'}
              />
              <View className="flex-row items-start gap-3 px-1 pb-1">
                <View className="flex-1 gap-0.5">
                  <Text className="font-serif text-title text-ink">{option.title}</Text>
                  <Text className="font-sans text-body-s text-muted">{option.body}</Text>
                </View>
                <View
                  className={`mt-1 h-6 w-6 items-center justify-center rounded-full ${
                    selected ? 'bg-plum' : 'border-[1.5px] border-line-strong'
                  }`}>
                  {selected ? <Icon name="check" size={14} color={colors.white} strokeWidth={2.6} /> : null}
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <FooterBar>
        <Button
          label={hasHand ? 'Continue' : 'Continue to Hand Photo'}
          trailingIcon="arrowRight"
          onPress={() => router.push(hasHand ? '/nail/editor' : '/nail/photo?next=editor')}
        />
        <Text className="text-center font-sans text-body-s text-muted">
          Nothing is generated until you review and tap Generate.
        </Text>
      </FooterBar>
    </View>
  );
}
