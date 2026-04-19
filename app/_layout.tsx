import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppProvider } from '@/context/AppContext';
import { isOnboarded } from '@/utils/storage';

export const unstable_settings = {
  anchor: '(tabs)',
};

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    isOnboarded().then((done) => {
      setNeedsOnboarding(!done);
      setChecked(true);
    });
  }, []);

  useEffect(() => {
    if (checked && needsOnboarding) {
      router.replace('/onboarding');
    }
  }, [checked, needsOnboarding]);

  if (!checked) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F2F5' }}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
  return <>{children}</>;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AppProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <NavigationGuard>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="settings" options={{ presentation: 'modal', title: 'Settings' }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
        </NavigationGuard>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AppProvider>
  );
}
