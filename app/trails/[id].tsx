import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, Image, Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft, Heart, Share2, Play,
  MapPin, Clock, TrendingUp, Star,
  AlertTriangle, Navigation, CheckCircle,
} from 'lucide-react-native';
import { getTrailById, getTrailReviews, getTrailReports, getTrailPois } from '@/features/trails/trailService';
import { getTrailWeather } from '@/features/weather/weatherService';
import { generateRideAdvice } from '@/features/advice/adviceEngine';
import { addFavorite, removeFavorite, isFavorite } from '@/features/favorites/favoriteService';
import { WeatherCard } from '@/components/weather/WeatherCard';
import { ReportCard } from '@/components/reports/ReportCard';
import { SafetyAdviceCard } from '@/components/ui/SafetyAdviceCard';
import { DifficultyBadge, SurfaceBadge } from '@/components/ui/AppBadge';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useProfile, useIsAuthenticated } from '@/stores/authStore';
import { formatDistance, formatDuration } from '@/lib/geo/geoUtils';
import { TRAIL_TYPE_LABELS, POI_TYPE_LABELS } from '@/lib/constants/labels';
import { colors } from '@/config/colors';
import type { AdviceInput } from '@/features/advice/adviceEngine';
import type { PointOfInterest, Trail } from '@/types/database';

// ============================================================
// Écran Détail d'une piste
// ============================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TABS = ['Infos', 'Météo', 'Signalements', 'Avis'] as const;
type Tab = typeof TABS[number];

