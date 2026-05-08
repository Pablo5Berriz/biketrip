import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  SafeAreaView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react-native';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { resetPassword } from '@/features/auth/authService';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations/auth';
import { colors } from '@/config/colors';

// ============================================================
// Écran Mot de passe oublié
// ============================================================

export default function ForgotPasswordScreen() {
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(data: ForgotPasswordFormData) {
    setServerError(null);
    const result = await resetPassword(data.email);
    if (!result.success) {
      setServerError(result.error ?? 'Erreur lors de l\'envoi.');
      return;
    }
    setSuccess(true);
  }

  if (success) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F8F5' }}>
        <View className="flex-1 items-center justify-center px-8 gap-6">
          <View className="w-20 h-20 bg-primary-600/10 rounded-full items-center justify-center">
            <CheckCircle size={44} color={colors.primary.DEFAULT} />
          </View>
          <Text className="text-2xl font-bold text-carbon text-center">
            Email envoyé !
          </Text>
          <Text className="text-slate text-base text-center leading-6">
            Si un compte correspond à cette adresse, tu recevras un lien pour réinitialiser ton mot de passe.
          </Text>
          <AppButton
            label="Retour à la connexion"
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
        <View className="flex-1 bg-white p-6 gap-6">
          {/* Header */}
          <View className="gap-1">
            <TouchableOpacity onPress={() => router.back()} className="mb-4">
              <View className="flex-row items-center gap-2">
                <ArrowLeft size={18} color={colors.primary.DEFAULT} />
                <Text className="text-primary-600 text-base">Retour</Text>
              </View>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-carbon">Mot de passe oublié</Text>
            <Text className="text-slate text-base">
              Saisis ton adresse email et on t'enverra un lien de réinitialisation.
            </Text>
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

          <AppButton
            label="Envoyer le lien"
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
