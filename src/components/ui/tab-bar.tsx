import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme';

import { Icon, type IconName } from './icon';

// Exactly three tabs. Route names match the files in src/app/(tabs).
const TAB_ICONS: Record<string, IconName> = {
  home: 'home',
  explore: 'compass',
  lookbook: 'bookmark',
};

/** Bottom navigation from the design: blush pill, plum icon and bold label on the active tab. */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={{ paddingBottom: 12 + insets.bottom }}
      className="flex-row gap-2 border-t border-line bg-canvas px-3 pt-2">
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = descriptors[route.key].options.title ?? route.name;
        const tint = focused ? colors.plum : colors.muted;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
            onPress={onPress}
            className="min-h-14 flex-1 items-center justify-center gap-1">
            {/* collapsable={false}: with no background an unfocused pill is flattened away on Android,
                and its radius is lost when it gains one on focus (it rendered square). */}
            <View
              collapsable={false}
              className={`h-8 w-16 items-center justify-center rounded-full ${
                focused ? 'bg-blush' : ''
              }`}>
              <Icon
                name={TAB_ICONS[route.name] ?? 'home'}
                color={tint}
                filled={focused && route.name === 'lookbook'}
              />
            </View>
            <Text
              className={`text-nav ${
                focused ? 'font-sans-bold text-plum' : 'font-sans-medium text-muted'
              }`}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
