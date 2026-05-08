import { useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';

// ============================================================
// Hook d'authentification — écoute Supabase Auth
// ============================================================

export function useAuth() {
  const {
    user, session, profile, isLoading, isInitialized,
    setUser, setSession, setProfile, setLoading, setInitialized, reset,
  } = useAuthStore();

  const loadProfile = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (data) setProfile(data);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setProfile]);

  useEffect(() => {
    let mounted = true;

    // Charger la session existante
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        loadProfile(data.session.user.id);
      }
      setInitialized(true);
    });

    // Écouter les changements d'auth
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await loadProfile(newSession.user.id);
        } else {
          setProfile(null);
        }
      },
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile, setInitialized, setProfile, setSession, setUser]);

  return {
    user,
    session,
    profile,
    isLoading,
    isInitialized,
    isAuthenticated: !!session,
    reset,
  };
}
