import { useEffect, useRef, useState } from 'react';
import {
  View, Text,
  SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Lock, CheckCircle, AlertTriangle } from 'lucide-react-native';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { supabase } from '@/lib/supabase/client';
import { exchangeRecoveryCode, updatePassword } from '@/features/auth/authService';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/validations/auth';
import { colors } from '@/config/colors';

// ============================================================
// Écran Nouveau mot de passe (deep link biketrip://auth/reset-password)
// ============================================================
// Flow PKCE (voir src/lib/supabase/client.ts) : le lien de réinitialisation
// envoyé par Supabase (resetPasswordForEmail, voir authService.ts) redirige
// ici avec un paramètre `code`, échangé contre une session de récupération
// via exchangeCodeForSession() — même mécanisme que app/auth/confirm.tsx.
// Supabase émet un événement PASSWORD_RECOVERY (onAuthStateChange) au moment
// de cet échange ; on l'écoute uniquement à titre de confirmation/diagnostic,
// la logique de l'écran ne dépend pas de ce type d'événement au-delà du
// succès/échec de l'échange lui-même (le champ `redirectType` retourné par
// exchangeCodeForSession n'est pas typé publiquement par @supabase/auth-js,
// on ne s'y fie donc pas directement).

type Status = 'pending' | 'invalid' | 'form' | 'success';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams<{ code?: string }>();
  const [status, setStatus] = useState<Status>('pending');
  const ranRef = useRef(false);

  const {
    control, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const [serverError, setServerError] = useState<string | null>(null);

  // Écoute PASSWORD_RECOVERY à titre de confirmation/diagnostic (voir commentaire
  // ci-dessus) : n'entre dans aucune branche logique de l'écran, uniquement
  // pour vérifier que Supabase qualifie bien ce callback comme un événement
  // de récupération de mot de passe (utile en debug physique).
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // eslint-disable-next-line no-console
        console.debug('[reset-password] PASSWORD_RECOVERY event confirmed by Supabase');
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    let mounted = true;
    async function run() {
      const code = params.code;
      if (!code) {
        if (mounted) setStatus('invalid');
        return;
      }
      const result = await exchangeRecoveryCode(code);
      if (!mounted) return;
      setStatus(result.success ? 'form' : 'invalid');
    }
    run();
    return () => {
      mounted = false;
    };
  }, [params.code]);

  async function onSubmit(data: ResetPasswordFormData) {
    setServerError(null);
    const result = await updatePassword(data.password);
    if (!result.success) {
      setServerError(result.error ?? 'Erreur lors de la mise à jour du mot de passe.');
      return;
    }
    setStatus('success');
  }

  if (status === 'pending') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
      </View>
    );
  }

  if (status === 'invalid') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F8F5' }}>
        <View className="flex-1 items-center justify-center px-8 gap-6">
          <AlertTriangle size={48} color={colors.danger} />
          <Text className="text-xl font-bold text-carbon text-center">
            Lien invalide ou expiré
          </Text>
          <Text className="text-slate text-base text-center">
            Ce lien de réinitialisation n'est plus valide. Demande un nouveau lien pour continuer.
          </Text>
          <AppButton
            label="Demander un nouveau lien"
            onPress={() => router.replace('/auth/forgot-password')}
            fullWidth
            size="lg"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (status === 'success') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F8F5' }}>
        <View className="flex-1 items-center justify-center px-8 gap-6">
          <View className="w-20 h-20 bg-primary-600/10 rounded-full items-center justify-center">
            <CheckCircle size={44} color={colors.primary.DEFAULT} />
          </View>
          <Text className="text-2xl font-bold text-carbon text-center">
            Mot de passe mis à jour !
          </Text>
          <Text className="text-slate text-base text-center leading-6">
            Ton mot de passe a bien été changé. Tu peux maintenant te connecter avec ton nouveau mot de passe.
          </Text>
          <AppButton
            label="Se connecter"
            onPress={() => router.replace('/auth/login')}
            fullWidth
            size="lg"
          />
        </View>
      </SafeAreaView>
    );
  }

  // status === 'form'
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F8F5' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View className="flex-1 bg-white p-6 gap-6">
          <View className="gap-1">
            <Text className="text-2xl font-bold text-carbon">Nouveau mot de passe</Text>
            <Text className="text-slate text-base">
              Choisis un nouveau mot de passe pour ton compte.
            </Text>
          </View>

          {serverError && (
            <View className="bg-danger/10 rounded-xl p-3">
              <Text className="text-danger text-sm">{serverError}</Text>
            </View>
          )}

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value, onBlur } }) => (
              <AppInput
                label="Nouveau mot de passe"
                placeholder="Minimum 8 caractères"
                isPassword
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.password?.message}
                leftIcon={<Lock size={18} color={colors.textSecondary} />}
                hint="Au moins 8 caractères, une majuscule et un chiffre"
              />
            )}
          />

          <Controller
            control={control}
            name="confirmPassword"
            render={({ field: { onChange, value, onBlur } }) => (
              <AppInput
                label="Confirmer le mot de passe"
                placeholder="Répète ton mot de passe"
                isPassword
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.confirmPassword?.message}
                leftIcon={<Lock size={18} color={colors.textSecondary} />}
              />
            )}
          />

          <AppButton
            label="Mettre à jour le mot de passe"
            onPress={handleSubmit(onSubmit)}
            loading={isSubmitting}
            fullWidth
            size="lg"
            variant="gradient"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
