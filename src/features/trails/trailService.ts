import { supabase } from '@/lib/supabase/client';
import type {
  Trail, TrailPoint, Report, TrailReview, PointOfInterest,
  ServiceResult, PaginatedResult,
} from '@/types/database';
import { trailReviewSchema, type TrailFilterFormData } from '@/lib/validations/trail';

// ============================================================
// Service des pistes cyclables
// ============================================================

const TRAILS_PAGE_SIZE = 20;

/**
 * Pistes proches d'une position GPS
 */
export async function getNearbyTrails(
  latitude: number,
  longitude: number,
  radiusKm: number = 25,
): Promise<ServiceResult<Trail[]>> {
  try {
    const { data, error } = await supabase.rpc('nearby_trails', {
      lat: latitude,
      lng: longitude,
      radius_km: radiusKm,
    });

    if (error) return { success: false, error: 'Impossible de charger les pistes proches.' };
    return { success: true, data: data ?? [] };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

/**
 * Recherche de pistes avec filtres
 */
export async function searchTrails(
  filters: TrailFilterFormData,
  page: number = 0,
): Promise<ServiceResult<PaginatedResult<Trail>>> {
  try {
    let query = supabase
      .from('trails')
      .select('*', { count: 'exact' })
      .range(page * TRAILS_PAGE_SIZE, (page + 1) * TRAILS_PAGE_SIZE - 1)
      .order('popularity_score', { ascending: false });

    if (filters.query) {
      query = query.ilike('name', `%${filters.query}%`);
    }
    if (filters.difficulty) {
      query = query.eq('difficulty', filters.difficulty);
    }
    if (filters.surface_type) {
      query = query.eq('surface_type', filters.surface_type);
    }
    if (filters.trail_type) {
      query = query.eq('trail_type', filters.trail_type);
    }
    if (filters.min_distance_km !== undefined) {
      query = query.gte('distance_km', filters.min_distance_km);
    }
    if (filters.max_distance_km !== undefined) {
      query = query.lte('distance_km', filters.max_distance_km);
    }
    if (filters.bike_type) {
      query = query.contains('recommended_bike_types', [filters.bike_type]);
    }

    const { data, error, count } = await query;

    if (error) return { success: false, error: 'Erreur lors de la recherche.' };

    return {
      success: true,
      data: {
        data: data ?? [],
        count: count ?? 0,
        hasMore: ((count ?? 0) > (page + 1) * TRAILS_PAGE_SIZE),
      },
    };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

/**
 * Détail d'une piste par ID ou slug
 */
export async function getTrailById(idOrSlug: string): Promise<ServiceResult<Trail>> {
  try {
    const isUuid = /^[0-9a-f-]{36}$/i.test(idOrSlug);
    const query = supabase.from('trails').select('*');

    const { data, error } = isUuid
      ? await query.eq('id', idOrSlug).single()
      : await query.eq('slug', idOrSlug).single();

    if (error) return { success: false, error: 'Piste introuvable.' };
    return { success: true, data };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

/**
 * Points GPS d'une piste (pour afficher le tracé)
 */
export async function getTrailPoints(trailId: string): Promise<ServiceResult<TrailPoint[]>> {
  try {
    const { data, error } = await supabase
      .from('trail_points')
      .select('*')
      .eq('trail_id', trailId)
      .order('position', { ascending: true });

    if (error) return { success: false, error: 'Impossible de charger le tracé.' };
    return { success: true, data: data ?? [] };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

/**
 * Signalements actifs sur une piste
 */
export async function getTrailReports(trailId: string): Promise<ServiceResult<Report[]>> {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('trail_id', trailId)
      .in('status', ['ACTIVE', 'CONFIRMED'])
      .order('severity', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) return { success: false, error: 'Impossible de charger les signalements.' };
    return { success: true, data: data ?? [] };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

/**
 * Avis d'une piste
 */
export async function getTrailReviews(trailId: string): Promise<ServiceResult<TrailReview[]>> {
  try {
    const { data, error } = await supabase
      .from('trail_reviews')
      .select('*, profiles(full_name, avatar_url)')
      .eq('trail_id', trailId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return { success: false, error: 'Impossible de charger les avis.' };
    return { success: true, data: data ?? [] };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

/**
 * Points d'intérêt d'une piste
 */
export async function getTrailPois(trailId: string): Promise<ServiceResult<PointOfInterest[]>> {
  try {
    const { data, error } = await supabase
      .from('points_of_interest')
      .select('*')
      .eq('trail_id', trailId)
      .order('type');

    if (error) return { success: false, error: 'Impossible de charger les points d\'intérêt.' };
    return { success: true, data: data ?? [] };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

/**
 * Ajouter un avis sur une piste
 */
export async function addTrailReview(
  trailId: string,
  userId: string,
  rating: number,
  comment?: string,
): Promise<ServiceResult<TrailReview>> {
  const parsed = trailReviewSchema.safeParse({ rating, comment });
  if (!parsed.success) {
    return {
      success: false,
      error: 'Avis invalide.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { data, error } = await supabase
      .from('trail_reviews')
      .upsert({
        trail_id: trailId,
        user_id: userId,
        rating: parsed.data.rating,
        comment: parsed.data.comment ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'trail_id,user_id' })
      .select()
      .single();

    if (error) return { success: false, error: 'Impossible d\'enregistrer ton avis.' };
    return { success: true, data };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

/**
 * Pistes populaires (page découverte)
 */
export async function getPopularTrails(limit: number = 10): Promise<ServiceResult<Trail[]>> {
  try {
    const { data, error } = await supabase
      .from('trails')
      .select('*')
      .eq('is_verified', true)
      .order('popularity_score', { ascending: false })
      .limit(limit);

    if (error) return { success: false, error: 'Impossible de charger les pistes populaires.' };
    return { success: true, data: data ?? [] };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}
