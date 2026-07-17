import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  SafeAreaView, TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react-native';
import { TrailCard } from '@/components/trails/TrailCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { DifficultyBadge } from '@/components/ui/AppBadge';
import { searchTrails, getPopularTrails } from '@/features/trails/trailService';
import type { TrailDifficulty, TrailType } from '@/types/database';
import { TRAIL_TYPE_LABELS } from '@/lib/constants/labels';
import { colors } from '@/config/colors';

// ============================================================
// Écran Découvrir — Recherche et filtres
// ============================================================

const TRAIL_TYPE_FILTERS: TrailType[] = [
  'FAMILY', 'URBAN', 'NATURE', 'GREENWAY', 'SPORT', 'GRAVEL',
];
const DIFFICULTY_FILTERS: TrailDifficulty[] = ['EASY', 'MODERATE', 'HARD', 'EXPERT'];

export default function DiscoverScreen() {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<TrailType | undefined>();
  const [selectedDifficulty, setSelectedDifficulty] = useState<TrailDifficulty | undefined>();

  const isFiltered = !!query || !!selectedType || !!selectedDifficulty;

  const searchQuery = useQuery({
    queryKey: ['trails', 'search', query, selectedType, selectedDifficulty],
    queryFn: () => searchTrails({
      query: query || undefined,
      trail_type: selectedType,
      difficulty: selectedDifficulty,
    }),
    staleTime: 1000 * 60 * 5,
  });

  const popularQuery = useQuery({
    queryKey: ['trails', 'popular'],
    queryFn: () => getPopularTrails(20),
    enabled: !isFiltered,
    staleTime: 1000 * 60 * 10,
  });

  const trails = isFiltered
    ? (searchQuery.data?.data?.data ?? [])
    : (popularQuery.data?.data ?? []);

  const isLoading = isFiltered ? searchQuery.isLoading : popularQuery.isLoading;

  function clearFilters() {
    setQuery('');
    setSelectedType(undefined);
    setSelectedDifficulty(undefined);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F8F5' }}>
      {/* Header */}
      <View className="px-5 pt-5 pb-3 gap-4">
        <Text className="text-2xl font-black text-carbon">Découvrir</Text>

        {/* Barre de recherche */}
        <View className="flex-row items-center bg-white rounded-xl border border-border px-4 gap-3">
          <Search size={18} color={colors.textSecondary} />
          <TextInput
            className="flex-1 py-3 text-base text-carbon"
            placeholder="Rechercher une piste..."
            placeholderTextColor={colors.placeholder}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => setQuery('')}
              accessibilityRole="button"
              accessibilityLabel="Effacer la recherche"
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filtres type de piste */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={TRAIL_TYPE_FILTERS}
          keyExtractor={(item) => item}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedType(selectedType === item ? undefined : item)}
              className={`rounded-full px-4 py-2 border ${
                selectedType === item
                  ? 'bg-primary-600 border-primary-600'
                  : 'bg-white border-border'
              }`}
              accessibilityRole="button"
              accessibilityLabel={`Filtrer par ${TRAIL_TYPE_LABELS[item]}`}
            >
              <Text
                className={`text-sm font-semibold ${
                  selectedType === item ? 'text-white' : 'text-carbon'
                }`}
              >
                {TRAIL_TYPE_LABELS[item]}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Filtres difficulté */}
        <View className="flex-row gap-2 flex-wrap">
          {DIFFICULTY_FILTERS.map((d) => (
            <TouchableOpacity
              key={d}
              onPress={() => setSelectedDifficulty(selectedDifficulty === d ? undefined : d)}
              style={{ opacity: selectedDifficulty && selectedDifficulty !== d ? 0.5 : 1 }}
              accessibilityRole="button"
              accessibilityLabel="Filtrer par difficulté"
            >
              <DifficultyBadge difficulty={d} />
            </TouchableOpacity>
          ))}
          {isFiltered && (
            <TouchableOpacity
              onPress={clearFilters}
              className="flex-row items-center gap-1 rounded-full px-3 py-1 bg-slate/10"
              accessibilityRole="button"
              accessibilityLabel="Effacer les filtres"
            >
              <X size={12} color={colors.textSecondary} />
              <Text className="text-xs text-slate font-medium">Effacer</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Résultats */}
      {isLoading ? (
        <LoadingState message="Recherche des pistes..." fullScreen />
      ) : trails.length === 0 ? (
        <EmptyState
          title="Aucune piste trouvée"
          description="Essaie d'autres critères ou explore la carte."
          actionLabel="Voir la carte"
          onAction={() => router.push('/tabs/map')}
        />
      ) : (
        <FlatList
          data={trails}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 12 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text className="text-sm text-slate py-2">
              {trails.length} piste{trails.length > 1 ? 's' : ''}
              {isFiltered ? ' trouvée' + (trails.length > 1 ? 's' : '') : ' populaires'}
            </Text>
          }
          renderItem={({ item }) => (
            <TrailCard
              trail={item}
              onPress={() => router.push(`/trails/${item.id}`)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
