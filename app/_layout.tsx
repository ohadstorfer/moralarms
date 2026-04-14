import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { getCurrentSession, onAuthChange } from '../lib/auth';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState<boolean>(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    getCurrentSession().then((s) => {
      if (!mounted) return;
      setHasSession(!!s);
      setReady(true);
    });
    const unsub = onAuthChange((s) => {
      setHasSession(!!s);
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    const onAuthScreen = segments[0] === 'auth';
    if (!hasSession && !onAuthScreen) router.replace('/auth');
    else if (hasSession && onAuthScreen) router.replace('/');
  }, [ready, hasSession, segments, router]);

  if (!ready) return <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} />;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#FFFFFF' },
          headerTintColor: '#FF9500',
          headerShadowVisible: false,
          contentStyle: { backgroundColor: '#FFFFFF' },
          headerTitle: '',
        }}
      >
        <Stack.Screen
          name="task/[id]"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
