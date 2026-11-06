import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/services/api';
import { OfflineBanner } from '@/components/OfflineBanner';
import { colors } from '@/constants/theme';

const query = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1 },
    mutations: { retry: 0 },
  },
});

function Bootstrap() {
  const { token, user, hydrated, hydrate, setUser, logout } = useAuthStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      if (!hydrated) await hydrate();
    })();
  }, [hydrated, hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    (async () => {
      if (token && !user) {
        try {
          setUser(await authApi.me());
        } catch {
          await logout();
        }
      }
      setReady(true);
    })();
  }, [hydrated, token]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Protected guard={!token}>
          <Stack.Screen name="login" />
        </Stack.Protected>
        <Stack.Protected guard={!!token && user?.role === 'SALESPERSON'}>
          <Stack.Screen name="(sales)" />
          <Stack.Screen name="shop/[id]" />
        </Stack.Protected>
        <Stack.Protected guard={!!token && user?.role === 'ADMIN'}>
          <Stack.Screen name="(admin)" />
          <Stack.Screen name="admin-shop/[id]" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function Root() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={query}>
        <StatusBar style="auto" />
        <Bootstrap />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
