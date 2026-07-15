import { supabase } from '@/lib/supabase/client';
import { uploadImage } from '@/lib/storage/imageUpload';
import { useAuthStore } from '@/stores/authStore';
import type { Profile, ServiceResult } from '@/types/database';
import type { UpdateProfileFormData } from '@/lib/validations/profile';

// ============================================================
// Service Profil utilisateur
// ============================================================

export async function updateProfile(
  updates: UpdateProfileFormData,
): Promise<ServiceResult<Profile>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Non authentifié' };

  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: updates.full_name,
      cycling_level: updates.cycling_level,
      primary_bike_type: updates.primary_bike_type,
      city: updates.city,
      preferred_surface: updates.preferred_surface,
      comfortable_distance_km: updates.comfortable_distance_km,
      unit_system: updates.unit_system,
      is_private: updates.is_private,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  // Mise à jour du store local
  useAuthStore.getState().setProfile(data);
  return { success: true, data };
}

export async function uploadAvatar(imageUri: string): Promise<ServiceResult<string>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Non authentifié' };

  const uploadResult = await uploadImage(
    imageUri,
    'avatars',
    user.id,
  );

  if (!uploadResult.success || !uploadResult.data) {
    return { success: false, error: uploadResult.error ?? 'Erreur lors de l\'upload' };
  }

  // Mise à jour du profil avec le nouvel avatar
  const { data, error } = await supabase
    .from('profiles')
    .update({ avatar_url: uploadResult.data, updated_at: new Date().toISOString() })
    .eq('id', user.id)
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  useAuthStore.getState().setProfile(data);
  return { success: true, data: uploadResult.data };
}

export async function getProfile(userId: string): Promise<ServiceResult<Profile>> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) return { success: false, error: error.message };
  return { success: true, data };
}
