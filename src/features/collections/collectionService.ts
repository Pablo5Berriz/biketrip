import { supabase } from '@/lib/supabase/client';
import { collectionSchema, type CollectionFormData } from '@/lib/validations/ride';
import type {
  Collection,
  CollectionTrail,
  CollectionWithTrails,
  ServiceResult,
  Trail,
} from '@/types/database';

// ============================================================
// Service Collections
// ============================================================

export type CreateCollectionInput = CollectionFormData;
export type UpdateCollectionInput = Partial<CollectionFormData>;

export interface CollectionSummary extends Collection {
  trail_count: number;
}

type CollectionTrailWithTrail = CollectionTrail & {
  trail: Trail;
};

export interface CollectionDetail extends Collection {
  collection_trails: CollectionTrailWithTrail[];
}

type CollectionRow = Collection & {
  collection_trails?: { count: number }[];
};

type CollectionDetailRow = Collection & {
  collection_trails?: CollectionTrailWithTrail[];
};

export async function getCollections(): Promise<ServiceResult<CollectionSummary[]>> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, data: null, error: 'Non authentifié' };

  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      collection_trails(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return { success: false, data: null, error: error.message };

  const enriched = ((data ?? []) as CollectionRow[]).map((collection) => ({
    ...collection,
    trail_count: collection.collection_trails?.[0]?.count ?? 0,
  }));

  return { success: true, data: enriched, error: null };
}

export async function getCollectionById(
  collectionId: string,
): Promise<ServiceResult<CollectionDetail>> {
  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      collection_trails(
        id,
        collection_id,
        trail_id,
        created_at,
        trail:trails(
          *
        )
      )
    `)
    .eq('id', collectionId)
    .single();

  if (error) return { success: false, data: null, error: error.message };

  const collection = data as CollectionDetailRow;
  return {
    success: true,
    data: {
      ...collection,
      collection_trails: collection.collection_trails ?? [],
    },
    error: null,
  };
}

export async function createCollection(
  input: CreateCollectionInput,
): Promise<ServiceResult<Collection>> {
  const parsed = collectionSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      data: null,
      error: 'Collection invalide.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, data: null, error: 'Non authentifié' };

  const { data, error } = await supabase
    .from('collections')
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    })
    .select()
    .single();

  if (error) return { success: false, data: null, error: error.message };
  return { success: true, data, error: null };
}

export async function updateCollection(
  collectionId: string,
  updates: UpdateCollectionInput,
): Promise<ServiceResult<Collection>> {
  const parsed = collectionSchema.partial().safeParse(updates);
  if (!parsed.success) {
    return {
      success: false,
      data: null,
      error: 'Collection invalide.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { data, error } = await supabase
    .from('collections')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', collectionId)
    .select()
    .single();

  if (error) return { success: false, data: null, error: error.message };
  return { success: true, data, error: null };
}

export async function deleteCollection(collectionId: string): Promise<ServiceResult<null>> {
  const { error } = await supabase
    .from('collections')
    .delete()
    .eq('id', collectionId);

  if (error) return { success: false, data: null, error: error.message };
  return { success: true, data: null, error: null };
}

export async function addTrailToCollection(
  collectionId: string,
  trailId: string,
): Promise<ServiceResult<CollectionTrail>> {
  const { data, error } = await supabase
    .from('collection_trails')
    .insert({ collection_id: collectionId, trail_id: trailId })
    .select()
    .single();

  if (error) return { success: false, data: null, error: error.message };
  return { success: true, data, error: null };
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

  if (error) return { success: false, data: null, error: error.message };
  return { success: true, data: null, error: null };
}

export type { Collection, CollectionTrail, CollectionWithTrails };
