import React, { useState } from 'react';
import {
  View, Text, FlatList, SafeAreaView,
  TouchableOpacity, TextInput, Modal, RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, X, Bookmark } from 'lucide-react-native';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { getCollections, createCollection } from '@/features/collections/collectionService';
import { colors } from '@/config/colors';

// ============================================================
// Écran Collections
// ============================================================

export default function CollectionsScreen() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const collectionsQuery = useQuery({
    queryKey: ['collections'],
    queryFn: () => getCollections(),
    staleTime: 1000 * 60 * 2,
  });

  const createMutation = useMutation({
    mutationFn: () => createCollection({ name: newName, description: newDescription || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['collections'] });
      setShowModal(false);
      setNewName('');
      setNewDescription('');
    },
  });

  const collections = collectionsQuery.data?.data ?? [];

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
          <Bookmark size={18} color="#F59E0B" fill="#F59E0B" />
          <Text className="text-lg font-bold text-carbon">Mes collections</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowModal(true)}
          className="w-10 h-10 bg-primary-600 rounded-full items-center justify-center"
        >
          <Plus size={18} color="white" />
        </TouchableOpacity>
      </View>

      {collectionsQuery.isLoading ? (
        <LoadingState message="Chargement des collections..." fullScreen />
      ) : collections.length === 0 ? (
        <EmptyState
          title="Aucune collection"
          description="Crée des collections pour organiser tes pistes préférées."
          actionLabel="Créer une collection"
          onAction={() => setShowModal(true)}
        />
      ) : (
        <FlatList
          data={collections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={collectionsQuery.isFetching}
              onRefresh={collectionsQuery.refetch}
              tintColor={colors.primary.DEFAULT}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/collections/[id]', params: { id: item.id } })}
              className="bg-white rounded-2xl p-4 border border-border gap-2"
              activeOpacity={0.8}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="w-12 h-12 bg-warning/10 rounded-xl items-center justify-center">
                    <Bookmark size={22} color="#F59E0B" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-carbon font-bold text-base" numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text className="text-slate text-xs">
                      {item.trail_count ?? 0} piste{(item.trail_count ?? 0) > 1 ? 's' : ''}
                    </Text>
                  </View>
                </View>
              </View>
              {item.description && (
                <Text className="text-slate text-xs" numberOfLines={2}>{item.description}</Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modal création */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <View className="bg-white rounded-t-3xl p-6 gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-carbon">Nouvelle collection</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View className="gap-1">
              <Text className="text-sm font-medium text-carbon">Nom *</Text>
              <View className="bg-gray-50 border border-border rounded-xl px-4 py-3">
                <TextInput
                  placeholder="Ex. : Pistes du week-end"
                  placeholderTextColor="#94A3B8"
                  value={newName}
                  onChangeText={setNewName}
                  className="text-carbon text-sm"
                />
              </View>
            </View>

            <View className="gap-1">
              <Text className="text-sm font-medium text-carbon">Description (facultatif)</Text>
              <View className="bg-gray-50 border border-border rounded-xl px-4 py-3">
                <TextInput
                  placeholder="Décris ta collection..."
                  placeholderTextColor="#94A3B8"
                  value={newDescription}
                  onChangeText={setNewDescription}
                  multiline
                  numberOfLines={2}
                  className="text-carbon text-sm"
                  textAlignVertical="top"
                />
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                if (newName.trim()) createMutation.mutate();
              }}
              className={`rounded-2xl py-4 items-center ${
                newName.trim() ? 'bg-primary-600' : 'bg-gray-200'
              }`}
              disabled={!newName.trim() || createMutation.isPending}
            >
              <Text
                className={`font-bold text-base ${
                  newName.trim() ? 'text-white' : 'text-slate'
                }`}
              >
                {createMutation.isPending ? 'Création...' : 'Créer la collection'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
