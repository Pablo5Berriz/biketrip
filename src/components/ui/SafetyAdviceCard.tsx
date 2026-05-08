import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  CheckCircle, AlertTriangle, AlertOctagon, Info,
  Check,
} from 'lucide-react-native';
import type { RideAdvice, RiskLevel } from '@/types/weather';

// ============================================================
// SafetyAdviceCard — Carte préparation avant départ
// ============================================================

interface SafetyAdviceCardProps {
  advice: RideAdvice;
}

export function SafetyAdviceCard({ advice }: SafetyAdviceCardProps) {
  return (
    <View className="gap-4">
      {/* Niveau de risque global */}
      <RiskLevelBanner level={advice.riskLevel} label={advice.riskLabel} />

      {/* Heure de départ conseillée */}
      {advice.bestDepartureTime && (
        <View className="flex-row items-center gap-2 bg-sky/10 rounded-xl p-3">
          <Info size={16} color="#0EA5E9" />
          <Text className="text-sm text-sky-600 flex-1">{advice.bestDepartureTime}</Text>
        </View>
      )}

      {/* Conseils */}
      {advice.advices.slice(0, 6).map((a, i) => (
        <View
          key={i}
          className="flex-row items-start gap-3 bg-white rounded-xl p-3 border border-border"
        >
          <View className="w-8 h-8 rounded-full bg-primary-50 items-center justify-center mt-0.5">
            <Info size={16} color="#16A34A" />
          </View>
          <Text className="text-sm text-carbon flex-1 leading-5">{a.message}</Text>
        </View>
      ))}

      {/* Checklist */}
      {advice.checklist.length > 0 && (
        <View className="gap-2">
          <Text className="text-base font-bold text-carbon">Checklist avant départ</Text>
          {advice.checklist.slice(0, 8).map((item, i) => (
            <View key={i} className="flex-row items-center gap-3">
              <View
                className={`w-6 h-6 rounded-full items-center justify-center ${
                  item.required ? 'bg-primary-600' : 'bg-border'
                }`}
              >
                <Check size={14} color={item.required ? 'white' : '#64748B'} />
              </View>
              <Text className={`text-sm ${item.required ? 'text-carbon font-medium' : 'text-slate'}`}>
                {item.label}
              </Text>
              {item.required && (
                <View className="ml-auto bg-primary-50 rounded-full px-2 py-0.5">
                  <Text className="text-xs text-primary-600 font-medium">Requis</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function RiskLevelBanner({ level, label }: { level: RiskLevel; label: string }) {
  const config: Record<RiskLevel, {
    bg: [string, string];
    icon: React.ReactNode;
    textColor: string;
  }> = {
    LOW: {
      bg: ['#16A34A', '#22C55E'],
      icon: <CheckCircle size={24} color="white" />,
      textColor: 'white',
    },
    MODERATE: {
      bg: ['#F59E0B', '#FBBF24'],
      icon: <Info size={24} color="white" />,
      textColor: 'white',
    },
    HIGH: {
      bg: ['#F97316', '#FB923C'],
      icon: <AlertTriangle size={24} color="white" />,
      textColor: 'white',
    },
    EXTREME: {
      bg: ['#DC2626', '#EF4444'],
      icon: <AlertOctagon size={24} color="white" />,
      textColor: 'white',
    },
  };

  const c = config[level];

  return (
    <LinearGradient
      colors={c.bg}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      className="rounded-2xl p-4 flex-row items-center gap-3"
    >
      {c.icon}
      <View>
        <Text className="text-white/80 text-xs font-medium">Niveau de risque</Text>
        <Text className="text-white text-xl font-bold">{label}</Text>
      </View>
    </LinearGradient>
  );
}
