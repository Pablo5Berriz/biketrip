import React, { useState } from 'react';
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  SafeAreaView, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Activity, Clock, TrendingUp, MapPin,
  Calendar, Play,
} from 'lucide-react-native';
import { getRideHistory, getRideStats } from '@/features/rides/rideService';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useIsAuthenticated, useUser } from '@/stores/authStore';
import { formatDistance, formatDuration } from '@/lib/geo/geoUtils';
import { colors } from '@/config/colors';
import type { PlannedRide, Ride, Trail } from '@/types/database';

// ============================================================
// Écran Sorties — Historique & statistiques
// ============================================================

const TABS = ['Historique', 'Statistiques'] as const;
type Tab = typeof TABS[number];
type RideHistoryItem = Ride & { trails?: Pick<Trail, 'name' | 'difficulty'> | null };
type RideStats = {
  totalRides: number;
  totalDistanceKm: number;
  totalDurationSeconds: number;
  totalElevationGainM: number;
  // BIKETRIP-P0-RIDE-001 : getRideStats() calcule désormais réellement
  // ces deux champs (non-optionnels côté service) ; le "?? 0" ci-dessous
  // reste une garde d'affichage, pas un masquage d'un champ absent.
  maxSpeedKmh: number;
  averageSpeedKmh: number;
  // Non calculé par getRideStats() dans ce lot (planification de sortie
  // hors périmètre BIKETRIP-P0-RIDE-001) — StatsTab gère déjà son
  // absence via (stats.plannedRides ?? []).
  plannedRides?: PlannedRideItem[];
};
type PlannedRideItem = PlannedRide & { trails?: Pick<Trail, 'name'> | null };

