import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    'SpaceGrotesk-Bold': require('@/assets/fonts/SpaceGrotesk-Bold.otf'),
    'SpaceGrotesk-SemiBold': require('@/assets/fonts/SpaceGrotesk-SemiBold.otf'),
    'SpaceGrotesk-Medium': require('@/assets/fonts/SpaceGrotesk-Medium.otf'),
    'SpaceGrotesk-Regular': require('@/assets/fonts/SpaceGrotesk-Regular.otf'),
    'SpaceGrotesk-Light': require('@/assets/fonts/SpaceGrotesk-Light.otf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <StatusBar style="dark" />
    </View>
  );
}
