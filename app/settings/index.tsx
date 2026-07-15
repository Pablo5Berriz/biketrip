import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, Image,
} from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Camera, User, Bike,
  Shield, ChevronDown, CheckCircle,
} from 'lucide-react-native';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { updateProfile, uploadAvatar } from '@/features/auth/profileService';
import { updateProfileSchema, type UpdateProfileFormData } from '@/lib/validations/profile';
import { pickImageFromLibrary } from '@/lib/permissions/permissionService';
import { useProfile, useUser } from '@/stores/authStore';
import {
  CYCLING_LEVEL_LABELS, BIKE_TYPE_LABELS,
} from '@/lib/constants/labels';
import { colors } from '@/config/colors';
import type { CyclingLevel, BikeType } from '@/types/database';

// ============================================================
// Écran Paramètres — Profil & Préférences
// ============================================================

const CYCLING_LEVELS: CyclingLevel[] = ['BEGINNER', 'CASUAL', 'REGULAR', 'SPORT', 'EXPERT'];
const BIKE_TYPES: BikeType[] = ['MOUNTAIN', 'ROAD', 'GRAVEL', 'ELECTRIC', 'HYBRID', 'URBAN', 'CARGO'];

export default function SettingsScreen() {
  const profile = useProfile();
  const user = useUser();
  const qc = useQueryClient();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saved, setSaved] = useState(false);

  const {
    control, handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      full_name: profile?.full_name ?? '',
      cycling_level: profile?.cycling_level ?? undefined,
      primary_bike_type: profile?.primary_bike_type ?? undefined,
      city: profile?.city ?? '',
    },
  });

  const mutation = useMutation({
    mutationFn: (data: UpdateProfileFormData) => updateProfile(data),
    onSuccess: () => {
      setSaved(true);
      qc.invalidateQueries({ queryKey: ['profile'] });
      setTimeout(() => setSaved(false), 3000);
    },
  });

  async function handleAvatarChange() {
    const result = await pickImageFromLibrary();
    if (!result.success || !result.data) return;
    setUploadingAvatar(true);
    try {
      await uploadAvatar(result.data);
      qc.invalidateQueries({ queryKey: ['profile'] });
    } finally {
      setUploadingAvatar(false);
    }
  }

  const avatarUrl = profile?.avatar_url;
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Cycliste';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F8F5' }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 gap-3 border-b border-border bg-white">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Revenir à l'écran précédent"
        >
          <ArrowLeft size={20} color={colors.carbon} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-carbon flex-1">Paramètres</Text>
        {saved && (
          <View className="flex-row items-center gap-1">
            <CheckCircle size={14} color={colors.primary.DEFAULT} />
            <Text className="text-primary-600 text-sm">Sauvegardé</Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View className="items-center gap-3">
          <TouchableOpacity
            onPress={handleAvatarChange}
            disabled={uploadingAvatar}
            accessibilityRole="button"
            accessibilityLabel="Changer l'avatar"
          >
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={{ width: 88, height: 88, borderRadius: 44 }}
              />
            ) : (
              <View
                className="items-center justify-center"
                style={{
                  width: 88, height: 88, borderRadius: 44,
                  backgroundColor: colors.primary.DEFAULT,
                }}
              >
                <Text style={{ fontSize: 32, color: 'white', fontWeight: '700' }}>
                  {firstName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full items-center justify-center border-2 border-white"
              style={{ backgroundColor: colors.primary.DEFAULT }}
            >
              <Camera size={12} color="white" />
            </View>
          </TouchableOpacity>
          <Text className="text-xs text-slate">{uploadingAvatar ? 'Chargement...' : "Changer l'avatar"}</Text>
        </View>

        {/* Infos de base */}
        <SectionBlock title="Identité" icon={<User size={14} color={colors.textSecondary} />}>
          <View className="gap-4 p-4">
            <Controller
              control={control}
              name="full_name"
              render={({ field: { onChange, value, onBlur } }) => (
                <AppInput
                  label="Prénom et nom"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.full_name?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="city"
              render={({ field: { onChange, value, onBlur } }) => (
                <AppInput
                  label="Ville"
                  placeholder="Ex. : Montréal"
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
            <View>
              <Text className="text-slate text-xs">Email</Text>
              <Text className="text-carbon text-sm mt-1">{user?.email}</Text>
            </View>
          </View>
        </SectionBlock>

        {/* Niveau & vélo */}
        <SectionBlock title="Mon profil cycliste" icon={<Bike size={14} color={colors.textSecondary} />}>
          <View className="gap-4 p-4">
            {/* Niveau */}
            <View>
              <Text className="text-sm font-medium text-carbon mb-2">Niveau</Text>
              <Controller
                control={control}
                name="cycling_level"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row flex-wrap gap-2">
                    {CYCLING_LEVELS.map((level) => (
                      <TouchableOpacity
                        key={level}
                        onPress={() => onChange(level)}
                        className={`rounded-full px-4 py-2 border ${
                          value === level
                            ? 'bg-primary-600 border-primary-600'
                            : 'bg-white border-border'
                        }`}
                        accessibilityRole="button"
                        accessibilityLabel={`Choisir le niveau ${CYCLING_LEVEL_LABELS[level]}`}
                      >
                        <Text className={`text-sm font-medium ${value === level ? 'text-white' : 'text-carbon'}`}>
                          {CYCLING_LEVEL_LABELS[level]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
            </View>

            {/* Type de vélo */}
            <View>
              <Text className="text-sm font-medium text-carbon mb-2">Type de vélo</Text>
              <Controller
                control={control}
                name="primary_bike_type"
                render={({ field: { onChange, value } }) => (
                  <View className="flex-row flex-wrap gap-2">
                    {BIKE_TYPES.map((bike) => (
                      <TouchableOpacity
                        key={bike}
                        onPress={() => onChange(bike)}
                        className={`rounded-full px-4 py-2 border ${
                          value === bike
                            ? 'bg-secondary-600 border-secondary-600'
                            : 'bg-white border-border'
                        }`}
                        accessibilityRole="button"
                        accessibilityLabel={`Choisir le type de vélo ${BIKE_TYPE_LABELS[bike]}`}
                      >
                        <Text className={`text-sm font-medium ${value === bike ? 'text-white' : 'text-carbon'}`}>
                          {BIKE_TYPE_LABELS[bike]}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
            </View>
          </View>
        </SectionBlock>

        {/* Sauvegarder */}
        <AppButton
          label="Sauvegarder"
          onPress={handleSubmit((data) => mutation.mutate(data))}
          loading={isSubmitting || mutation.isPending}
          fullWidth
          size="lg"
          variant="gradient"
        />

        {/* Sécurité */}
        <SectionBlock title="Sécurité" icon={<Shield size={14} color={colors.textSecondary} />}>
          <TouchableOpacity
            onPress={() => router.push('/auth/forgot-password')}
            className="p-4 flex-row items-center justify-between"
            accessibilityRole="button"
            accessibilityLabel="Changer le mot de passe"
          >
            <Text className="text-carbon text-sm">Changer le mot de passe</Text>
            <ChevronDown
              size={16}
              color={colors.textSecondary}
              style={{ transform: [{ rotate: '-90deg' }] }}
            />
          </TouchableOpacity>
        </SectionBlock>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionBlock({
  title, icon, children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View>
      <View className="flex-row items-center gap-2 mb-2 px-1">
        {icon}
        <Text className="text-xs font-semibold text-slate uppercase tracking-widest">
          {title}
        </Text>
      </View>
      <View className="bg-white rounded-2xl border border-border overflow-hidden">
        {children}
      </View>
    </View>
  );
}
