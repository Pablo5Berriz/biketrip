import { supabase } from '@/lib/supabase/client';
import type { ServiceResult } from '@/types/database';
import type { SignUpFormData, SignInFormData } from '@/lib/validations/auth';
import type { User, Session } from '@supabase/supabase-js';

// ============================================================
// Service d'authentification BikeTrip
// ============================================================

export interface AuthSession {
  user: User;
  session: Session;
}

/**
 * Inscription d'un nouvel utilisateur
 */
export async function signUp(data: SignUpFormData): Promise<ServiceResult<AuthSession>> {
  try {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { full_name: data.fullName },
      },
    });

    if (error) {
      return { success: false, error: mapAuthError(error.message) };
    }
    if (!authData.user || !authData.session) {
      return { success: false, error: 'Erreur lors de l\'inscription. Réessaie.' };
    }

    return {
      success: true,
      data: { user: authData.user, session: authData.session },
    };
  } catch {
    return { success: false, error: 'Erreur réseau. Vérifie ta connexion.' };
  }
}

/**
 * Connexion
 */
export async function signIn(data: SignInFormData): Promise<ServiceResult<AuthSession>> {
  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      return { success: false, error: mapAuthError(error.message) };
    }
    if (!authData.user || !authData.session) {
      return { success: false, error: 'Connexion impossible. Réessaie.' };
    }

    return {
      success: true,
      data: { user: authData.user, session: authData.session },
    };
  } catch {
    return { success: false, error: 'Erreur réseau. Vérifie ta connexion.' };
  }
}

/**
 * Déconnexion
 */
export async function signOut(): Promise<ServiceResult> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return { success: false, error: 'Erreur lors de la déconnexion.' };
    return { success: true };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

/**
 * Session courante
 */
export async function getSession(): Promise<ServiceResult<Session>> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return { success: false, error: error.message };
    if (!data.session) return { success: false, error: 'Non connecté' };
    return { success: true, data: data.session };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

/**
 * Envoi du lien de réinitialisation de mot de passe
 */
export async function resetPassword(email: string): Promise<ServiceResult> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'biketrip://reset-password',
    });
    if (error) return { success: false, error: mapAuthError(error.message) };
    return { success: true };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

// ============================================================
// Mapping des erreurs Supabase en messages français
// ============================================================
function mapAuthError(message: string): string {
  const errors: Record<string, string> = {
    'Invalid login credentials':        'Email ou mot de passe incorrect.',
    'Email not confirmed':              'Confirme ton email avant de te connecter.',
    'User already registered':          'Cette adresse email est déjà utilisée.',
    'Password should be at least 6':    'Le mot de passe est trop court.',
    'Invalid email':                    'Adresse email invalide.',
    'Email rate limit exceeded':        'Trop de tentatives. Réessaie dans quelques minutes.',
    'User not found':                   'Aucun compte trouvé avec cet email.',
  };

  for (const [key, value] of Object.entries(errors)) {
    if (message.includes(key)) return value;
  }
  return 'Une erreur est survenue. Réessaie.';
}
