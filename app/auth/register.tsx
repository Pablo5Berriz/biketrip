import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, User } from 'lucide-react-native';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { signUp } from '@/features/auth/authService';
import { signUpSchema, type SignUpFormData } from '@/lib/validations/auth';
import { colors } from '@/config/colors';

// ============================================================
// Écran Inscription
// ============================================================

export default function RegisterScreen() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', confirmPassword: '', fullName: '' },
  });

  async function onSubmit(data: SignUpFormData) {
    setServerError(null);
    const result = await signUp(data);
    if (!result.success) {
      setServerError(result.error ?? 'Erreur lors de l\'inscription.');
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F8F5' }}>
        <View className="flex-1 items-center justify-center px-8 gap-6">
          <Text className="text-5xl">🎉</Text>
          <Text className="text-2xl font-bold text-carbon text-center">
            Compte créé avec succès !
          </Text>
          <Text className="text-slate text-base text-center leading-6">
            Un email de confirmation t'a été envoyé. Vérifie ta boîte de réception pour activer ton compte.
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
          <View className="flex-1 bg-white p-6 gap-5">
            {/* Header */}
            <View className="gap-1 mb-2">
              <TouchableOpacity
                onPress={() => router.back()}
                className="mb-4"
                accessibilityRole="button"
                accessibilityLabel="Revenir à l'écran précédent"
              >
                <Text className="text-primary-600 text-base">← Retour</Text>
              </TouchableOpacity>
              <Text className="text-2xl font-bold text-carbon">Créer un compte</Text>
              <Text className="text-slate text-base">
                Rejoins la communauté BikeTrip.
              </Text>
            </View>

            {serverError && (
              <View className="bg-danger/10 rounded-xl p-3">
                <Text className="text-danger text-sm">{serverError}</Text>
              </View>
            )}

            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, value, onBlur } }) => (
                <AppInput
                  label="Prénom et nom"
                  placeholder="Marie Tremblay"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.fullName?.message}
                  leftIcon={<User size={18} color={colors.textSecondary} />}
                />
              )}
            />

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
              label="Créer mon compte"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              fullWidth
              size="lg"
              variant="gradient"
            />

            <View className="flex-row justify-center items-center gap-2">
              <Text className="text-slate text-sm">Déjà un compte ?</Text>
              <TouchableOpacity
                onPress={() => router.replace('/auth/login')}
                accessibilityRole="button"
                accessibilityLabel="Se connecter"
              >
                <Text className="text-primary-600 text-sm font-bold">Se connecter</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
