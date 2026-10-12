import '@/global.css';

import { Figtree_400Regular } from '@expo-google-fonts/figtree/400Regular';
import { Figtree_500Medium } from '@expo-google-fonts/figtree/500Medium';
import { Figtree_600SemiBold } from '@expo-google-fonts/figtree/600SemiBold';
import { Figtree_700Bold } from '@expo-google-fonts/figtree/700Bold';
import { InstrumentSerif_400Regular } from '@expo-google-fonts/instrument-serif/400Regular';
import { InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif/400Regular_Italic';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { colors } from '@/theme';

// Hold the native splash until the bundled fonts are ready, then hand over to the branded Splash route.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const navigationTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.canvas, card: colors.canvas },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={navigationTheme}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.canvas } }}>
          <Stack.Screen name="index" options={{ animation: 'none' }} />
          <Stack.Screen name="(onboarding)" options={{ animation: 'fade' }} />
          <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
