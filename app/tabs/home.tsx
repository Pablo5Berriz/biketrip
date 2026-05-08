import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin, Play, AlertTriangle, ChevronRight,
  CloudRain,
} from 'lucide-react-native';
import { WeatherCard } from '@/components/weather/WeatherCard';
import { TrailCard } from '@/components/trails/TrailCard';
import { ReportCard } from '@/components/reports/ReportCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { useProfile } from '@/stores/authStore';
import { useLocation } from '@/hooks/useLocation';
import { getCurrentWeather } from '@/features/weather/weatherService';
import { getNearbyTrails } from '@/features/trails/trailService';
import { getNearbyReports } from '@/features/reports/reportService';
import { colors } from '@/config/colors';

// ============================================================
// Écran Accueil BikeTrip
// ============================================================

export default function HomeScreen() {
  const profile = useProfile();
  const { location } = useLocation();

  const weatherQuery = useQuery({
    queryKey: ['weather', location?.latitude, location?.longitude],
    queryFn: () => getCurrentWeather(location!.latitude, location!.longitude),
    enabled: !!location,
    staleTime: 1000 * 60 * 10,
  });

  const nearbyTrailsQuery = useQuery({
    queryKey: ['trails', 'nearby', location?.latitude, location?.longitude],
    queryFn: () => getNearbyTrails(location!.latitude, location!.longitude, 20),
    enabled: !!location,
  });

  const nearbyReportsQuery = useQuery({
    queryKey: ['reports', 'nearby', location?.latitude, location?.longitude],
    queryFn: () => getNearbyReports(location!.latitude, location!.longitude, 5),
    enabled: !!location,
  });

  const isRefreshing = weatherQuery.isFetching || nearbyTrailsQuery.isFetching;

  function onRefresh() {
    weatherQuery.refetch();
    nearbyTrailsQuery.refetch();
    nearbyReportsQuery.refetch();
  }

  const greeting = getGreeting();
  const firstName = profile?.full_name?.split(' ')[0] ?? 'cycliste';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F8F5' }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary.DEFAULT}
          />
        }
      >
        {/* Header */}
        <View className="px-5 pt-5 pb-4 gap-1">
          <Text className="text-sm text-slate">{greeting}</Text>
          <Text className="text-2xl font-black text-carbon">
            Bonjour, {firstName} 👋
          </Text>
        </View>

        {/* Météo */}
        <View className="px-5 mb-5">
          {weatherQuery.isLoading ? (
            <View className="h-36 bg-sky/10 rounded-2xl items-center justify-center">
              <LoadingState message="Météo en cours..." />
            </View>
          ) : weatherQuery.data?.data ? (
            <WeatherCard weather={weatherQuery.data.data} />
          ) : (
            <View className="h-28 bg-sky/10 rounded-2xl items-center justify-center flex-row gap-2">
              <CloudRain size={20} color={colors.sky} />
              <Text className="text-slate text-sm">Météo indisponible</Text>
            </View>
          )}
        </View>

        {/* Actions rapides */}
        <View className="px-5 mb-5 flex-row gap-3">
          <TouchableOpacity
            onPress={() => router.push('/ride/start')}
            className="flex-1 bg-primary-600 rounded-2xl p-4 flex-row items-center gap-3"
            activeOpacity={0.85}
          >
            <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
              <Play size={20} color="white" fill="white" />
            </View>
            <View>
              <Text className="text-white font-bold text-base">Démarrer</Text>
              <Text className="text-white/70 text-xs">une sortie</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(tabs)/map')}
            className="flex-1 bg-secondary-600 rounded-2xl p-4 flex-row items-center gap-3"
            activeOpacity={0.85}
          >
            <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
              <MapPin size={20} color="white" />
            </View>
            <View>
              <Text className="text-white font-bold text-base">Trouver</Text>
              <Text className="text-white/70 text-xs">une piste</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Signalements proches */}
        {(nearbyReportsQuery.data?.data ?? []).length > 0 && (
          <View className="mb-5">
            <View className="px-5 flex-row items-center justify-between mb-3">
              <View className="flex-row items-center gap-2">
                <AlertTriangle size={18} color={colors.accent.DEFAULT} />
                <Text className="text-base font-bold text-carbon">
                  Signalements proches
                </Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
              {(nearbyReportsQuery.data?.data ?? []).slice(0, 5).map((report) => (
                <View key={report.id} style={{ width: 280 }}>
                  <ReportCard
                    report={report}
                    compact
                    onPress={() => router.push(`/reports/${report.id}`)}
                  />
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Pistes proches */}
        <View className="mb-5">
          <View className="px-5 flex-row items-center justify-between mb-3">
            <Text className="text-base font-bold text-carbon">Pistes proches</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/discover')}
              className="flex-row items-center gap-1"
            >
              <Text className="text-primary-600 text-sm font-medium">Voir tout</Text>
              <ChevronRight size={16} color={colors.primary.DEFAULT} />
            </TouchableOpacity>
          </View>

          {nearbyTrailsQuery.isLoading ? (
            <LoadingState message="Recherche des pistes..." />
          ) : (nearbyTrailsQuery.data?.data ?? []).length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
              {(nearbyTrailsQuery.data?.data ?? []).slice(0, 5).map((trail) => (
                <View key={trail.id} style={{ width: 220 }}>
                  <TrailCard
                    trail={trail}
                    compact
                    onPress={() => router.push(`/trails/${trail.id}`)}
                  />
                </View>
              ))}
            </ScrollView>
          ) : (
            <View className="px-5">
              <View className="bg-white rounded-2xl p-5 items-center gap-3 border border-border">
                <MapPin size={32} color={colors.textSecondary} />
                <Text className="text-slate text-sm text-center">
                  Aucune piste trouvée dans un rayon de 20 km.{'\n'}Active la localisation pour de meilleurs résultats.
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bonne matinée ☀️';
  if (h < 18) return 'Bon après-midi 🚴';
  return 'Bonne soirée 🌙';
}
