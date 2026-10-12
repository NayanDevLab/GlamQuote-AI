import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { colors } from '@/theme';

import { Icon } from './icon';

type BeforeAfterProps = {
  /** The user's original photo. */
  before: string;
  /** The genuine AI result. */
  after: string;
  aspectRatio: number;
  onAfterLoad?: () => void;
  onAfterError?: () => void;
};

const clamp = (value: number) => Math.min(1, Math.max(0, value));

/**
 * Original / AI Preview comparison. Drag anywhere on the image to move the divider; the
 * original is revealed on the left and the AI preview on the right. Shared by every studio.
 */
export function BeforeAfter({ before, after, aspectRatio, onAfterLoad, onAfterError }: BeforeAfterProps) {
  const [width, setWidth] = useState(0);
  const [position, setPosition] = useState(0.5);
  // Where the current touch began; written and read only inside the touch handlers.
  const touch = useRef({ x: 0, y: 0, position: 0.5 });

  const dividerX = width * position;

  return (
    <View className="gap-3">
      <View
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        onTouchStart={(event) => {
          touch.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY, position };
        }}
        // Claim only horizontal drags so the page can still scroll vertically over the image.
        onMoveShouldSetResponder={(event) => {
          const dx = Math.abs(event.nativeEvent.pageX - touch.current.x);
          const dy = Math.abs(event.nativeEvent.pageY - touch.current.y);
          return dx > 6 && dx > dy;
        }}
        onResponderMove={(event) => {
          if (width > 0) {
            setPosition(clamp(touch.current.position + (event.nativeEvent.pageX - touch.current.x) / width));
          }
        }}
        onResponderTerminationRequest={() => false}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Original and AI preview comparison"
        accessibilityValue={{ text: `${Math.round(position * 100)}% original shown` }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) =>
          setPosition(clamp(position + (event.nativeEvent.actionName === 'increment' ? 0.1 : -0.1)))
        }
        style={{ aspectRatio, boxShadow: '0 14px 30px -20px rgba(41, 36, 42, 0.55)' }}
        className="overflow-hidden rounded-lg bg-blush">
        <Image
          source={{ uri: after }}
          contentFit="cover"
          cachePolicy="disk"
          onLoad={onAfterLoad}
          onError={onAfterError}
          style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}
        />
        {/* The original, clipped to the left of the divider. */}
        <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: dividerX, overflow: 'hidden' }}>
          <Image source={{ uri: before }} contentFit="cover" style={{ width, height: '100%' }} />
        </View>

        <View style={{ position: 'absolute', top: 0, bottom: 0, left: dividerX - 1, width: 2 }} className="bg-canvas" />
        <View
          style={{ left: dividerX - 22, boxShadow: '0 6px 16px -6px rgba(41, 36, 42, 0.5)' }}
          className="absolute top-1/2 -mt-[22px] h-11 w-11 items-center justify-center rounded-full bg-card">
          <Icon name="compare" size={20} color={colors.plum} strokeWidth={2} />
        </View>

        <View className="absolute left-3 top-3 rounded-full bg-canvas/95 px-3 py-1.5">
          <Text className="font-sans-semibold text-caption text-ink">Original</Text>
        </View>
        <View className="absolute right-3 top-3 rounded-full bg-plum px-3 py-1.5">
          <Text className="font-sans-semibold text-caption text-white">AI Preview</Text>
        </View>
      </View>

      <View aria-hidden className="flex-row items-center gap-3 px-1">
        <Text className="font-sans-semibold text-caption text-ink">Original</Text>
        <View className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
          <View style={{ width: `${position * 100}%` }} className="h-1.5 rounded-full bg-plum" />
        </View>
        {/* Non-breaking space: Android otherwise wraps "Preview" onto a clipped second line. */}
        <Text className="font-sans-semibold text-caption text-plum">{'AI Preview'}</Text>
      </View>
    </View>
  );
}
