import React from 'react';
import { View, Text } from 'react-native';
import { AppCard } from '@/components/ui/AppCard';
import { colors } from '@/config/colors';

// ============================================================
// StatTile — Tuile statistique (distance, durée, vitesse…)
// ============================================================

interface StatTileProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  color?: string;
  large?: boolean;
}

export function StatTile({
  label,
  value,
  unit,
  icon,
  color = colors.primary.DEFAULT,
  large = false,
}: StatTileProps) {
  return (
    <AppCard padding="md" className="flex-1 items-center gap-2">
      {icon && (
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: color + '18' }}
        >
          {icon}
        </View>
      )}
      <View className="items-center">
        <View className="flex-row items-end gap-1">
          <Text
            className={`font-bold text-carbon ${large ? 'text-4xl' : 'text-2xl'}`}
            style={{ color }}
          >
            {value}
          </Text>
          {unit && (
            <Text className="text-sm text-slate mb-1">{unit}</Text>
          )}
        </View>
        <Text className="text-xs text-slate mt-0.5">{label}</Text>
      </View>
    </AppCard>
  );
}

// Panneau de suivi en temps réel pendant la sortie
interface RideTrackingPanelProps {
  distanceKm: number;
  durationSeconds: number;
  speedKmh: number;
  averageSpeedKmh: number;
}

export function RideTrackingPanel({
  distanceKm,
  durationSeconds,
  speedKmh,
  averageSpeedKmh,
}: RideTrackingPanelProps) {
  const hours = Math.floor(durationSeconds / 3600);
  const minutes = Math.floor((durationSeconds % 3600) / 60);
  const seconds = durationSeconds % 60;
  const durationStr = hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return (
    <View className="gap-3">
      {/* Distance principale — très lisible en extérieur */}
      <View className="items-center">
        <Text className="text-7xl font-black text-primary-600" style={{ letterSpacing: -2 }}>
          {distanceKm.toFixed(1)}
        </Text>
        <Text className="text-xl text-slate font-semibold">km</Text>
      </View>

      {/* Stats secondaires */}
      <View className="flex-row gap-3">
        <StatTile
          label="Durée"
          value={durationStr}
          color={colors.secondary.DEFAULT}
        />
        <StatTile
          label="Vitesse"
          value={speedKmh.toFixed(1)}
          unit="km/h"
          color={colors.sky}
        />
        <StatTile
          label="Moy."
          value={averageSpeedKmh.toFixed(1)}
          unit="km/h"
          color={colors.elevation}
        />
      </View>
    </View>
  );
}
