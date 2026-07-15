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

// ============================================================
// Suivi de sortie — types, seuils et calcul incrémental
// (BIKETRIP-P0-RIDE-001)
// ============================================================

/**
 * Point de suivi GPS enrichi capturé pendant une sortie active.
 * Unités explicites dans les noms de champs (règle du lot RIDE-001).
 */
export interface RideTrackPoint {
  latitude: number;
  longitude: number;
  /** Horodatage en millisecondes depuis epoch (Date.now() / loc.timestamp Expo). */
  timestamp: number;
  altitudeM: number | null;
  speedKmh: number | null;
  accuracyM?: number | null;
}

/**
 * État accumulé d'une sortie, mis à jour de façon incrémentale à chaque
 * nouveau point accepté. Évite de recalculer l'intégralité du tracé à
 * chaque rendu (cf. directive BIKETRIP-P0-RIDE-001, étape 5).
 */
export interface RideAccumulator {
  distanceKm: number;
  maxSpeedKmh: number;
  elevationGainM: number;
  elevationLossM: number;
  lastValidPoint: RideTrackPoint | null;
}

/**
 * Précision GPS minimale acceptée, en mètres (rayon d'incertitude
 * horizontale rapporté par le capteur). Un point moins précis que ce
 * seuil est jugé trop peu fiable pour contribuer à la distance, à la
 * vitesse ou au dénivelé d'une sortie à vélo.
 */
export const GPS_MIN_ACCURACY_M = 30;

/**
 * Vitesse maximale physiquement plausible pour une sortie à vélo, en
 * km/h. Un déplacement impliquant une vitesse supérieure entre deux
 * points GPS consécutifs est considéré comme un artefact de
 * positionnement (saut de position) et rejeté, plutôt que comptabilisé
 * comme un record de vitesse. Seuil unique réutilisé à la fois pour la
 * vitesse implicite (déplacement/temps) et pour la vitesse rapportée par
 * le capteur (BIKETRIP-P0-RIDE-002) afin d'éviter deux règles concurrentes.
 */
export const GPS_MAX_PLAUSIBLE_SPEED_KMH = 80;

/**
 * Seuil de bruit altimétrique, en mètres. Les capteurs de localisation
 * grand public ont une précision verticale de l'ordre de plusieurs
 * mètres ; une variation d'altitude inférieure à ce seuil entre deux
 * points consécutifs est ignorée pour éviter de cumuler du dénivelé
 * fictif provoqué par le bruit du capteur plutôt que par un vrai relief.
 */
export const ELEVATION_NOISE_THRESHOLD_M = 3;

/**
 * Accumulateur initial (aucun point encore intégré).
 */
export function createRideAccumulator(): RideAccumulator {
  return {
    distanceKm: 0,
    maxSpeedKmh: 0,
    elevationGainM: 0,
    elevationLossM: 0,
    lastValidPoint: null,
  };
}

/**
 * Convertit une vitesse de mètres par seconde (unité native
 * `coords.speed` d'Expo Location) vers kilomètres par heure.
 */
export function mpsToKmh(speedMps: number): number {
  return speedMps * 3.6;
}

function isPlausibleCoordinate(latitude: number, longitude: number): boolean {
  return (
    Number.isFinite(latitude) && Number.isFinite(longitude) &&
    latitude >= -90 && latitude <= 90 &&
    longitude >= -180 && longitude <= 180
  );
}

export interface IngestResult {
  accumulator: RideAccumulator;
  accepted: boolean;
  /** Vitesse instantanée retenue pour ce point (km/h), ou null si indisponible. */
  currentSpeedKmh: number | null;
}

/**
 * Intègre un nouveau point GPS brut dans l'accumulateur d'une sortie.
 *
 * Fonction pure et déterministe : aucun état React/Zustand, aucun accès
 * réseau, aucune dépendance à un GPS réel — entièrement testable avec
 * une séquence de points fixe.
 *
 * Le point est rejeté (accepted=false, accumulateur inchangé) lorsque :
 *  - les coordonnées sont invalides (hors bornes ou non finies) ;
 *  - la précision GPS dépasse {@link GPS_MIN_ACCURACY_M} ;
 *  - l'horodatage est manquant, non fini, égal ou antérieur au point
 *    précédent (protection anti double-comptage / anti régression) ;
 *  - le déplacement implique une vitesse supérieure à
 *    {@link GPS_MAX_PLAUSIBLE_SPEED_KMH} (saut de position aberrant).
 *
 * Un point rejeté n'augmente jamais la distance ni la vitesse maximale
 * (exigence explicite de la directive BIKETRIP-P0-RIDE-001, étape 4).
 *
 * La vitesse instantanée privilégie la valeur rapportée par le capteur
 * (`raw.speedKmh`, dérivée de `coords.speed`) lorsqu'elle est valide,
 * positive et ne dépasse pas {@link GPS_MAX_PLAUSIBLE_SPEED_KMH} (même
 * seuil que pour la vitesse implicite — une vitesse capteur aberrante ne
 * peut jamais contaminer `currentSpeedKmh`/`maxSpeedKmh`, y compris sur le
 * premier point de la sortie) ; sinon elle retombe sur un calcul
 * distance/temps entre les deux derniers points valides, ou sur `null`
 * si aucun point précédent n'est disponible pour ce calcul
 * (BIKETRIP-P0-RIDE-002).
 *
 * Le dénivelé compare l'altitude du point courant à celle du dernier
 * point valide : une variation absolue inférieure à
 * {@link ELEVATION_NOISE_THRESHOLD_M} est ignorée (bruit altimétrique).
 * Aucun dénivelé n'est inventé lorsque l'altitude est indisponible sur
 * l'un des deux points.
 */
