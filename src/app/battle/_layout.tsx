import { Stack } from 'expo-router';

import { colors } from '@/theme';

// Look Battle's own stack. `initialRouteName` keeps the entry screen underneath any screen opened
// directly (a studio's Compare button, or an app restart), so Back always has somewhere to go.
export const unstable_settings = { initialRouteName: 'index' };

export default function BattleLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }} />;
}
