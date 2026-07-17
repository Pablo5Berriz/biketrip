import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { signIn } from '@/features/auth/authService';
import { signInSchema, type SignInFormData } from '@/lib/validations/auth';
import { colors, gradients } from '@/config/colors';

// ============================================================
// Écran Connexion
// ============================================================

export default function LoginScreen() {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(data: SignInFormData) {
    setServerError(null);
    const result = await signIn(data);
    if (!result.success) {
      setServerError(result.error ?? 'Erreur lors de la connexion.');
      return;
    }
    router.replace('/tabs/home');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F8F5' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header gradient */}
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="pt-12 pb-16 px-6 items-center gap-3"
          >
            <Text className="text-4xl font-black text-white" style={{ letterSpacing: -1 }}>
              BikeTrip 🚴
            </Text>
            <Text className="text-white/80 text-base text-center">
              Ton compagnon de route cycliste
            </Text>
          </LinearGradient>

          {/* Formulaire */}
          <View className="flex-1 bg-white rounded-t-3xl -mt-6 p-6 gap-5">
            <View className="gap-1">
              <Text className="text-2xl font-bold text-carbon">Bon retour !</Text>
              <Text className="text-slate text-base">Connecte-toi pour continuer.</Text>
            </View>

            {serverError && (
              <View className="bg-danger/10 rounded-xl p-3">
                <Text className="text-danger text-sm">{serverError}</Text>
              </View>
            )}

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value, onBlur } }) => (
                <AppInput
                  label="Adresse email"
                  placeholder="toi@exemple.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                  leftIcon={<Mail size={18} color={colors.textSecondary} />}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, value, onBlur } }) => (
                <AppInput
                  label="Mot de passe"
                  placeholder="••••••••"
                  isPassword
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                  leftIcon={<Lock size={18} color={colors.textSecondary} />}
                />
              )}
            />

            <TouchableOpacity
              onPress={() => router.push('/auth/forgot-password')}
              className="self-end"
              accessibilityRole="button"
              accessibilityLabel="Réinitialiser le mot de passe"
            >
              <Text className="text-primary-600 text-sm font-medium">
                Mot de passe oublié ?
              </Text>
            </TouchableOpacity>

            <AppButton
              label="Se connecter"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              fullWidth
              size="lg"
              variant="primary"
            />

            <View className="flex-row justify-center items-center gap-2 mt-2">
              <Text className="text-slate text-sm">Pas encore de compte ?</Text>
              <TouchableOpacity
                onPress={() => router.push('/auth/register')}
                accessibilityRole="button"
                accessibilityLabel="Créer un compte"
              >
                <Text className="text-primary-600 text-sm font-bold">
                  Créer un compte
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
