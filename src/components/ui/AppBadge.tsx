import React from 'react';
import { View, Text } from 'react-native';
import type { TrailDifficulty, SurfaceType, ReportSeverity } from '@/types/database';
import {
  DIFFICULTY_LABELS, SURFACE_LABELS, REPORT_SEVERITY_LABELS,
  DIFFICULTY_COLORS, REPORT_SEVERITY_COLORS,
} from '@/lib/constants/labels';

// ============================================================
// Badges — Difficulté, Surface, Gravité
// ============================================================

interface DifficultyBadgeProps {
  difficulty: TrailDifficulty;
  small?: boolean;
}

export function DifficultyBadge({ difficulty, small = false }: DifficultyBadgeProps) {
  const color = DIFFICULTY_COLORS[difficulty];
  return (
    <View
      className={`rounded-full px-3 ${small ? 'py-0.5' : 'py-1'}`}
      style={{ backgroundColor: color + '20' }}
    >
      <Text
        className={`font-semibold ${small ? 'text-xs' : 'text-sm'}`}
        style={{ color }}
      >
        {DIFFICULTY_LABELS[difficulty]}
      </Text>
    </View>
  );
}

interface SurfaceBadgeProps {
  surface: SurfaceType;
  small?: boolean;
}

export function SurfaceBadge({ surface, small = false }: SurfaceBadgeProps) {
  return (
    <View className={`rounded-full px-3 ${small ? 'py-0.5' : 'py-1'} bg-slate/10`}>
      <Text className={`font-medium text-slate ${small ? 'text-xs' : 'text-sm'}`}>
        {SURFACE_LABELS[surface]}
      </Text>
    </View>
  );
}

interface AlertBadgeProps {
  severity: ReportSeverity;
  label?: string;
  small?: boolean;
}

export function AlertBadge({ severity, label, small = false }: AlertBadgeProps) {
  const color = REPORT_SEVERITY_COLORS[severity];
  return (
    <View
      className={`rounded-full px-3 ${small ? 'py-0.5' : 'py-1'}`}
      style={{ backgroundColor: color + '20' }}
    >
      <Text
        className={`font-semibold ${small ? 'text-xs' : 'text-sm'}`}
        style={{ color }}
      >
        {label ?? REPORT_SEVERITY_LABELS[severity]}
      </Text>
    </View>
  );
}

// Badge générique
interface AppBadgeProps {
  label: string;
  color?: string;
  bgColor?: string;
  small?: boolean;
}

export function AppBadge({
  label,
  color = '#64748B',
  bgColor,
  small = false,
}: AppBadgeProps) {
  return (
    <View
      className={`rounded-full px-3 ${small ? 'py-0.5' : 'py-1'}`}
      style={{ backgroundColor: bgColor ?? color + '18' }}
    >
      <Text
        className={`font-medium ${small ? 'text-xs' : 'text-sm'}`}
        style={{ color }}
      >
        {label}
      </Text>
    </View>
  );
}