export default function RidesScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('Historique');
  const isAuthenticated = useIsAuthenticated();
  const user = useUser();

  const ridesQuery = useQuery({
    queryKey: ['rides', 'history'],
    queryFn: () => getRideHistory(user!.id),
    enabled: isAuthenticated && !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const statsQuery = useQuery({
    queryKey: ['rides', 'stats'],
    queryFn: () => getRideStats(user!.id),
    enabled: isAuthenticated && !!user?.id && activeTab === 'Statistiques',
    staleTime: 1000 * 60 * 10,
  });

  const rides = ridesQuery.data?.data ?? [];
  const stats = statsQuery.data?.data ?? undefined;

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F8F5' }}>
        <View className="px-5 pt-5 pb-3">
          <Text className="text-2xl font-black text-carbon">Sorties</Text>
        </View>
        <EmptyState
          title="Connecte-toi pour voir tes sorties"
          description="Ton historique de sorties et tes statistiques t'attendent."
          actionLabel="Se connecter"
          onAction={() => router.push('/auth/login')}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F8F5' }}>
      {/* Header */}
      <View className="px-5 pt-5 pb-3 gap-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-black text-carbon">Sorties</Text>
          <TouchableOpacity
            onPress={() => router.push('/ride/start')}
            className="flex-row items-center gap-2 bg-primary-600 rounded-full px-4 py-2"
            accessibilityRole="button"
            accessibilityLabel="Démarrer une sortie"
          >
            <Play size={14} color="white" fill="white" />
            <Text className="text-white text-sm font-bold">Démarrer</Text>
          </TouchableOpacity>
        </View>

        {/* Onglets */}
        <View className="flex-row bg-white rounded-xl border border-border p-1">
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-lg items-center ${
                activeTab === tab ? 'bg-primary-600' : ''
              }`}
              accessibilityRole="button"
              accessibilityLabel={`Afficher l'onglet ${tab}`}
            >
              <Text
                className={`text-sm font-semibold ${
                  activeTab === tab ? 'text-white' : 'text-slate'
                }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {activeTab === 'Historique' ? (
        <HistoryTab
          rides={rides}
          isLoading={ridesQuery.isLoading}
          onRefresh={ridesQuery.refetch}
          isRefreshing={ridesQuery.isFetching}
        />
      ) : (
        <StatsTab stats={stats} isLoading={statsQuery.isLoading} />
      )}
    </SafeAreaView>
  );
}

// ─── Onglet Historique ────────────────────────────────────────

function HistoryTab({
  rides, isLoading, onRefresh, isRefreshing,
}: {
  rides: RideHistoryItem[];
  isLoading: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  if (isLoading) return <LoadingState message="Chargement de l'historique..." fullScreen />;

  if (rides.length === 0) {
    return (
      <EmptyState
        title="Aucune sortie enregistrée"
        description="Lance ta première sortie pour voir ton historique ici."
        actionLabel="Démarrer une sortie"
        onAction={() => router.push('/ride/start')}
      />
    );
  }

  return (
    <FlatList
      data={rides}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 12 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary.DEFAULT}
        />
      }
      ListHeaderComponent={
        <Text className="text-sm text-slate py-2">
          {rides.length} sortie{rides.length > 1 ? 's' : ''}
        </Text>
      }
      renderItem={({ item }) => <RideHistoryCard ride={item} />}
    />
  );
}

function RideHistoryCard({ ride }: { ride: RideHistoryItem }) {
  const date = format(new Date(ride.started_at), 'EEEE d MMMM yyyy', { locale: fr });
  const time = format(new Date(ride.started_at), 'HH:mm', { locale: fr });

  return (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/ride/summary', params: { rideId: ride.id } })}
      className="bg-white rounded-2xl p-4 border border-border"
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Ouvrir le résumé de cette sortie"
    >
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="text-sm text-slate capitalize">{date}</Text>
          <Text className="text-base font-bold text-carbon mt-0.5" numberOfLines={1}>
            {ride.trails?.name ?? 'Sortie libre'}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Clock size={12} color={colors.textSecondary} />
          <Text className="text-xs text-slate">{time}</Text>
        </View>
      </View>

      <View className="flex-row gap-4">
        <StatMini
          icon={<Activity size={14} color={colors.primary.DEFAULT} />}
          value={formatDistance(ride.distance_km ?? 0)}
          label="Distance"
        />
        <StatMini
          icon={<Clock size={14} color={colors.sky} />}
          value={formatDuration(ride.duration_seconds ?? 0)}
          label="Durée"
        />
        <StatMini
          icon={<TrendingUp size={14} color={colors.elevation} />}
          value={`${Math.round(ride.elevation_gain_m ?? 0)} m`}
          label="Dénivelé"
        />
        {ride.average_speed_kmh != null && (
          <StatMini
            icon={<MapPin size={14} color={colors.accent.DEFAULT} />}
            value={`${ride.average_speed_kmh.toFixed(1)} km/h`}
            label="Moy."
          />
        )}
      </View>

      {ride.notes && (
        <Text className="text-xs text-slate mt-3 italic" numberOfLines={2}>
          {ride.notes}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function StatMini({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View className="items-center gap-0.5 flex-1">
      {icon}
      <Text className="text-sm font-bold text-carbon">{value}</Text>
      <Text className="text-xs text-slate">{label}</Text>
    </View>
  );
}

// ─── Onglet Statistiques ──────────────────────────────────────

function StatsTab({ stats, isLoading }: { stats?: RideStats; isLoading: boolean }) {
  if (isLoading) return <LoadingState message="Calcul des statistiques..." fullScreen />;

  if (!stats) {
    return (
      <EmptyState
        title="Pas encore de statistiques"
        description="Complète au moins une sortie pour voir tes statistiques."
        actionLabel="Démarrer une sortie"
        onAction={() => router.push('/ride/start')}
      />
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Total global */}
      <View className="bg-primary-600 rounded-2xl p-5 mb-4">
        <Text className="text-white/70 text-sm mb-1">Distance totale</Text>
        <Text className="text-white text-4xl font-black">
          {formatDistance(stats.totalDistanceKm ?? 0)}
        </Text>
        <Text className="text-white/70 text-sm mt-1">
          En {stats.totalRides ?? 0} sortie{(stats.totalRides ?? 0) > 1 ? 's' : ''}
        </Text>
      </View>

      <View className="flex-row gap-3 mb-4">
        <StatCard
          label="Temps en selle"
          value={formatDuration(stats.totalDurationSeconds ?? 0)}
          icon={<Clock size={20} color={colors.sky} />}
          color={colors.sky}
        />
        <StatCard
          label="Dénivelé positif"
          value={`${Math.round(stats.totalElevationGainM ?? 0)} m`}
          icon={<TrendingUp size={20} color={colors.elevation} />}
          color={colors.elevation}
        />
      </View>

      <View className="flex-row gap-3 mb-4">
        <StatCard
          label="Vitesse max"
          value={`${(stats.maxSpeedKmh ?? 0).toFixed(1)} km/h`}
          icon={<Activity size={20} color={colors.accent.DEFAULT} />}
          color={colors.accent.DEFAULT}
        />
        <StatCard
          label="Vitesse moy."
          value={`${(stats.averageSpeedKmh ?? 0).toFixed(1)} km/h`}
          icon={<Activity size={20} color={colors.primary.DEFAULT} />}
          color={colors.primary.DEFAULT}
        />
      </View>

      {/* Sorties planifiées */}
      <View className="mt-2">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-base font-bold text-carbon">Sorties planifiées</Text>
        </View>

        {(stats.plannedRides ?? []).length === 0 ? (
          <View className="bg-white rounded-2xl p-5 border border-border items-center gap-3">
            <Calendar size={28} color={colors.textSecondary} />
            <Text className="text-slate text-sm text-center">
              Aucune sortie planifiée.
            </Text>
          </View>
        ) : (
          (stats.plannedRides ?? []).map((p) => (
            <View key={p.id} className="bg-white rounded-2xl p-4 border border-border mb-3">
              <Text className="text-sm font-bold text-carbon">{p.trails?.name ?? 'Piste inconnue'}</Text>
              <Text className="text-xs text-slate mt-1">
                {format(new Date(`${p.planned_date}T${p.planned_time ?? '00:00'}`), 'EEEE d MMMM à HH:mm', { locale: fr })}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function StatCard({
  label, value, icon, color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <View className="flex-1 bg-white rounded-2xl p-4 border border-border gap-2">
      <View
        className="w-10 h-10 rounded-xl items-center justify-center"
        style={{ backgroundColor: `${color}18` }}
      >
        {icon}
      </View>
      <Text className="text-xl font-black text-carbon">{value}</Text>
      <Text className="text-xs text-slate">{label}</Text>
    </View>
  );
}
