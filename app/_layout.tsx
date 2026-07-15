import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import '../src/styles/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,     // 5 minutes
      retry: 2,
      retryDelay: 1000,
    },
  },
});

function AppContent() {
  const { isInitialized } = useAuth();

  if (!isInitialized) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="trails/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="ride/start" options={{ presentation: 'modal' }} />
      <Stack.Screen name="ride/active" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="ride/summary" options={{ presentation: 'modal' }} />
      <Stack.Screen name="reports/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="settings" />
      <Stack.Screen name="admin" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <AppContent />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
