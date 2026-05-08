import React from 'react';
import { View, Text, Image } from 'react-native';
import { MapPin, Clock, TrendingUp, Star } from 'lucide-react-native';
import { AppCard } from '@/components/ui/AppCard';
import { DifficultyBadge, SurfaceBadge } from '@/components/ui/AppBadge';
import type { Trail } from '@/types/database';
import { TRAIL_TYPE_LABELS } from '@/lib/constants/labels';
import { colors } from '@/config/colors';

// ============================================================
// TrailCard — Carte d'une piste cyclable
// ============================================================

interface TrailCardProps {
  trail: Trail;
  onPress: () => void;
  compact?: boolean;
}

export function TrailCard({ trail, onPress, compact = false }: TrailCardProps) {
  const durationHours = trail.estimated_duration_minutes
    ? Math.floor(trail.estimated_duration_minutes / 60)
    : null;
  const durationMins = trail.estimated_duration_minutes
    ? trail.estimated_duration_minutes % 60
    : null;
  const durationLabel = trail.estimated_duration_minutes
    ? durationHours
      ? `${durationHours}h${durationMins ? durationMins.toString().padStart(2, '0') : '00'}`
      : `${durationMins} min`
    : null;

  if (compact) {
    return (
      <AppCard onPress={onPress} padding="none" className="overflow-hidden">
        {trail.cover_image_url && (
          <Image
            source={{ uri: trail.cover_image_url }}
            className="w-full h-28"
            resizeMode="cover"
          />
        )}
        <View className="p-3 gap-2">
          <Text className="text-base font-bold text-carbon" numberOfLines={1}>
            {trail.name}
          </Text>
          <View className="flex-row items-center gap-1">
            <MapPin size={12} color={colors.textSecondary} />
            <Text className="text-xs text-slate" numberOfLines={1}>{trail.city}</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <DifficultyBadge difficulty={trail.difficulty} small />
            <Text className="text-sm font-bold text-carbon">{trail.distance_km} km</Text>
          </View>
        </View>
      </AppCard>
    );
  }

  return (
    <AppCard onPress={onPress} padding="none" className="overflow-hidden">
      {/* Image de couverture */}
      <View className="h-48 bg-slate/10 relative">
        {trail.cover_image_url ? (
          <Image
            source={{ uri: trail.cover_image_url }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="flex-1 items-center justify-center bg-primary-50">
            <MapPin size={40} color={colors.primary.DEFAULT} />
          </View>
        )}
        {/* Type de piste */}
        <View className="absolute top-3 left-3 bg-white/90 rounded-full px-3 py-1">
          <Text className="text-xs font-semibold text-carbon">
            {TRAIL_TYPE_LABELS[trail.trail_type]}
          </Text>
        </View>
        {/* Vérifié */}
        {trail.is_verified && (
          <View className="absolute top-3 right-3 bg-primary-600/90 rounded-full px-2 py-1">
            <Text className="text-xs font-semibold text-white">✓ Vérifié</Text>
          </View>
        )}
      </View>

      {/* Contenu */}
      <View className="p-4 gap-3">
        {/* Titre + ville */}
        <View className="gap-1">
          <Text className="text-lg font-bold text-carbon" numberOfLines={2}>
            {trail.name}
          </Text>
          <View className="flex-row items-center gap-1">
            <MapPin size={13} color={colors.textSecondary} />
            <Text className="text-sm text-slate">{trail.city}, {trail.region}</Text>
          </View>
        </View>

        {/* Stats */}
        <View className="flex-row items-center gap-4">
          <View className="flex-row items-center gap-1">
            <Text className="text-xl font-bold text-carbon">
              {trail.distance_km}
            </Text>
            <Text className="text-sm text-slate">km</Text>
          </View>

          {durationLabel && (
            <View className="flex-row items-center gap-1">
              <Clock size={14} color={colors.textSecondary} />
              <Text className="text-sm text-slate">{durationLabel}</Text>
            </View>
          )}

          {trail.elevation_gain_m > 0 && (
            <View className="flex-row items-center gap-1">
              <TrendingUp size={14} color={colors.elevation} />
              <Text className="text-sm text-slate">+{trail.elevation_gain_m}m</Text>
            </View>
          )}

          {trail.average_rating > 0 && (
            <View className="flex-row items-center gap-1 ml-auto">
              <Star size={14} color="#F59E0B" fill="#F59E0B" />
              <Text className="text-sm font-semibold text-carbon">
                {trail.average_rating.toFixed(1)}
              </Text>
            </View>
          )}
        </View>

        {/* Badges */}
        <View className="flex-row flex-wrap gap-2">
          <DifficultyBadge difficulty={trail.difficulty} />
          <SurfaceBadge surface={trail.surface_type} />
        </View>
      </View>
    </AppCard>
  );
}
