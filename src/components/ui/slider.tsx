import { useRef, useState } from 'react';
import { Text, View } from 'react-native';

type SliderProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
};

const THUMB = 24;

/** Labelled value slider in the design system's plum-on-blush style. Drag the track to adjust. */
export function Slider({ label, value, onChange, min = 0, max = 100, step = 1 }: SliderProps) {
  const [width, setWidth] = useState(0);
  // Where the current touch began; written and read only inside the touch handlers.
  const touch = useRef({ x: 0, y: 0, value });

  const clampToStep = (next: number) => Math.min(max, Math.max(min, Math.round(next / step) * step));
  const fraction = (value - min) / (max - min);

  return (
    <View className="gap-1.5">
      <View className="flex-row items-center justify-between">
        <Text className="font-sans-medium text-body-s text-ink">{label}</Text>
        <Text className="font-sans-semibold text-body-s text-plum">{value}</Text>
      </View>
      <View
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        onTouchStart={(event) => {
          touch.current = { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY, value };
        }}
        // Claim only horizontal drags so the page can still scroll vertically across the slider.
        onMoveShouldSetResponder={(event) => {
          const dx = Math.abs(event.nativeEvent.pageX - touch.current.x);
          const dy = Math.abs(event.nativeEvent.pageY - touch.current.y);
          return dx > 4 && dx > dy;
        }}
        onResponderMove={(event) => {
          const track = width - THUMB;
          if (track <= 0) return;
          const delta = ((event.nativeEvent.pageX - touch.current.x) / track) * (max - min);
          const next = clampToStep(touch.current.value + delta);
          if (next !== value) onChange(next);
        }}
        onResponderTerminationRequest={() => false}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: value }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) =>
          onChange(clampToStep(value + (event.nativeEvent.actionName === 'increment' ? 1 : -1) * step * 5))
        }
        className="h-10 justify-center">
        <View className="h-1.5 overflow-hidden rounded-full bg-line">
          <View style={{ width: `${fraction * 100}%` }} className="h-1.5 rounded-full bg-plum" />
        </View>
        <View
          style={{ left: fraction * Math.max(0, width - THUMB), boxShadow: '0 2px 6px rgba(41, 36, 42, 0.3)' }}
          className="absolute h-6 w-6 rounded-full border-2 border-plum bg-card"
        />
      </View>
    </View>
  );
}
