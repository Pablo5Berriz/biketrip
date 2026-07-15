import { supabase } from '@/lib/supabase/client';
import type { Favorite, FavoriteWithTrail, ServiceResult } from '@/types/database';

export async function addFavorite(
  userId: string,
  trailId: string,
  note?: string,
): Promise<ServiceResult<Favorite>> {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .insert({ user_id: userId, trail_id: trailId, note: note ?? null })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return { success: false, error: 'Déjà dans tes favoris.' };
      return { success: false, error: 'Impossible d\'ajouter aux favoris.' };
    }
    return { success: true, data };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

export async function removeFavorite(userId: string, trailId: string): Promise<ServiceResult> {
  try {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('trail_id', trailId);

    if (error) return { success: false, error: 'Impossible de retirer des favoris.' };
    return { success: true };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

export async function getFavorites(userId: string): Promise<ServiceResult<FavoriteWithTrail[]>> {
  try {
    const { data, error } = await supabase
      .from('favorites')
      .select('*, trails(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return { success: false, error: 'Impossible de charger les favoris.' };
    return { success: true, data: (data ?? []) as FavoriteWithTrail[] };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

export async function isFavorite(userId: string, trailId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('trail_id', trailId)
      .single();
    return !!data;
  } catch {
    return false;
  }
}
