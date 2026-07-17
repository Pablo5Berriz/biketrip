import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, KeyboardAvoidingView, Platform, Share,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle, TrendingUp, Clock, Navigation,
  Zap, MessageSquare, Share2, Home,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LoadingState } from '@/components/ui/LoadingState';
import { formatDistance, formatDuration } from '@/lib/geo/geoUtils';
import { colors } from '@/config/colors';
import { getRideById, updateRideNotes } from '@/features/rides/rideService';
import { useUser } from '@/stores/authStore';

// ============================================================
// Écran Résumé de sortie
// ============================================================

export default function RideSummaryScreen() {
  const { rideId } = useLocalSearchParams<{ rideId: string }>();
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);
  const qc = useQueryClient();
  const user = useUser();

  const rideQuery = useQuery({
    queryKey: ['ride', rideId, user?.id],
    queryFn: () => getRideById(rideId!, user!.id),
    enabled: !!rideId && !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const saveNotesMutation = useMutation({
    mutationFn: async () => {
      const result = await updateRideNotes(rideId!, user!.id, { notes });
      if (!result.success) throw new Error(result.error ?? 'Sauvegarde impossible');
      return result;
    },
    onSuccess: () => {
      setSaved(true);
      qc.invalidateQueries({ queryKey: ['ride', rideId, user?.id] });
      qc.invalidateQueries({ queryKey: ['rides', 'history'] });
      qc.invalidateQueries({ queryKey: ['rides', 'stats'] });
    },
  });

  const ride = rideQuery.data?.data;

  const handleShareRide = async () => {
    if (!ride) return;
    await Share.share({
      message: `J'ai terminé une sortie BikeTrip de ${formatDistance(ride.distance_km ?? 0)} en ${formatDuration(ride.duration_seconds ?? 0)}.`,
    });
  };

  if (rideQuery.isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F8F5' }}>
        <LoadingState message="Chargement du résumé..." fullScreen />
      </SafeAreaView>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F8F5' }}>
        <View className="flex-1 items-center justify-center px-8 gap-4">
          <Text className="text-xl font-bold text-carbon">Sortie terminée !</Text>
          <TouchableOpacity
            onPress={() => router.replace('/tabs/home')}
            className="bg-primary-600 rounded-2xl py-4 px-8"
            accessibilityRole="button"
            accessibilityLabel="Retourner à l'accueil"
          >
            <Text className="text-white font-bold">Retour à l'accueil</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const distance = ride.distance_km ?? 0;
  const duration = ride.duration_seconds ?? 0;
  const elevation = ride.elevation_gain_m ?? 0;
  const avgSpeed = ride.average_speed_kmh ?? 0;
  const maxSpeed = ride.max_speed_kmh ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F8F5' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header félicitations */}
          <LinearGradient
            colors={[colors.primary.DEFAULT, colors.primary[700]]}
            className="px-6 py-10 items-center gap-4"
          >
            <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center">
              <CheckCircle size={44} color="white" />
            </View>
            <Text className="text-white text-2xl font-black text-center">
              Sortie terminée ! 🎉
            </Text>
          </LinearGradient>

          <View className="px-4 mt-4 gap-4">
            {/* Stat principale — distance */}
            <View className="bg-white rounded-2xl p-6 border border-border items-center gap-2">
              <Text className="text-5xl font-black text-carbon">{formatDistance(distance)}</Text>
              <Text className="text-slate text-sm">Distance parcourue</Text>
            </View>

            {/* Grille de stats */}
            <View className="flex-row gap-3">
              <StatBlock
                icon={<Clock size={20} color={colors.sky} />}
                value={formatDuration(duration)}
                label="Durée"
                color={colors.sky}
              />
              <StatBlock
                icon={<TrendingUp size={20} color={colors.elevation} />}
                value={`${Math.round(elevation)} m`}
                label="Dénivelé +"
                color={colors.elevation}
              />
            </View>
            <View className="flex-row gap-3">
              <StatBlock
                icon={<Zap size={20} color={colors.primary.DEFAULT} />}
                value={`${avgSpeed.toFixed(1)} km/h`}
                label="Vitesse moy."
                color={colors.primary.DEFAULT}
              />
              <StatBlock
                icon={<Navigation size={20} color={colors.accent.DEFAULT} />}
                value={`${maxSpeed.toFixed(1)} km/h`}
                label="Vitesse max"
                color={colors.accent.DEFAULT}
              />
            </View>

            {/* Notes */}
            <View className="bg-white rounded-2xl p-4 border border-border gap-3">
              <View className="flex-row items-center gap-2">
                <MessageSquare size={16} color={colors.textSecondary} />
                <Text className="text-sm font-semibold text-carbon">Notes de sortie</Text>
              </View>
              <TextInput
                className="text-carbon text-sm leading-6 min-h-20"
                placeholder="Comment s'est passée ta sortie ? Conditions de piste, sensations..."
                placeholderTextColor={colors.placeholder}
                value={notes}
                onChangeText={setNotes}
                multiline
                textAlignVertical="top"
              />
              {notes.length > 0 && !saved && (
                <TouchableOpacity
                  onPress={() => saveNotesMutation.mutate()}
                  className="bg-primary-600 rounded-xl py-2.5 items-center"
                  disabled={saveNotesMutation.isPending}
                  accessibilityRole="button"
                  accessibilityLabel="Sauvegarder les notes de sortie"
                >
                  <Text className="text-white font-semibold text-sm">
                    {saveNotesMutation.isPending ? 'Sauvegarde...' : 'Sauvegarder les notes'}
                  </Text>
                </TouchableOpacity>
              )}
              {saved && (
                <View className="flex-row items-center gap-2">
                  <CheckCircle size={14} color={colors.primary.DEFAULT} />
                  <Text className="text-primary-600 text-xs">Notes sauvegardées</Text>
                </View>
              )}
            </View>

            {/* Actions */}
            <View className="gap-3">
              <TouchableOpacity
                onPress={handleShareRide}
                className="bg-white border border-border rounded-2xl py-3.5 flex-row items-center justify-center gap-2"
                accessibilityRole="button"
                accessibilityLabel="Partager ma sortie"
              >
                <Share2 size={16} color={colors.carbon} />
                <Text className="text-carbon font-semibold text-sm">Partager ma sortie</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.replace('/tabs/home')}
                className="bg-primary-600 rounded-2xl py-4 flex-row items-center justify-center gap-2"
                accessibilityRole="button"
                accessibilityLabel="Retourner à l'accueil"
              >
                <Home size={16} color="white" />
                <Text className="text-white font-bold">Retour à l'accueil</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StatBlock({ icon, value, label, color }: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <View
      className="flex-1 bg-white rounded-2xl p-4 border border-border gap-2"
    >
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
