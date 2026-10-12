import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, Line, Polygon, RadialGradient, Stop } from 'react-native-svg';

import { colors, shadows } from '@/theme';

import { Monogram } from './ui/brand';
import { Icon } from './ui/icon';

/** Splash hero: an oval "mirror" with two glints and the monogram at its centre. */
export function SplashMirror() {
  return (
    <View
      aria-hidden
      className="h-[304px] w-[236px]">
      <Svg width={252} height={322} style={{ position: 'absolute', left: 0, top: 0 }}>
        <Ellipse cx={132} cy={168} rx={118} ry={152} fill={colors.blush} opacity={0.7} />
        <Ellipse
          cx={130}
          cy={166}
          rx={117.5}
          ry={151.5}
          fill="none"
          stroke={colors.champagne}
          opacity={0.45}
        />
        <Ellipse
          cx={118}
          cy={152}
          rx={117.5}
          ry={151.5}
          fill={colors.canvas}
          stroke={colors.champagne}
        />
        <Line x1={44.4} y1={67.8} x2={77.6} y2={25.2} stroke={colors.champagne} opacity={0.8} />
        <Line x1={49.8} y1={78.3} x2={68.2} y2={54.7} stroke={colors.champagne} opacity={0.55} />
      </Svg>
      <View className="flex-1 items-center justify-center">
        <View
          style={{ boxShadow: '0 18px 30px -18px rgba(112, 70, 91, 0.8)' }}
          className="rounded-full">
          <Monogram size="lg" />
        </View>
      </View>
    </View>
  );
}

/** Empty-Lookbook hero: a fanned stack of blank look cards with a plum bookmark ribbon. */
export function LookbookStack() {
  return (
    <View
      aria-hidden
      className="h-[210px] w-[240px] self-center">
      <Svg width={200} height={196} style={{ position: 'absolute', left: 20, top: 14 }}>
        <Defs>
          <RadialGradient id="lookbookHalo" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor="#F6EBE2" />
            <Stop offset="0.62" stopColor={colors.blush} />
            <Stop offset="0.72" stopColor={colors.blush} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={100} cy={88} r={147} fill="url(#lookbookHalo)" />
      </Svg>

      {/* Back cards */}
      <View
        style={[shadows.raised, { transform: [{ rotate: '-9deg' }] }]}
        className="absolute left-[34px] top-[46px] h-[124px] w-[92px] rounded-[18px] border-[1.5px] border-line bg-card">
        <View className="absolute bottom-[30px] left-2 right-2 top-2 rounded-sm border-[1.5px] border-dashed border-champagne" />
        <View className="absolute bottom-[14px] left-2.5 right-[30px] h-[5px] rounded-full bg-blush" />
      </View>
      <View
        style={[shadows.raised, { transform: [{ rotate: '8deg' }] }]}
        className="absolute right-[34px] top-10 h-[124px] w-[92px] rounded-[18px] border-[1.5px] border-line bg-card">
        <View className="absolute bottom-[30px] left-2 right-2 top-2 rounded-sm border-[1.5px] border-dashed border-champagne" />
        <View className="absolute bottom-[14px] left-2.5 right-[30px] h-[5px] rounded-full bg-blush" />
      </View>

      {/* Front card */}
      <View
        style={{ boxShadow: '0 16px 30px -18px rgba(41, 36, 42, 0.7)' }}
        className="absolute left-[70px] top-[26px] h-[136px] w-[100px] rounded-[20px] border-[1.5px] border-champagne bg-card">
        <View className="absolute bottom-[34px] left-[9px] right-[9px] top-[9px] items-center justify-center rounded-[13px] bg-[#F2E8E1]">
          <Svg width={18} height={18} viewBox="0 0 18 18">
            <Line x1={9} y1={2} x2={9} y2={16} stroke={colors.lineStrong} strokeWidth={1.5} />
            <Line x1={2} y1={9} x2={16} y2={9} stroke={colors.lineStrong} strokeWidth={1.5} />
          </Svg>
        </View>
        <View className="absolute bottom-[15px] left-3 right-11 h-[5px] rounded-full bg-blush" />
        <Svg width={24} height={34} style={{ position: 'absolute', right: 12, bottom: -6 }}>
          <Polygon points="0,0 24,0 24,34 12,25.8 0,34" fill={colors.plum} />
        </Svg>
      </View>

      <View className="absolute left-[26px] top-[22px]">
        <Icon name="star" size={18} color={colors.champagne} strokeWidth={0} filled />
      </View>
      <View className="absolute bottom-[30px] right-[22px]">
        <Icon name="star" size={13} color={colors.champagne} strokeWidth={0} filled />
      </View>
    </View>
  );
}

/** Compact version of the card stack for the Home "My Lookbook" teaser. */
export function LookbookTeaser() {
  return (
    <View
      aria-hidden
      className="mb-1.5 h-[104px] w-[168px]">
      <View
        style={{ transform: [{ rotate: '-9deg' }] }}
        className="absolute left-[18px] top-[14px] h-[82px] w-[62px] rounded-sm border border-dashed border-line-strong bg-canvas"
      />
      <View
        style={{ transform: [{ rotate: '9deg' }] }}
        className="absolute right-[18px] top-[14px] h-[82px] w-[62px] rounded-sm border border-dashed border-line-strong bg-canvas"
      />
      <View
        style={{ boxShadow: '0 10px 20px -12px rgba(41, 36, 42, 0.5)' }}
        className="absolute left-[50px] top-1 h-[92px] w-[68px] items-center justify-center rounded-[14px] border border-champagne bg-card">
        <Icon name="bookmarkPlus" size={26} color={colors.plum} strokeWidth={1.7} />
      </View>
    </View>
  );
}
