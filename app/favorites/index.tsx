import React from 'react';
import {
  View, Text, FlatList, SafeAreaView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Heart } from 'lucide-react-native';
import { TrailCard } from '@/components/trails/TrailCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { getFavorites, removeFavorite } from '@/features/favorites/favoriteService';
import { colors } from '@/config/colors';
import { useUser } from '@/stores/authStore';

// ============================================================
// Écran Favoris
// ============================================================

export default function FavoritesScreen() {
  const qc = useQueryClient();
  const user = useUser();

  const favoritesQuery = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: () => getFavorites(user!.id),
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 2,
  });

  const removeMutation = useMutation({
    mutationFn: (trailId: string) => removeFavorite(user!.id, trailId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  const favorites = favoritesQuery.data?.data ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F8F5' }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 gap-3 border-b border-border bg-white">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center"
        >
          <ArrowLeft size={20} color={colors.carbon} />
        </TouchableOpacity>
        <View className="flex-row items-center gap-2 flex-1">
          <Heart size={18} color={colors.accent.DEFAULT} fill={colors.accent.DEFAULT} />
          <Text className="text-lg font-bold text-carbon">Mes favoris</Text>
        </View>
        {favorites.length > 0 && (
          <Text className="text-slate text-sm">
            {favorites.length} piste{favorites.length > 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {favoritesQuery.isLoading ? (
        <LoadingState message="Chargement des favoris..." fullScreen />
      ) : favorites.length === 0 ? (
        <EmptyState
          title="Aucun favori"
          description="Ajoute des pistes à tes favoris pour les retrouver facilement ici."
          actionLabel="Explorer les pistes"
          onAction={() => router.push('/(tabs)/discover')}
        />
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={favoritesQuery.isFetching}
              onRefresh={favoritesQuery.refetch}
              tintColor={colors.primary.DEFAULT}
            />
          }
          renderItem={({ item }) => (
            <View className="relative">
              <TrailCard
                trail={item.trails}
                onPress={() => router.push(`/trails/${item.trails.id}`)}
              />
              <TouchableOpacity
                onPress={() => removeMutation.mutate(item.trails.id)}
                className="absolute top-3 right-3 w-9 h-9 bg-white rounded-full items-center justify-center shadow-card"
                disabled={removeMutation.isPending}
              >
                <Heart size={16} color={colors.accent.DEFAULT} fill={colors.accent.DEFAULT} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
