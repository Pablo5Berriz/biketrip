import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Camera, MapPin, AlertTriangle, X } from 'lucide-react-native';
import { AppInput } from '@/components/ui/AppInput';
import { AppButton } from '@/components/ui/AppButton';
import { createReport } from '@/features/reports/reportService';
import { pickImageFromLibrary, takePhoto } from '@/lib/permissions/permissionService';
import { createReportSchema, type CreateReportFormData } from '@/lib/validations/report';
import { useLocation } from '@/hooks/useLocation';
import { useIsAuthenticated, useUser } from '@/stores/authStore';
import {
  REPORT_TYPE_LABELS, REPORT_SEVERITY_LABELS, REPORT_SEVERITY_COLORS,
} from '@/lib/constants/labels';
import { colors } from '@/config/colors';
import type { ReportType, ReportSeverity } from '@/types/database';

// ============================================================
// Écran Nouveau signalement
// ============================================================

const REPORT_TYPES: ReportType[] = [
  'POTHOLE', 'OBSTACLE', 'WATER_ACCUMULATION', 'ICE', 'FALLEN_TREE',
  'ROAD_HAZARD', 'DANGEROUS_GRAVEL', 'POOR_LIGHTING',
  'ANIMALS', 'CONSTRUCTION', 'MUD', 'TRAIL_CLOSED',
  'UNSAFE_AREA', 'OTHER',
];

