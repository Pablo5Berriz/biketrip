import { supabase } from '@/lib/supabase/client';
import { uploadImage } from '@/lib/storage/imageUpload';
import type { Report, ReportVote, ServiceResult } from '@/types/database';
import type { CreateReportFormData } from '@/lib/validations/report';

// ============================================================
// Service des signalements communautaires
// ============================================================

/**
 * Créer un signalement
 */
export async function createReport(
  data: CreateReportFormData,
  userId: string,
): Promise<ServiceResult<Report>> {
  try {
    let imageUrl: string | null = null;

    // Upload image si fournie
    if (data.image_uri) {
      const uploadResult = await uploadImage(data.image_uri, 'report-images', userId);
      if (!uploadResult.success) {
        return { success: false, error: 'Impossible d\'uploader l\'image.' };
      }
      imageUrl = uploadResult.data ?? null;
    }

    // Durée d'expiration selon gravité
    const expiresAt = computeExpiresAt(data.severity ?? 'MEDIUM');

    const { data: report, error } = await supabase
      .from('reports')
      .insert({
        user_id: userId,
        trail_id: data.trail_id ?? null,
        type: data.type,
        title: data.title.trim(),
        description: data.description?.trim() ?? null,
        severity: data.severity ?? 'MEDIUM',
        latitude: data.latitude,
        longitude: data.longitude,
        image_url: imageUrl,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) return { success: false, error: 'Impossible de créer le signalement.' };
    return { success: true, data: report };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

/**
 * Voter sur un signalement (confirmer ou marquer résolu)
 */
export async function voteOnReport(
  reportId: string,
  userId: string,
  voteType: 'CONFIRM' | 'RESOLVED',
): Promise<ServiceResult<ReportVote>> {
  try {
    const { data, error } = await supabase
      .from('report_votes')
      .insert({ report_id: reportId, user_id: userId, vote_type: voteType })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Tu as déjà voté sur ce signalement.' };
      }
      return { success: false, error: 'Vote impossible.' };
    }
    return { success: true, data };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

/**
 * Supprimer son vote
 */
export async function removeVote(
  reportId: string,
  userId: string,
  voteType: 'CONFIRM' | 'RESOLVED',
): Promise<ServiceResult> {
  try {
    const { error } = await supabase
      .from('report_votes')
      .delete()
      .eq('report_id', reportId)
      .eq('user_id', userId)
      .eq('vote_type', voteType);

    if (error) return { success: false, error: 'Impossible de supprimer le vote.' };
    return { success: true };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

/**
 * Signalements proches d'une position GPS
 */
export async function getNearbyReports(
  latitude: number,
  longitude: number,
  radiusKm: number = 5,
): Promise<ServiceResult<Report[]>> {
  try {
    const { data, error } = await supabase.rpc('nearby_reports', {
      lat: latitude,
      lng: longitude,
      radius_km: radiusKm,
    });

    if (error) return { success: false, error: 'Impossible de charger les signalements.' };
    return { success: true, data: data ?? [] };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

/**
 * Signalements actifs sur une piste
 */
export async function getActiveReportsForTrail(trailId: string): Promise<ServiceResult<Report[]>> {
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
 * Modifier un signalement (auteur seulement)
 */
export async function updateReport(
  reportId: string,
  userId: string,
  updates: Partial<Pick<Report, 'title' | 'description' | 'severity' | 'status'>>,
): Promise<ServiceResult<Report>> {
  try {
    const { data, error } = await supabase
      .from('reports')
      .update(updates)
      .eq('id', reportId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) return { success: false, error: 'Mise à jour impossible.' };
    return { success: true, data };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

// ============================================================
// Utilitaires
// ============================================================

function computeExpiresAt(severity: string): string {
  const durations: Record<string, number> = {
    LOW: 7,
    MEDIUM: 14,
    HIGH: 21,
    CRITICAL: 30,
  };
  const days = durations[severity] ?? 14;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}
