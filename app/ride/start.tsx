import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Play, Cloud, AlertTriangle,
  CheckCircle,
} from 'lucide-react-native';
import { getTrailById } from '@/features/trails/trailService';
import { getTrailWeather } from '@/features/weather/weatherService';
import { generateRideAdvice } from '@/features/advice/adviceEngine';
import { getNearbyReports } from '@/features/reports/reportService';
import { WeatherCard } from '@/components/weather/WeatherCard';
import { SafetyAdviceCard } from '@/components/ui/SafetyAdviceCard';
import { DifficultyBadge } from '@/components/ui/AppBadge';
import { LoadingState } from '@/components/ui/LoadingState';
import { useProfile } from '@/stores/authStore';
import { useLocation } from '@/hooks/useLocation';
import { formatDistance, formatDuration } from '@/lib/geo/geoUtils';
import { colors } from '@/config/colors';
import type { AdviceInput } from '@/features/advice/adviceEngine';

// ============================================================
// Écran Préparation — Avant de démarrer une sortie
// ============================================================

export default function RideStartScreen() {
  const { trailId } = useLocalSearchParams<{ trailId?: string }>();
  const profile = useProfile();
  const { location } = useLocation();

  const trailQuery = useQuery({
    queryKey: ['trail', trailId],
    queryFn: () => getTrailById(trailId!),
    enabled: !!trailId,
    staleTime: 1000 * 60 * 5,
  });

  const trail = trailQuery.data?.data;

  const lat = trail?.start_latitude ?? location?.latitude;
  const lng = trail?.start_longitude ?? location?.longitude;

  const weatherQuery = useQuery({
    queryKey: ['weather-start', lat, lng],
    queryFn: () => getTrailWeather(lat!, lng!),
    enabled: !!(lat && lng),
    staleTime: 1000 * 60 * 10,
  });

  const reportsQuery = useQuery({
    queryKey: ['reports-start', lat, lng],
    queryFn: () => getNearbyReports(lat!, lng!, 5),
    enabled: !!(lat && lng),
    staleTime: 1000 * 60 * 5,
  });

  const advice = useMemo(() => {
    if (!weatherQuery.data?.data || !trail) return null;
    const input: AdviceInput = {
      weather: weatherQuery.data.data,
      trail: {
        difficulty: trail.difficulty,
        distance_km: trail.distance_km ?? 0,
        elevation_gain_m: trail.elevation_gain_m ?? 0,
        surface_type: trail.surface_type,
        trail_type: trail.trail_type,
        estimated_duration_minutes: trail.estimated_duration_minutes,
      },
      userLevel: profile?.cycling_level ?? 'BEGINNER',
      bikeType: profile?.primary_bike_type ?? 'HYBRID',
      activeReports: reportsQuery.data?.data ?? [],
      departureHour: new Date().getHours(),
      comfortableDistanceKm: profile?.comfortable_distance_km ?? 30,
    };
    return generateRideAdvice(input);
  }, [weatherQuery.data, reportsQuery.data, trail, profile]);

  const isLoading = trailQuery.isLoading || weatherQuery.isLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F8F5' }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 gap-3">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-white rounded-full items-center justify-center border border-border"
        >
          <ArrowLeft size={20} color={colors.carbon} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold text-carbon">Préparer la sortie</Text>
          {trail && (
            <Text className="text-xs text-slate" numberOfLines={1}>{trail.name}</Text>
          )}
        </View>
      </View>

      {isLoading ? (
        <LoadingState message="Analyse des conditions..." fullScreen />
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Résumé de la piste */}
          {trail && (
            <View className="bg-white rounded-2xl p-4 border border-border gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-bold text-carbon flex-1" numberOfLines={2}>
                  {trail.name}
                </Text>
                <DifficultyBadge difficulty={trail.difficulty} />
              </View>
              <View className="flex-row gap-4">
                <View className="items-center flex-1">
                  <Text className="text-carbon font-bold">{formatDistance(trail.distance_km ?? 0)}</Text>
                  <Text className="text-xs text-slate">Distance</Text>
                </View>
                <View className="items-center flex-1">
                  <Text className="text-carbon font-bold">
                    {formatDuration((trail.estimated_duration_minutes ?? 0) * 60)}
                  </Text>
                  <Text className="text-xs text-slate">Durée est.</Text>
                </View>
                <View className="items-center flex-1">
                  <Text className="text-carbon font-bold">
                    {Math.round(trail.elevation_gain_m ?? 0)} m
                  </Text>
                  <Text className="text-xs text-slate">Dénivelé</Text>
                </View>
              </View>
            </View>
          )}

          {/* Météo */}
          {weatherQuery.data?.data ? (
            <View>
              <SectionTitle icon={<Cloud size={16} color={colors.sky} />} title="Conditions météo" />
              <WeatherCard weather={weatherQuery.data.data} compact />
            </View>
          ) : (
            <View className="bg-white rounded-2xl p-4 border border-border flex-row items-center gap-3">
              <Cloud size={20} color={colors.textSecondary} />
              <Text className="text-slate text-sm">Météo indisponible</Text>
            </View>
          )}

          {/* Signalements proches */}
          {(reportsQuery.data?.data ?? []).length > 0 && (
            <View className="bg-warning/10 rounded-2xl p-4 border border-warning/30 gap-2">
              <View className="flex-row items-center gap-2">
                <AlertTriangle size={16} color={colors.warning} />
                <Text className="text-warning font-semibold text-sm">
                  {reportsQuery.data!.data!.length} signalement(s) actif(s) à proximité
                </Text>
              </View>
              {reportsQuery.data!.data!.slice(0, 2).map((r: any) => (
                <Text key={r.id} className="text-xs text-carbon ml-6" numberOfLines={1}>
                  · {r.title}
                </Text>
              ))}
            </View>
          )}

          {/* Conseils de sécurité */}
          {advice && (
            <View>
              <SectionTitle
                icon={<CheckCircle size={16} color={colors.primary.DEFAULT} />}
                title="Conseils avant le départ"
              />
              <SafetyAdviceCard advice={advice} />
            </View>
          )}

          {/* Bouton Démarrer */}
          <TouchableOpacity
            onPress={() =>
              router.replace({
                pathname: '/ride/active',
                params: trailId ? { trailId } : {},
              })
            }
            className="bg-primary-600 rounded-2xl py-5 flex-row items-center justify-center gap-3 mt-2"
            activeOpacity={0.85}
          >
            <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
              <Play size={22} color="white" fill="white" />
            </View>
            <View>
              <Text className="text-white font-black text-lg">C'est parti !</Text>
              <Text className="text-white/70 text-xs">Démarrer le suivi GPS</Text>
            </View>
          </TouchableOpacity>

          {/* Sortie libre */}
          {!trailId && (
            <TouchableOpacity
              onPress={() => router.replace('/ride/active')}
              className="py-3 items-center"
            >
              <Text className="text-slate text-sm">
                Démarrer sans sélectionner de piste →
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <View className="flex-row items-center gap-2 mb-3">
      {icon}
      <Text className="text-sm font-bold text-carbon">{title}</Text>
    </View>
  );
}
