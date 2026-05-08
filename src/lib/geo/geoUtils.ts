import type { GeoCoordinates } from '@/types/database';

// ============================================================
// Utilitaires géographiques
// ============================================================

const EARTH_RADIUS_KM = 6371;

/**
 * Distance Haversine entre deux points (km)
 */
export function haversineDistance(
  a: GeoCoordinates,
  b: GeoCoordinates,
): number {
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);

  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Calcule la distance totale d'un tracé GPS
 */
export function computeTrackDistance(
  points: GeoCoordinates[],
): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineDistance(points[i - 1]!, points[i]!);
  }
  return Math.round(total * 100) / 100;
}

/**
 * Calcule le dénivelé positif et négatif à partir d'une liste d'altitudes
 */
export function computeElevation(altitudes: number[]): {
  gain: number;
  loss: number;
} {
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < altitudes.length; i++) {
    const diff = (altitudes[i] ?? 0) - (altitudes[i - 1] ?? 0);
    if (diff > 0) gain += diff;
    else loss += Math.abs(diff);
  }
  return { gain: Math.round(gain), loss: Math.round(loss) };
}

/**
 * Formater une distance en km ou m selon la valeur
 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

/**
 * Formater une durée en secondes
 */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}h${m.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Calculer la vitesse moyenne
 */
export function computeAverageSpeed(distanceKm: number, durationSeconds: number): number {
  if (durationSeconds === 0) return 0;
  const hours = durationSeconds / 3600;
  return Math.round((distanceKm / hours) * 10) / 10;
}

/**
 * Bounding box d'un set de points (pour centrer la carte)
 */
export function getBoundingBox(points: GeoCoordinates[]): {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
} | null {
  if (points.length === 0) return null;
  const lats = points.map(p => p.latitude);
  const lngs = points.map(p => p.longitude);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}
