import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[BikeTrip] Variables d\'environnement Supabase manquantes.\n' +
    'Vérifier EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY dans .env'
  );
}

// Storage sécurisé pour les tokens Supabase (jamais AsyncStorage)
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // PKCE requis pour la confirmation email mobile : le flow implicite (défaut)
    // renvoie les tokens dans le fragment d'URL (#access_token=...), qui n'est
    // pas exploitable par un routeur mobile basé sur les query params
    // (expo-router). PKCE renvoie un `?code=` exploitable via
    // exchangeCodeForSession() dans app/auth/confirm.tsx.
    flowType: 'pkce',
  },
});
