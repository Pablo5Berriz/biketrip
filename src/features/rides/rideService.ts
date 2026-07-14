import { supabase } from '@/lib/supabase/client';
import type { Ride, RidePoint, ServiceResult } from '@/types/database';
import { rideNotesSchema, type RideNotesFormData } from '@/lib/validations/ride';
import { computeAverageSpeed } from '@/lib/geo/geoUtils';

// ============================================================
// Service de suivi des sorties vélo
// ============================================================

/**
 * Démarrer une nouvelle sortie
 */
export async function startRide(
  userId: string,
  trailId?: string,
): Promise<ServiceResult<Ride>> {
  try {
    const { data, error } = await supabase
      .from('rides')
      .insert({
        user_id: userId,
        trail_id: trailId ?? null,
        status: 'ACTIVE',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return { success: false, error: 'Impossible de démarrer la sortie.' };
    return { success: true, data };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

/**
 * Mettre en pause une sortie
 */
export async function pauseRide(rideId: string, userId: string): Promise<ServiceResult<Ride>> {
  try {
    const { data, error } = await supabase
      .from('rides')
      .update({ status: 'PAUSED' })
      .eq('id', rideId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return { success: false, error: 'Impossible de mettre en pause.' };
    return { success: true, data };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

/**
 * Reprendre une sortie en pause
 */
export async function resumeRide(rideId: string, userId: string): Promise<ServiceResult<Ride>> {
  try {
    const { data, error } = await supabase
      .from('rides')
      .update({ status: 'ACTIVE' })
      .eq('id', rideId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return { success: false, error: 'Impossible de reprendre la sortie.' };
    return { success: true, data };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

/**
 * Terminer une sortie et enregistrer les statistiques
 */
export async function finishRide(
  rideId: string,
  userId: string,
  stats: {
    distance_km: number;
    duration_seconds: number;
    average_speed_kmh?: number;
    max_speed_kmh?: number;
    elevation_gain_m?: number;
    elevation_loss_m?: number;
    weather_summary?: string;
    notes?: string;
    title?: string;
  },
): Promise<ServiceResult<Ride>> {
  try {
    const { data, error } = await supabase
      .from('rides')
      .update({
        ...stats,
        status: 'COMPLETED',
        ended_at: new Date().toISOString(),
      })
      .eq('id', rideId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return { success: false, error: 'Impossible d\'enregistrer la sortie.' };
    return { success: true, data };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

/**
 * Annuler une sortie
 */
export async function cancelRide(rideId: string, userId: string): Promise<ServiceResult> {
  try {
    const { error } = await supabase
      .from('rides')
      .update({ status: 'CANCELLED', ended_at: new Date().toISOString() })
      .eq('id', rideId)
      .eq('user_id', userId);

    if (error) return { success: false, error: 'Annulation impossible.' };
    return { success: true };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

/**
 * Charger une sortie appartenant à l'utilisateur courant.
 */
export async function getRideById(
  rideId: string,
  userId: string,
): Promise<ServiceResult<Ride>> {
  if (!userId) return { success: false, error: 'Non authentifié' };

  try {
    const { data, error } = await supabase
      .from('rides')
      .select('*')
      .eq('id', rideId)
      .eq('user_id', userId)
      .single();

    if (error) return { success: false, error: 'Sortie introuvable.' };
    return { success: true, data };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

/**
 * Mettre à jour les notes/titre d'une sortie appartenant à l'utilisateur.
 */
export async function updateRideNotes(
  rideId: string,
  userId: string,
  input: RideNotesFormData,
): Promise<ServiceResult<Ride>> {
  if (!userId) return { success: false, error: 'Non authentifié' };

  const parsed = rideNotesSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: 'Notes invalides.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { data, error } = await supabase
      .from('rides')
      .update({
        ...parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rideId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return { success: false, error: 'Impossible de sauvegarder les notes.' };
    return { success: true, data };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

/**
 * Enregistrer un point GPS pendant la sortie
 */
export async function saveRidePoint(
  rideId: string,
  point: Omit<RidePoint, 'id' | 'ride_id' | 'recorded_at'>,
): Promise<ServiceResult<RidePoint>> {
  try {
    const { data, error } = await supabase
      .from('ride_points')
      .insert({ ride_id: rideId, ...point, recorded_at: new Date().toISOString() })
      .select()
      .single();

    if (error) return { success: false, error: 'Impossible d\'enregistrer la position.' };
    return { success: true, data };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

/**
 * Historique des sorties de l'utilisateur
 */
export async function getRideHistory(
  userId: string,
  page: number = 0,
): Promise<ServiceResult<Ride[]>> {
  try {
    const { data, error } = await supabase
      .from('rides')
      .select('*, trails(name, difficulty)')
      .eq('user_id', userId)
      .eq('status', 'COMPLETED')
      .order('started_at', { ascending: false })
      .range(page * 20, (page + 1) * 20 - 1);

    if (error) return { success: false, error: 'Impossible de charger l\'historique.' };
    return { success: true, data: data ?? [] };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

/**
 * Résumé statistique global d'un utilisateur.
 *
 * BIKETRIP-P0-RIDE-001 : averageSpeedKmh et maxSpeedKmh sont désormais
 * réellement calculés (auparavant absents de la réponse alors que
 * StatsTab les consommait déjà via un fallback silencieux à 0, cf.
 * audit — module "Statistiques agregees (getRideStats)").
 * maxSpeedKmh = maximum des vitesses max individuelles des sorties.
 * averageSpeedKmh = moyenne pondérée par distance/durée active sur
 * l'ensemble des sorties (distance totale / durée active totale),
 * cohérente avec le calcul par sortie (computeAverageSpeed).
 */
export async function getRideStats(userId: string): Promise<ServiceResult<{
  totalRides: number;
  totalDistanceKm: number;
  totalDurationSeconds: number;
  totalElevationGainM: number;
  averageSpeedKmh: number;
  maxSpeedKmh: number;
}>> {
  try {
    const { data, error } = await supabase
      .from('rides')
      .select('distance_km, duration_seconds, elevation_gain_m, max_speed_kmh')
      .eq('user_id', userId)
      .eq('status', 'COMPLETED');

    if (error) return { success: false, error: 'Impossible de charger les statistiques.' };

    const aggregates = (data ?? []).reduce(
      (acc, ride) => ({
        totalRides: acc.totalRides + 1,
        totalDistanceKm: acc.totalDistanceKm + (ride.distance_km ?? 0),
        totalDurationSeconds: acc.totalDurationSeconds + (ride.duration_seconds ?? 0),
        totalElevationGainM: acc.totalElevationGainM + (ride.elevation_gain_m ?? 0),
        maxSpeedKmh: Math.max(acc.maxSpeedKmh, ride.max_speed_kmh ?? 0),
      }),
      {
        totalRides: 0, totalDistanceKm: 0, totalDurationSeconds: 0,
        totalElevationGainM: 0, maxSpeedKmh: 0,
      },
    );

    return {
      success: true,
      data: {
        ...aggregates,
        averageSpeedKmh: computeAverageSpeed(aggregates.totalDistanceKm, aggregates.totalDurationSeconds),
      },
    };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}
