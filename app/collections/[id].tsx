import React from 'react';
import {
  View, Text, FlatList, SafeAreaView,
  TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Trash2 } from 'lucide-react-native';
import { TrailCard } from '@/components/trails/TrailCard';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { getCollectionById, deleteCollection } from '@/features/collections/collectionService';
import { colors } from '@/config/colors';

// ============================================================
// Écran Détail d'une collection
// ============================================================

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const qc = useQueryClient();

  const collectionQuery = useQuery({
    queryKey: ['collection', id],
    queryFn: () => getCollectionById(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCollection(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collections'] });
      router.back();
    },
  });

  const collection = collectionQuery.data?.data;
  const trails = (collection?.collection_trails ?? []).map((ct) => ct.trail);

  function handleDelete() {
    Alert.alert(
      'Supprimer la collection',
      `Supprimer "${collection?.name}" ? Les pistes ne seront pas supprimées.`,
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ],
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F8F5' }}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 gap-3 border-b border-border bg-white">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center"
          accessibilityRole="button"
          accessibilityLabel="Revenir à l'écran précédent"
        >
          <ArrowLeft size={20} color={colors.carbon} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-bold text-carbon" numberOfLines={1}>
            {collection?.name ?? '...'}
          </Text>
          {trails.length > 0 && (
            <Text className="text-xs text-slate">
              {trails.length} piste{trails.length > 1 ? 's' : ''}
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={handleDelete}
          className="w-10 h-10 rounded-full items-center justify-center bg-danger/10"
          accessibilityRole="button"
          accessibilityLabel="Supprimer cette collection"
        >
          <Trash2 size={16} color={colors.danger} />
        </TouchableOpacity>
      </View>

      {collectionQuery.isLoading ? (
        <LoadingState message="Chargement de la collection..." fullScreen />
      ) : trails.length === 0 ? (
        <EmptyState
          title="Collection vide"
          description="Ajoute des pistes à cette collection depuis leur page de détail."
          actionLabel="Explorer les pistes"
          onAction={() => router.push('/tabs/discover')}
        />
      ) : (
        <FlatList
          data={trails}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={collectionQuery.isFetching}
              onRefresh={collectionQuery.refetch}
              tintColor={colors.primary.DEFAULT}
            />
          }
          ListHeaderComponent={
            collection?.description ? (
              <Text className="text-slate text-sm leading-5 mb-2">
                {collection.description}
              </Text>
            ) : null
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
