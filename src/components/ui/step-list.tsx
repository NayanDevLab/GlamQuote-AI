import { Text, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

import { colors } from '@/theme';

import { Icon, type IconName } from './icon';

export type Step = { icon: IconName; title: string; body: string };

/** The three-step product story; only the copy varies between Home and the Welcome sheet. */
export const HOW_IT_WORKS_ICONS = ['search', 'camera', 'checkCircle'] as const satisfies IconName[];

const CIRCLE = 48;

/** Vertical step list on a card, joined by a dashed champagne spine. The first step is filled plum. */
export function StepList({ steps, compact = false }: { steps: Step[]; compact?: boolean }) {
  const padding = compact ? 18 : 20;
  return (
    <View
      style={{ padding, gap: padding }}
      className="rounded-lg border border-blush bg-card">
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: padding + CIRCLE / 2 - 1,
          top: padding + CIRCLE / 2,
          bottom: padding + CIRCLE / 2,
          width: 2,
        }}>
        <Svg width={2} height="100%">
          <Line
            x1={1}
            y1={0}
            x2={1}
            y2="100%"
            stroke={colors.champagne}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        </Svg>
      </View>
      {steps.map((step, index) => (
        <View key={step.title} className={`flex-row items-center ${compact ? 'gap-3.5' : 'gap-4'}`}>
          {/* The card-coloured ring masks the spine behind each circle. */}
          <View
            style={{ boxShadow: `0 0 0 5px ${colors.card}` }}
            className={`h-12 w-12 items-center justify-center rounded-full ${
              index === 0 ? 'bg-plum' : 'bg-blush'
            }`}>
            <Icon name={step.icon} color={index === 0 ? colors.white : colors.plum} />
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="font-serif text-step text-ink">{step.title}</Text>
            <Text className="font-sans text-body-m text-muted">{step.body}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
