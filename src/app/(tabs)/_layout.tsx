import { Tabs } from 'expo-router';

import { TabBar } from '@/components/ui/tab-bar';
import { colors } from '@/theme';

// Bottom navigation has exactly three tabs; studios and other flows open as full screens above it.
export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.canvas } }}>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="lookbook" options={{ title: 'Lookbook' }} />
    </Tabs>
  );
}
