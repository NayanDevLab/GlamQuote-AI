import { View } from 'react-native';
import Svg, { Circle, Defs, Ellipse, Line, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';

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

// Hair Studio figures, copied from the design's 160×200 portrait symbols. Illustrations only —
// never presented as a person's photo or a generated result.
const HAIR_FIGURES = {
  curls: (
    <>
      <Path d="M12 200 C16 170 46 152 80 152 C114 152 144 170 148 200Z" fill="#70465B" />
      <Path d="M38 98 C28 80 34 54 52 46 C58 30 102 30 108 46 C126 54 132 80 122 98 C128 114 118 132 104 130 L56 130 C42 132 32 114 38 98Z" fill="#2A1E1C" />
      <Rect x={69} y={118} width={22} height={38} rx={10} fill="#7A4C33" />
      <Ellipse cx={80} cy={94} rx={26} ry={32} fill="#8D5A3E" />
      <Path d="M50 82 C46 64 58 54 66 58 C68 46 84 44 88 54 C96 46 110 54 108 66 C116 70 112 82 108 82 C96 70 64 70 50 82Z" fill="#2A1E1C" />
    </>
  ),
  crop: (
    <>
      <Path d="M12 200 C16 170 46 152 80 152 C114 152 144 170 148 200Z" fill="#29242A" />
      <Rect x={69} y={118} width={22} height={38} rx={10} fill="#D1A88E" />
      <Ellipse cx={80} cy={92} rx={26} ry={33} fill="#E3BFA6" />
      <Path d="M52 84 C48 54 64 42 80 42 C98 42 112 54 108 84 C104 68 96 60 86 58 C76 62 62 66 52 84Z" fill="#5A3A2E" />
    </>
  ),
  user: (
    <>
      <Path d="M12 200 C16 170 46 152 80 152 C114 152 144 170 148 200Z" fill="#D7AC90" />
      <Path d="M42 96 C38 60 58 40 80 40 C104 40 122 60 118 96 C122 120 128 140 120 158 C110 162 102 156 100 148 L60 148 C58 156 50 162 40 158 C32 140 38 120 42 96Z" fill="#3B2A2C" />
      <Rect x={69} y={118} width={22} height={38} rx={10} fill="#B57C5C" />
      <Ellipse cx={80} cy={92} rx={26} ry={33} fill="#C68E6E" />
      <Path d="M52 86 C54 60 68 50 82 50 C98 52 108 64 108 84 C98 70 84 64 72 66 C64 72 58 78 52 86Z" fill="#3B2A2C" />
    </>
  ),
};

export function HairFigure({ variant, width, height }: { variant: keyof typeof HAIR_FIGURES; width: number; height: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 160 200" aria-hidden>
      {HAIR_FIGURES[variant]}
    </Svg>
  );
}

/** Hair Studio hero: two portraits with different hair textures (design P4A-1). */
export function HairPortraits() {
  return (
    <View aria-hidden className="absolute inset-0">
      <View
        className="absolute right-[-50px] top-[-60px] h-[250px] w-[200px] rounded-full border border-champagne opacity-60"
      />
      <View className="absolute bottom-[-14px] left-1">
        <HairFigure variant="curls" width={190} height={220} />
      </View>
      <View className="absolute bottom-[-14px] right-0.5">
        <HairFigure variant="crop" width={178} height={206} />
      </View>
    </View>
  );
}
