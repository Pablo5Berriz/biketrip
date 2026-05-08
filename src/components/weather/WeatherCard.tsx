import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Sun, Cloud, CloudRain, CloudSnow, Wind,
  Droplets, Eye, Zap, CloudDrizzle,
} from 'lucide-react-native';
import type { WeatherData, WeatherCondition } from '@/types/weather';
import { gradients } from '@/config/colors';

// ============================================================
// WeatherCard — Carte météo BikeTrip
// ============================================================

interface WeatherCardProps {
  weather: WeatherData;
  compact?: boolean;
}

export function WeatherCard({ weather, compact = false }: WeatherCardProps) {
  const icon = conditionIcon(weather.condition, compact ? 28 : 48);
  const condLabel = conditionLabel(weather.condition);

  if (compact) {
    return (
      <View className="bg-sky/10 rounded-2xl p-3 flex-row items-center gap-3">
        {icon}
        <View className="flex-1">
          <Text className="text-2xl font-bold text-secondary-600">
            {weather.temperature_c}°
          </Text>
          <Text className="text-xs text-slate">{condLabel}</Text>
        </View>
        <View className="items-end gap-1">
          <View className="flex-row items-center gap-1">
            <Wind size={12} color="#0EA5E9" />
            <Text className="text-xs text-slate">{weather.wind_speed_kmh} km/h</Text>
          </View>
          <View className="flex-row items-center gap-1">
            <Droplets size={12} color="#0EA5E9" />
            <Text className="text-xs text-slate">{weather.precipitation_probability}%</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={gradients.weather}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      className="rounded-2xl p-5 gap-4"
    >
      {/* Température principale */}
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-5xl font-bold text-white">
            {weather.temperature_c}°C
          </Text>
          <Text className="text-white/80 text-base mt-1">{condLabel}</Text>
          <Text className="text-white/70 text-sm">
            Ressenti {weather.feels_like_c}°C
          </Text>
        </View>
        {icon}
      </View>

      {/* Stats secondaires */}
      <View className="flex-row justify-between">
        <WeatherStat
          icon={<Wind size={16} color="rgba(255,255,255,0.9)" />}
          label="Vent"
          value={`${weather.wind_speed_kmh} km/h`}
        />
        <WeatherStat
          icon={<CloudRain size={16} color="rgba(255,255,255,0.9)" />}
          label="Pluie"
          value={`${weather.precipitation_probability}%`}
        />
        <WeatherStat
          icon={<Droplets size={16} color="rgba(255,255,255,0.9)" />}
          label="Humidité"
          value={`${weather.humidity}%`}
        />
        <WeatherStat
          icon={<Eye size={16} color="rgba(255,255,255,0.9)" />}
          label="Visibilité"
          value={`${weather.visibility_km} km`}
        />
      </View>

      {/* Rafales */}
      {weather.wind_gust_kmh > 30 && (
        <View className="bg-white/20 rounded-xl px-3 py-2 flex-row items-center gap-2">
          <Zap size={14} color="white" />
          <Text className="text-white text-sm font-medium">
            Rafales jusqu'à {weather.wind_gust_kmh} km/h
          </Text>
        </View>
      )}
    </LinearGradient>
  );
}

function WeatherStat({
  icon, label, value,
}: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View className="items-center gap-1">
      {icon}
      <Text className="text-white/70 text-xs">{label}</Text>
      <Text className="text-white font-semibold text-sm">{value}</Text>
    </View>
  );
}

// ============================================================
// Utilitaires
// ============================================================

function conditionIcon(condition: WeatherCondition, size: number): React.ReactNode {
  const color = 'white';
  switch (condition) {
    case 'CLEAR':          return <Sun size={size} color={color} />;
    case 'PARTLY_CLOUDY':  return <Cloud size={size} color={color} />;
    case 'CLOUDY':         return <Cloud size={size} color={color} />;
    case 'DRIZZLE':        return <CloudDrizzle size={size} color={color} />;
    case 'RAIN':           return <CloudRain size={size} color={color} />;
    case 'HEAVY_RAIN':     return <CloudRain size={size} color={color} />;
    case 'SNOW':           return <CloudSnow size={size} color={color} />;
    case 'THUNDERSTORM':   return <Zap size={size} color={color} />;
    case 'WINDY':          return <Wind size={size} color={color} />;
    default:               return <Cloud size={size} color={color} />;
  }
}

function conditionLabel(condition: WeatherCondition): string {
  const labels: Record<WeatherCondition, string> = {
    CLEAR:         'Ensoleillé',
    PARTLY_CLOUDY: 'Partiellement nuageux',
    CLOUDY:        'Nuageux',
    FOG:           'Brouillard',
    DRIZZLE:       'Bruine',
    RAIN:          'Pluie',
    HEAVY_RAIN:    'Forte pluie',
    SNOW:          'Neige',
    SLEET:         'Grésil',
    THUNDERSTORM:  'Orage',
    HAIL:          'Grêle',
    WINDY:         'Venteux',
    UNKNOWN:       'Inconnu',
  };
  return labels[condition] ?? 'Inconnu';
}