const SEVERITIES: ReportSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function NewReportScreen() {
  const { trailId } = useLocalSearchParams<{ trailId?: string }>();
  const { location, hasPermission, error: locationError } = useLocation();
  const isAuthenticated = useIsAuthenticated();
  const user = useUser();
  const qc = useQueryClient();
  const [imageUri, setImageUri] = useState<string | null>(null);

  const {
    control, handleSubmit, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateReportFormData>({
    resolver: zodResolver(createReportSchema),
    defaultValues: {
      type: undefined,
      title: '',
      description: '',
      severity: 'MEDIUM',
      latitude: location?.latitude ?? 0,
      longitude: location?.longitude ?? 0,
      trail_id: trailId ?? null,
    },
  });

  // Mise à jour coordonnées depuis GPS
  useEffect(() => {
    if (location) {
      setValue('latitude', location.latitude);
      setValue('longitude', location.longitude);
    }
  }, [location, setValue]);

  const selectedType = watch('type');
  const selectedSeverity = watch('severity');

  const mutation = useMutation({
    mutationFn: (data: CreateReportFormData) =>
      createReport({ ...data, image_uri: imageUri ?? undefined }, user!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports'] });
      router.back();
    },
  });

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F8F5' }}>
        <View className="flex-1 items-center justify-center px-8 gap-6">
          <AlertTriangle size={48} color={colors.warning} />
          <Text className="text-xl font-bold text-carbon text-center">
            Connexion requise
          </Text>
          <Text className="text-slate text-base text-center">
            Tu dois être connecté pour signaler un problème.
          </Text>
          <AppButton
            label="Se connecter"
            onPress={() => router.push('/auth/login')}
            fullWidth
          />
        </View>
      </SafeAreaView>
    );
  }

  async function handlePickImage() {
    const result = await pickImageFromLibrary();
    if (result.success && result.data) setImageUri(result.data);
  }

  async function handleTakePhoto() {
    const result = await takePhoto();
    if (result.success && result.data) setImageUri(result.data);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F8F5' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
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
          <Text className="text-lg font-bold text-carbon flex-1">Signaler un problème</Text>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Localisation */}
          <View className="bg-sky/10 rounded-2xl p-3 flex-row items-center gap-2">
            <MapPin size={16} color={colors.sky} />
            <Text className="text-sky text-sm flex-1">
              {hasPermission === false || locationError
                ? 'Localisation indisponible. Active la permission de localisation pour placer le signalement.'
                : location
                ? `Position GPS : ${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}`
                : 'En attente du GPS...'}
            </Text>
          </View>

          {/* Type de signalement */}
          <View>
            <Text className="text-sm font-semibold text-carbon mb-3">
              Type de problème <Text className="text-danger">*</Text>
            </Text>
            <Controller
              control={control}
              name="type"
              render={({ field: { onChange } }) => (
                <View className="flex-row flex-wrap gap-2">
                  {REPORT_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type}
                      onPress={() => onChange(type)}
                      className={`rounded-full px-3 py-1.5 border ${
                        selectedType === type
                          ? 'bg-primary-600 border-primary-600'
                          : 'bg-white border-border'
                      }`}
                      accessibilityRole="button"
                      accessibilityLabel={`Choisir le type ${REPORT_TYPE_LABELS[type]}`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          selectedType === type ? 'text-white' : 'text-carbon'
                        }`}
                      >
                        {REPORT_TYPE_LABELS[type]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
            {errors.type && (
              <Text className="text-danger text-xs mt-1">{errors.type.message}</Text>
            )}
          </View>

          {/* Sévérité */}
          <View>
            <Text className="text-sm font-semibold text-carbon mb-3">
              Sévérité <Text className="text-danger">*</Text>
            </Text>
            <Controller
              control={control}
              name="severity"
              render={({ field: { onChange } }) => (
                <View className="flex-row gap-2">
                  {SEVERITIES.map((sev) => (
                    <TouchableOpacity
                      key={sev}
                      onPress={() => onChange(sev)}
                      className={`flex-1 rounded-xl py-3 items-center border-2 ${
                        selectedSeverity === sev ? 'border-transparent' : 'border-transparent bg-white'
                      }`}
                      style={
                        selectedSeverity === sev
                          ? { backgroundColor: REPORT_SEVERITY_COLORS[sev] }
                          : { borderColor: REPORT_SEVERITY_COLORS[sev], borderWidth: 2 }
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Choisir la sévérité ${REPORT_SEVERITY_LABELS[sev]}`}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          selectedSeverity === sev ? 'text-white' : 'text-carbon'
                        }`}
                      >
                        {REPORT_SEVERITY_LABELS[sev]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>

          {/* Titre */}
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, value, onBlur } }) => (
              <AppInput
                label="Titre *"
                placeholder="Ex. : Grosse flaque d'eau au km 3"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.title?.message}
              />
            )}
          />

          {/* Description */}
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value, onBlur } }) => (
              <AppInput
                label="Description (facultatif)"
                placeholder="Décris le problème en détail..."
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.description?.message}
                multiline
                numberOfLines={3}
              />
            )}
          />

          {/* Photo */}
          <View>
            <Text className="text-sm font-semibold text-carbon mb-3">Photo (facultatif)</Text>
            {imageUri ? (
              <View className="relative">
                <Image
                  source={{ uri: imageUri }}
                  style={{ width: '100%', height: 180, borderRadius: 16 }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setImageUri(null)}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full items-center justify-center"
                  accessibilityRole="button"
                  accessibilityLabel="Retirer la photo"
                >
                  <X size={14} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={handleTakePhoto}
                  className="flex-1 bg-white border border-border rounded-2xl py-5 items-center gap-2"
                  accessibilityRole="button"
                  accessibilityLabel="Prendre une photo"
                >
                  <Camera size={20} color={colors.textSecondary} />
                  <Text className="text-xs text-slate">Prendre une photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePickImage}
                  className="flex-1 bg-white border border-border rounded-2xl py-5 items-center gap-2"
                  accessibilityRole="button"
                  accessibilityLabel="Choisir une photo depuis la galerie"
                >
                  <Camera size={20} color={colors.textSecondary} />
                  <Text className="text-xs text-slate">Choisir depuis la galerie</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Erreur serveur */}
          {mutation.isError && (
            <View className="bg-danger/10 rounded-xl p-3">
              <Text className="text-danger text-sm">
                Une erreur est survenue. Réessaie.
              </Text>
            </View>
          )}

          {/* Bouton soumettre */}
          <AppButton
            label="Envoyer le signalement"
            onPress={handleSubmit((data) => mutation.mutate(data))}
            loading={isSubmitting || mutation.isPending}
            fullWidth
            size="lg"
            variant="primary"
            icon={<AlertTriangle size={16} color="white" />}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
