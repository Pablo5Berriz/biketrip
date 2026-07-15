import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '@/types/database';

// ============================================================
// Store d'authentification — Zustand
// ============================================================

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profile: null,
  isLoading: false,
  isInitialized: false,

  setUser:        (user)        => set({ user }),
  setSession:     (session)     => set({ session }),
  setProfile:     (profile)     => set({ profile }),
  setLoading:     (isLoading)   => set({ isLoading }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  reset: () => set({ user: null, session: null, profile: null }),
}));

// Sélecteurs utiles
export const useUser = () => useAuthStore((s) => s.user);
export const useProfile = () => useAuthStore((s) => s.profile);
export const useIsAuthenticated = () => useAuthStore((s) => !!s.session);
