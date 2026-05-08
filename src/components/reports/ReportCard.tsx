import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import {
  AlertTriangle, MapPin, ThumbsUp, CheckCircle,
  Construction, TreePine, Snowflake, Droplets,
} from 'lucide-react-native';
import { AppCard } from '@/components/ui/AppCard';
import { AlertBadge } from '@/components/ui/AppBadge';
import type { Report } from '@/types/database';
import { REPORT_TYPE_LABELS, REPORT_SEVERITY_COLORS } from '@/lib/constants/labels';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

// ============================================================
// ReportCard — Carte de signalement
// ============================================================

interface ReportCardProps {
  report: Report;
  onPress?: () => void;
  onConfirm?: () => void;
  onResolve?: () => void;
  compact?: boolean;
}

export function ReportCard({
  report,
  onPress,
  onConfirm,
  onResolve,
  compact = false,
}: ReportCardProps) {
  const timeAgo = formatDistanceToNow(new Date(report.created_at), {
    addSuffix: true,
    locale: fr,
  });
  const severityColor = REPORT_SEVERITY_COLORS[report.severity];

  if (compact) {
    return (
      <AppCard onPress={onPress} padding="sm">
        <View className="flex-row items-center gap-3">
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: severityColor + '20' }}
          >
            {reportIcon(report.type, severityColor)}
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-carbon" numberOfLines={1}>
              {report.title}
            </Text>
            <Text className="text-xs text-slate">{timeAgo}</Text>
          </View>
          <AlertBadge severity={report.severity} small />
        </View>
      </AppCard>
    );
  }

  return (
    <AppCard onPress={onPress} padding="none" className="overflow-hidden">
      {/* Bandeau de gravité */}
      <View
        className="h-1.5 w-full"
        style={{ backgroundColor: severityColor }}
      />

      <View className="p-4 gap-3">
        {/* Header */}
        <View className="flex-row items-start gap-3">
          <View
            className="w-12 h-12 rounded-2xl items-center justify-center"
            style={{ backgroundColor: severityColor + '18' }}
          >
            {reportIcon(report.type, severityColor)}
          </View>

          <View className="flex-1 gap-1">
            <Text className="text-base font-bold text-carbon">{report.title}</Text>
            <Text className="text-sm text-slate">
              {REPORT_TYPE_LABELS[report.type]}
            </Text>
          </View>

          <AlertBadge severity={report.severity} />
        </View>

        {/* Description */}
        {report.description && (
          <Text className="text-sm text-slate leading-5" numberOfLines={3}>
            {report.description}
          </Text>
        )}

        {/* Image */}
        {report.image_url && (
          <Image
            source={{ uri: report.image_url }}
            className="w-full h-32 rounded-xl"
            resizeMode="cover"
          />
        )}

        {/* Footer */}
        <View className="flex-row items-center justify-between pt-1 border-t border-border">
          <View className="flex-row items-center gap-1">
            <MapPin size={12} color="#64748B" />
            <Text className="text-xs text-slate">{timeAgo}</Text>
          </View>

          <View className="flex-row gap-3">
            {onConfirm && (
              <TouchableOpacity
                onPress={onConfirm}
                className="flex-row items-center gap-1"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ThumbsUp size={14} color="#64748B" />
                <Text className="text-xs text-slate">
                  {report.confirmed_count} confirmé{report.confirmed_count > 1 ? 's' : ''}
                </Text>
              </TouchableOpacity>
            )}
            {onResolve && (
              <TouchableOpacity
                onPress={onResolve}
                className="flex-row items-center gap-1"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <CheckCircle size={14} color="#16A34A" />
                <Text className="text-xs text-primary-600">Résolu</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </AppCard>
  );
}

function reportIcon(type: Report['type'], color: string): React.ReactNode {
  const size = 22;
  switch (type) {
    case 'CONSTRUCTION':      return <Construction size={size} color={color} />;
    case 'FALLEN_TREE':       return <TreePine size={size} color={color} />;
    case 'ICE':
    case 'SNOW':              return <Snowflake size={size} color={color} />;
    case 'WATER_ACCUMULATION':
    case 'MUD':               return <Droplets size={size} color={color} />;
    default:                  return <AlertTriangle size={size} color={color} />;
  }
}
