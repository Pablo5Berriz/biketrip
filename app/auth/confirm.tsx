import { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase/client';
import { colors } from '@/config/colors';

// ============================================================
// Callback de confirmation email (deep link biketrip://auth/confirm)
// ============================================================
// Flow PKCE (voir src/lib/supabase/client.ts) : le lien de confirmation
// envoyé par Supabase redirige ici avec un paramètre `code`. On l'échange
// contre une session via exchangeCodeForSession(), puis on redirige vers la
// racine ("/") : app/index.tsx décide déjà de la destination finale selon
// l'état de session (voir sa logique existante), donc on ne duplique pas
// cette décision ici.

export default function ConfirmScreen() {
  const params = useLocalSearchParams<{ code?: string }>();
  const [status, setStatus] = useState<'pending' | 'done' | 'error'>('pending');
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    let mounted = true;
    async function run() {
      const code = params.code;
      if (!code) {
        if (mounted) setStatus('error');
        return;
      }
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (mounted) setStatus(error ? 'error' : 'done');
    }
    run();
    return () => {
      mounted = false;
    };
  }, [params.code]);

  if (status === 'pending') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    );
  }

  if (status === 'error') {
    return <Redirect href="/auth/login" />;
  }

  return <Redirect href="/" />;
}
