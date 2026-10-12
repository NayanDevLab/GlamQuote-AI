import { Text, View } from 'react-native';

type Size = 'sm' | 'lg';

// sm = Home / Welcome header lockup, lg = Splash.
const MONOGRAM = {
  sm: { box: 'h-[38px] w-[38px]', gap: 'p-0.5', letter: 'text-[23px] leading-[26px]' },
  lg: { box: 'h-[90px] w-[90px]', gap: 'p-[3px]', letter: 'text-[56px] leading-[62px]' },
} as const;

/** Plum "G" disc with an ivory gap and a champagne hairline ring. */
export function Monogram({ size = 'sm' }: { size?: Size }) {
  const m = MONOGRAM[size];
  return (
    <View className={`rounded-full bg-champagne p-px ${m.box}`}>
      <View className={`flex-1 rounded-full bg-canvas ${m.gap}`}>
        <View className="flex-1 items-center justify-center rounded-full bg-plum">
          <Text className={`font-serif-italic text-canvas ${m.letter}`}>G</Text>
        </View>
      </View>
    </View>
  );
}

const WORDMARK = {
  sm: {
    gap: 'gap-1.5',
    name: 'text-[25px] leading-[28px] tracking-[-0.25px]',
    badge: 'rounded-[6px] px-[5px] pb-0.5 pt-[3px]',
    ai: 'text-[11px] leading-[13px] tracking-[1.76px]',
  },
  lg: {
    gap: 'gap-2',
    name: 'text-[46px] leading-[50px] tracking-[-0.69px]',
    badge: 'rounded-[7px] px-[7px] pb-[3px] pt-1',
    ai: 'text-[13px] leading-[15px] tracking-[2.08px]',
  },
} as const;

/** "GlamQuote" wordmark with the outlined AI badge. */
export function Wordmark({ size = 'sm' }: { size?: Size }) {
  const w = WORDMARK[size];
  return (
    <View accessible accessibilityLabel="GlamQuote AI" className={`flex-row items-center ${w.gap}`}>
      <Text className={`font-serif text-ink ${w.name}`}>GlamQuote</Text>
      <View className={`border border-champagne ${w.badge}`}>
        <Text className={`font-sans-bold text-plum ${w.ai}`}>AI</Text>
      </View>
    </View>
  );
}
