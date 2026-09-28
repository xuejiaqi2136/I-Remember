import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { MemoProvider } from '@/context/MemoContext';
import { Theme } from '@/constants/Theme';
import { addNotificationResponseListener } from '@/lib/notifications';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <MemoProvider>
      <RootLayoutNav />
    </MemoProvider>
  );
}

function RootLayoutNav() {
  const router = useRouter();

  useEffect(() => {
    const sub = addNotificationResponseListener((memoId) => {
      router.push(`/memo/${memoId}?from=notify`);
    });
    return () => sub.remove();
  }, [router]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerTintColor: Theme.colors.accent,
          headerTitleStyle: {
            fontFamily: Theme.fonts.bodyMedium,
            color: Theme.colors.ink,
          },
          headerStyle: { backgroundColor: Theme.colors.bgMid },
          contentStyle: { backgroundColor: Theme.colors.bgBottom },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="memo/new" options={{ title: '记一笔', presentation: 'modal' }} />
        <Stack.Screen name="memo/[id]" options={{ title: '备忘' }} />
      </Stack>
    </>
  );
}