export default function TrailDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('Infos');
  const isAuthenticated = useIsAuthenticated();
  const profile = useProfile();

  const trailQuery = useQuery({
    queryKey: ['trail', id],
    queryFn: () => getTrailById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });

  const weatherQuery = useQuery({
    queryKey: ['trail-weather', id],
    queryFn: () => {
      const t = trailQuery.data?.data;
      return t ? getTrailWeather(t.start_latitude, t.start_longitude) : null;
    },
    enabled: !!trailQuery.data?.data && activeTab === 'Météo',
    staleTime: 1000 * 60 * 15,
  });

  const reportsQuery = useQuery({
    queryKey: ['trail-reports', id],
    queryFn: () => getTrailReports(id!),
    enabled: !!id && activeTab === 'Signalements',
    staleTime: 1000 * 60 * 5,
  });

  const reviewsQuery = useQuery({
    queryKey: ['trail-reviews', id],
    queryFn: () => getTrailReviews(id!),
    enabled: !!id && activeTab === 'Avis',
    staleTime: 1000 * 60 * 5,
  });

  const poisQuery = useQuery({
    queryKey: ['trail-pois', id],
    queryFn: () => getTrailPois(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 10,
  });

  const favoriteQuery = useQuery({
    queryKey: ['favorite', id],
    queryFn: () => (profile?.id ? isFavorite(profile.id, id!) : false),
    enabled: !!id && isAuthenticated,
    staleTime: 1000 * 60 * 2,
    initialData: false,
  });

  const trail = trailQuery.data?.data;

  // Génération des conseils
  const advice = React.useMemo(() => {
    if (!trail || !weatherQuery.data?.data) return null;
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
  }, [trail, weatherQuery.data, reportsQuery.data, profile]);

  async function toggleFavorite() {
    if (!isAuthenticated || !id) {
      router.push('/auth/login');
      return;
    }
    if (!profile?.id) return;
    const isFav = favoriteQuery.data ?? false;
    if (isFav) {
      await removeFavorite(profile.id, id);
    } else {
      await addFavorite(profile.id, id);
    }
    favoriteQuery.refetch();
  }

  if (trailQuery.isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F8F5' }}>
        <LoadingState message="Chargement de la piste..." fullScreen />
      </SafeAreaView>
    );
  }

  if (!trail) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F8F5' }}>
        <EmptyState title="Piste introuvable" description="Cette piste n'existe pas ou a été supprimée." />
      </SafeAreaView>
    );
  }

  const isFav = favoriteQuery.data ?? false;
  const pois = poisQuery.data?.data ?? [];
  const reviews = reviewsQuery.data?.data ?? [];
  const reports = reportsQuery.data?.data ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: '#F4F8F5' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero image */}
        <View style={{ height: 280, width: SCREEN_WIDTH }}>
          {trail.cover_image_url ? (
            <Image
              source={{ uri: trail.cover_image_url }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={['#16A34A', '#0EA5E9']}
              style={{ width: '100%', height: '100%' }}
            />
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.6)']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
          />

          {/* Boutons overlay */}
          <SafeAreaView style={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
            <View className="flex-row items-center justify-between px-4 pt-2">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 bg-black/30 rounded-full items-center justify-center"
              >
                <ArrowLeft size={20} color="white" />
              </TouchableOpacity>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={toggleFavorite}
                  className="w-10 h-10 bg-black/30 rounded-full items-center justify-center"
                >
                  <Heart
                    size={20}
                    color="white"
                    fill={isFav ? 'white' : 'transparent'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  className="w-10 h-10 bg-black/30 rounded-full items-center justify-center"
                >
                  <Share2 size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>

          {/* Infos hero bas */}
          <View className="absolute bottom-0 left-0 right-0 px-5 pb-5">
            <View className="flex-row gap-2 mb-2">
              <DifficultyBadge difficulty={trail.difficulty} />
              <SurfaceBadge surface={trail.surface_type} />
              <View className="bg-white/20 rounded-full px-3 py-1">
                <Text className="text-white text-xs font-semibold">
                  {TRAIL_TYPE_LABELS[trail.trail_type]}
                </Text>
              </View>
            </View>
            <Text className="text-white text-2xl font-black" numberOfLines={2}>
              {trail.name}
            </Text>
            {trail.city && (
              <View className="flex-row items-center gap-1 mt-1">
                <MapPin size={12} color="rgba(255,255,255,0.8)" />
                <Text className="text-white/80 text-xs">{trail.city}{trail.region ? `, ${trail.region}` : ''}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Stats rapides */}
        <View className="bg-white mx-4 -mt-4 rounded-2xl p-4 shadow-card flex-row" style={{ elevation: 4 }}>
          <QuickStat
            icon={<Navigation size={16} color={colors.primary.DEFAULT} />}
            value={formatDistance(trail.distance_km ?? 0)}
            label="Distance"
          />
          <View className="w-px bg-border mx-2 self-stretch" />
          <QuickStat
            icon={<Clock size={16} color={colors.sky} />}
            value={formatDuration((trail.estimated_duration_minutes ?? 0) * 60)}
            label="Durée"
          />
          <View className="w-px bg-border mx-2 self-stretch" />
          <QuickStat
            icon={<TrendingUp size={16} color={colors.elevation} />}
            value={`${Math.round(trail.elevation_gain_m ?? 0)} m`}
            label="Dénivelé"
          />
          {trail.average_rating != null && (
            <>
              <View className="w-px bg-border mx-2 self-stretch" />
              <QuickStat
                icon={<Star size={16} color="#F59E0B" fill="#F59E0B" />}
                value={trail.average_rating.toFixed(1)}
                label={`${reviews.length} avis`}
              />
            </>
          )}
        </View>

        {/* CTA Démarrer */}
        <View className="px-4 mt-4">
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/ride/start', params: { trailId: trail.id } })}
            className="bg-primary-600 rounded-2xl py-4 flex-row items-center justify-center gap-3"
            activeOpacity={0.85}
          >
            <Play size={20} color="white" fill="white" />
            <Text className="text-white font-bold text-base">Démarrer cette piste</Text>
          </TouchableOpacity>
        </View>

        {/* Onglets */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4"
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        >
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={`rounded-full px-5 py-2.5 ${
                activeTab === tab ? 'bg-primary-600' : 'bg-white border border-border'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  activeTab === tab ? 'text-white' : 'text-carbon'
                }`}
              >
                {tab}
                {tab === 'Signalements' && reports.length > 0 ? ` (${reports.length})` : ''}
                {tab === 'Avis' && reviews.length > 0 ? ` (${reviews.length})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Contenu onglet */}
        <View className="px-4 mt-4 pb-8">
          {activeTab === 'Infos' && (
            <InfoTab trail={trail} pois={pois} />
          )}
          {activeTab === 'Météo' && (
            <MeteoTab
              weather={weatherQuery.data?.data}
              isLoading={weatherQuery.isLoading}
              advice={advice}
            />
          )}
          {activeTab === 'Signalements' && (
            <ReportsTab
              reports={reports}
              isLoading={reportsQuery.isLoading}
              trailId={trail.id}
            />
          )}
          {activeTab === 'Avis' && (
            <ReviewsTab
              reviews={reviews}
              isLoading={reviewsQuery.isLoading}
              trailId={trail.id}
              trail={trail}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Onglet Infos ─────────────────────────────────────────────

function InfoTab({ trail, pois }: { trail: Trail; pois: PointOfInterest[] }) {
  return (
    <View className="gap-4">
      {/* Description */}
      {trail.description && (
        <View className="bg-white rounded-2xl p-4 border border-border">
          <Text className="text-sm text-slate font-semibold mb-2">Description</Text>
          <Text className="text-carbon text-sm leading-6">{trail.description}</Text>
        </View>
      )}

      {/* Caractéristiques */}
      <View className="bg-white rounded-2xl p-4 border border-border gap-3">
        <Text className="text-sm text-slate font-semibold">Caractéristiques</Text>
        <CharRow label="Type" value={TRAIL_TYPE_LABELS[trail.trail_type]} />
        {trail.surface_type && (
          <CharRow label="Surface" value={trail.surface_type} />
        )}
        {trail.distance_km != null && (
          <CharRow label="Distance" value={formatDistance(trail.distance_km)} />
        )}
        {trail.elevation_gain_m != null && (
          <CharRow label="Dénivelé +" value={`${Math.round(trail.elevation_gain_m)} m`} />
        )}
        {trail.elevation_loss_m != null && (
          <CharRow label="Dénivelé −" value={`${Math.round(trail.elevation_loss_m)} m`} />
        )}
        {trail.max_altitude_m != null && (
          <CharRow label="Altitude max" value={`${Math.round(trail.max_altitude_m)} m`} />
        )}
        {trail.is_verified && (
          <View className="flex-row items-center gap-2">
            <CheckCircle size={14} color={colors.primary.DEFAULT} />
            <Text className="text-sm text-primary-600 font-medium">Piste vérifiée</Text>
          </View>
        )}
      </View>

      {/* Points d'intérêt */}
      {pois.length > 0 && (
        <View className="bg-white rounded-2xl p-4 border border-border gap-3">
          <Text className="text-sm text-slate font-semibold">Points d'intérêt ({pois.length})</Text>
          {pois.map((poi) => (
            <View key={poi.id} className="flex-row items-start gap-3">
              <View className="w-8 h-8 rounded-xl bg-primary-600/10 items-center justify-center">
                <MapPin size={14} color={colors.primary.DEFAULT} />
              </View>
              <View className="flex-1">
                <Text className="text-carbon text-sm font-medium">{poi.name}</Text>
                <Text className="text-slate text-xs">{POI_TYPE_LABELS[poi.type]}</Text>
                {poi.description && (
                  <Text className="text-slate text-xs mt-0.5" numberOfLines={2}>
                    {poi.description}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Onglet Météo ─────────────────────────────────────────────

function MeteoTab({ weather, isLoading, advice }: { weather: any; isLoading: boolean; advice: any }) {
  if (isLoading) return <LoadingState message="Chargement de la météo..." />;
  if (!weather) return <EmptyState title="Météo indisponible" description="Impossible de récupérer les données météo." />;

  return (
    <View className="gap-4">
      <WeatherCard weather={weather} />
      {advice && <SafetyAdviceCard advice={advice} />}
    </View>
  );
}

// ─── Onglet Signalements ──────────────────────────────────────

function ReportsTab({ reports, isLoading, trailId }: { reports: any[]; isLoading: boolean; trailId: string }) {
  if (isLoading) return <LoadingState message="Chargement des signalements..." />;

  return (
    <View className="gap-3">
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/reports/new', params: { trailId } })}
        className="flex-row items-center gap-2 border border-primary-600 rounded-2xl py-3 px-4 justify-center"
      >
        <AlertTriangle size={16} color={colors.primary.DEFAULT} />
        <Text className="text-primary-600 font-semibold text-sm">Signaler un problème</Text>
      </TouchableOpacity>

      {reports.length === 0 ? (
        <View className="bg-white rounded-2xl p-5 border border-border items-center gap-3">
          <CheckCircle size={28} color={colors.primary.DEFAULT} />
          <Text className="text-carbon font-medium">Aucun signalement actif</Text>
          <Text className="text-slate text-sm text-center">Cette piste ne présente aucun problème signalé.</Text>
        </View>
      ) : (
        reports.map((report) => (
          <ReportCard
            key={report.id}
            report={report}
            onPress={() => router.push(`/reports/${report.id}`)}
          />
        ))
      )}
    </View>
  );
}

// ─── Onglet Avis ─────────────────────────────────────────────

function ReviewsTab({ reviews, isLoading, trailId, trail }: {
  reviews: any[];
  isLoading: boolean;
  trailId: string;
  trail: any;
}) {
  const isAuthenticated = useIsAuthenticated();

  if (isLoading) return <LoadingState message="Chargement des avis..." />;

  return (
    <View className="gap-3">
      <TouchableOpacity
        onPress={() => isAuthenticated ? router.push({ pathname: '/trails/review', params: { trailId } }) : router.push('/auth/login')}
        className="flex-row items-center gap-2 border border-primary-600 rounded-2xl py-3 px-4 justify-center"
      >
        <Star size={16} color={colors.primary.DEFAULT} />
        <Text className="text-primary-600 font-semibold text-sm">Écrire un avis</Text>
      </TouchableOpacity>

      {/* Note globale */}
      {trail.average_rating != null && reviews.length > 0 && (
        <View className="bg-white rounded-2xl p-4 border border-border flex-row items-center gap-4">
          <View className="items-center">
            <Text className="text-4xl font-black text-carbon">{trail.average_rating.toFixed(1)}</Text>
            <View className="flex-row gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={14}
                  color="#F59E0B"
                  fill={s <= Math.round(trail.average_rating) ? '#F59E0B' : 'transparent'}
                />
              ))}
            </View>
            <Text className="text-xs text-slate mt-1">{trail.review_count} avis</Text>
          </View>
        </View>
      )}

      {reviews.length === 0 ? (
        <View className="bg-white rounded-2xl p-5 border border-border items-center gap-3">
          <Star size={28} color={colors.textSecondary} />
          <Text className="text-slate text-sm text-center">Aucun avis pour l'instant. Sois le premier !</Text>
        </View>
      ) : (
        reviews.map((review) => (
          <View key={review.id} className="bg-white rounded-2xl p-4 border border-border gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-carbon font-semibold text-sm">
                {review.profile?.full_name ?? 'Anonyme'}
              </Text>
              <View className="flex-row gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={12}
                    color="#F59E0B"
                    fill={s <= review.rating ? '#F59E0B' : 'transparent'}
                  />
                ))}
              </View>
            </View>
            {review.comment && (
              <Text className="text-slate text-sm leading-5">{review.comment}</Text>
            )}
          </View>
        ))
      )}
    </View>
  );
}

// ─── Micro-composants ────────────────────────────────────────

function QuickStat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View className="flex-1 items-center gap-1">
      {icon}
      <Text className="text-carbon text-sm font-bold">{value}</Text>
      <Text className="text-slate text-xs">{label}</Text>
    </View>
  );
}

function CharRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-slate text-sm">{label}</Text>
      <Text className="text-carbon text-sm font-medium">{value}</Text>
    </View>
  );
}