export function ingestTrackPoint(
  acc: RideAccumulator,
  raw: RideTrackPoint,
): IngestResult {
  if (!isPlausibleCoordinate(raw.latitude, raw.longitude)) {
    return { accumulator: acc, accepted: false, currentSpeedKmh: null };
  }
  if (raw.accuracyM != null && raw.accuracyM > GPS_MIN_ACCURACY_M) {
    return { accumulator: acc, accepted: false, currentSpeedKmh: null };
  }
  if (!Number.isFinite(raw.timestamp)) {
    return { accumulator: acc, accepted: false, currentSpeedKmh: null };
  }

  // BIKETRIP-P0-RIDE-002 : la vitesse rapportée par le capteur (raw.speedKmh,
  // dérivée de coords.speed) doit être bornée par la même constante que la
  // vitesse implicite (GPS_MAX_PLAUSIBLE_SPEED_KMH) — une vitesse capteur
  // aberrante (bruit matériel, saut GPS, valeur mal normalisée en amont,
  // etc.) ne doit jamais pouvoir contaminer currentSpeedKmh/maxSpeedKmh, y
  // compris sur le tout premier point de la sortie (aucun déplacement
  // disponible pour la valider par comparaison). Une seule constante de
  // seuil est utilisée pour les deux vitesses (capteur et implicite) afin
  // d'éviter deux règles concurrentes.
  const deviceSpeedKmh = raw.speedKmh != null
    && Number.isFinite(raw.speedKmh)
    && raw.speedKmh >= 0
    && raw.speedKmh <= GPS_MAX_PLAUSIBLE_SPEED_KMH
    ? raw.speedKmh
    : null;

  // Premier point valide de la sortie : rien à comparer, aucune distance
  // ni vitesse par déplacement calculable.
  if (!acc.lastValidPoint) {
    const currentSpeedKmh = deviceSpeedKmh;
    const maxSpeedKmh = currentSpeedKmh != null
      ? Math.max(acc.maxSpeedKmh, currentSpeedKmh)
      : acc.maxSpeedKmh;
    return {
      accumulator: { ...acc, maxSpeedKmh, lastValidPoint: raw },
      accepted: true,
      currentSpeedKmh,
    };
  }

  const deltaTimeS = (raw.timestamp - acc.lastValidPoint.timestamp) / 1000;
  if (!Number.isFinite(deltaTimeS) || deltaTimeS <= 0) {
    return { accumulator: acc, accepted: false, currentSpeedKmh: null };
  }

  const segmentDistanceKm = haversineDistance(acc.lastValidPoint, raw);
  const impliedSpeedKmh = segmentDistanceKm / (deltaTimeS / 3600);

  if (!Number.isFinite(impliedSpeedKmh) || impliedSpeedKmh > GPS_MAX_PLAUSIBLE_SPEED_KMH) {
    return { accumulator: acc, accepted: false, currentSpeedKmh: null };
  }

  const currentSpeedKmh = deviceSpeedKmh ?? impliedSpeedKmh;

  let elevationGainM = acc.elevationGainM;
  let elevationLossM = acc.elevationLossM;
  if (acc.lastValidPoint.altitudeM != null && raw.altitudeM != null) {
    const altitudeDeltaM = raw.altitudeM - acc.lastValidPoint.altitudeM;
    if (Math.abs(altitudeDeltaM) >= ELEVATION_NOISE_THRESHOLD_M) {
      if (altitudeDeltaM > 0) elevationGainM += altitudeDeltaM;
      else elevationLossM += Math.abs(altitudeDeltaM);
    }
  }

  return {
    accumulator: {
      distanceKm: acc.distanceKm + segmentDistanceKm,
      maxSpeedKmh: Math.max(acc.maxSpeedKmh, currentSpeedKmh),
      elevationGainM,
      elevationLossM,
      lastValidPoint: raw,
    },
    accepted: true,
    currentSpeedKmh,
  };
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
