import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/config/colors';

export default function Index() {
  const { session, isInitialized } = useAuthStore();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    SecureStore.getItemAsync('onboarding_done').then((val) => {
      setOnboardingDone(val === 'true');
    });
  }, []);

  if (!isInitialized || onboardingDone === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    );
  }

  if (!onboardingDone) return <Redirect href="/onboarding" />;
  if (!session) return <Redirect href="/auth/login" />;
  return <Redirect href="/(tabs)/home" />;
}
