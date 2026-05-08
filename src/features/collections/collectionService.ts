import { supabase } from '@/lib/supabase/client';
import type { ServiceResult } from '@/types/database';

// ============================================================
// Service Collections
// ============================================================

export interface CreateCollectionInput {
  name: string;
  description?: string | null;
}

export async function getCollections(): Promise<ServiceResult<any[]>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Non authentifié' };

  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      collection_trails(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return { data: null, error: error.message };

  const enriched = (data ?? []).map((c) => ({
    ...c,
    trail_count: c.collection_trails?.[0]?.count ?? 0,
  }));

  return { data: enriched, error: null };
}

export async function getCollectionById(collectionId: string): Promise<ServiceResult<any>> {
  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      collection_trails(
        trail:trails(
          id, name, difficulty, distance_km, elevation_gain_m,
          estimated_duration_min, cover_image_url, average_rating,
          trail_type, surface_type, is_verified
        )
      )
    `)
    .eq('id', collectionId)
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function createCollection(
  input: CreateCollectionInput,
): Promise<ServiceResult<any>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: 'Non authentifié' };

  const { data, error } = await supabase
    .from('collections')
    .insert({
      user_id: user.id,
      name: input.name,
      description: input.description ?? null,
    })
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function updateCollection(
  collectionId: string,
  updates: Partial<CreateCollectionInput>,
): Promise<ServiceResult<any>> {
  const { data, error } = await supabase
    .from('collections')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', collectionId)
    .select()
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function deleteCollection(collectionId: string): Promise<ServiceResult<null>> {
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', collectionId);

  if (error) return { data: null, error: error.message };
  return { data: null, error: null };
}

export async function addTrailToCollection(
  collectionId: string,
  trailId: string,
): Promise<ServiceResult<null>> {
  const { error } = await supabase
    .from('collection_trails')
    .insert({ collection_id: collectionId, trail_id: trailId });

  if (error) return { data: null, error: error.message };
  return { data: null, error: null };
}

export async function removeTrailFromCollection(
  collectionId: string,
  trailId: string,
): Promise<ServiceResult<null>> {
  const { error } = await supabase
    .from('collection_trails')
    .delete()
    .eq('collection_id', collectionId)
    .eq('trail_id', trailId);

  if (error) return { data: null, error: error.message };
  return { data: null, error: null };
}
