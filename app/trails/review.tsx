import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, SafeAreaView,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Star } from 'lucide-react-native';
import { AppButton } from '@/components/ui/AppButton';
import { addTrailReview } from '@/features/trails/trailService';
import { colors } from '@/config/colors';
import { useUser } from '@/stores/authStore';

// ============================================================
// Écran Écrire un avis
// ============================================================

export default function TrailReviewScreen() {
  const { trailId } = useLocalSearchParams<{ trailId: string }>();
  const qc = useQueryClient();
  const user = useUser();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const mutation = useMutation({
    mutationFn: () => addTrailReview(trailId!, user!.id, rating, comment || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trail-reviews', trailId] });
      qc.invalidateQueries({ queryKey: ['trail', trailId] });
      router.back();
    },
  });

  const LABELS = ['', 'Très difficile', 'Difficile', 'Bien', 'Très bien', 'Excellent'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F8F5' }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View className="flex-row items-center px-4 py-3 gap-3 border-b border-border bg-white">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Revenir à l'écran précédent"
          >
            <ArrowLeft size={20} color={colors.carbon} />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-carbon flex-1">Écrire un avis</Text>
        </View>

        <View className="flex-1 p-6 gap-8">
          {/* Note */}
          <View className="items-center gap-4">
            <Text className="text-base font-semibold text-carbon">Ta note *</Text>
            <View className="flex-row gap-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setRating(s)}
                  accessibilityRole="button"
                  accessibilityLabel={`Donner ${s} étoile${s > 1 ? 's' : ''}`}
                >
                  <Star
                    size={40}
                    color={colors.warning}
                    fill={s <= rating ? colors.warning : 'transparent'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {rating > 0 && (
              <Text className="text-primary-600 text-sm font-semibold">{LABELS[rating]}</Text>
            )}
          </View>

          {/* Commentaire */}
          <View className="gap-2 flex-1">
            <Text className="text-sm font-semibold text-carbon">Commentaire (facultatif)</Text>
            <View className="bg-white border border-border rounded-2xl px-4 py-3 flex-1">
              <TextInput
                placeholder="Partage ton expérience sur cette piste : conditions, points forts, conseils..."
                placeholderTextColor={colors.placeholder}
                value={comment}
                onChangeText={setComment}
                multiline
                textAlignVertical="top"
                className="text-carbon text-sm leading-6 flex-1"
                maxLength={800}
              />
            </View>
            <Text className="text-xs text-slate self-end">{comment.length}/800</Text>
          </View>

          {mutation.isError && (
            <View className="bg-danger/10 rounded-xl p-3">
              <Text className="text-danger text-sm">Erreur lors de l'envoi. Réessaie.</Text>
            </View>
          )}

          <AppButton
            label="Publier l'avis"
            onPress={() => {
              if (rating > 0) mutation.mutate();
            }}
            loading={mutation.isPending}
            fullWidth
            size="lg"
            variant="gradient"
            disabled={rating === 0}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
