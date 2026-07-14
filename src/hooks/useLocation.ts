import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useMapStore } from '@/stores/mapStore';
import { requestLocationPermission } from '@/lib/permissions/permissionService';
import { mpsToKmh, type RideTrackPoint } from '@/lib/geo/geoUtils';

// ============================================================
// Hook de localisation GPS
// ============================================================

interface UseLocationOptions {
  tracking?: boolean;               // suivi continu (sortie active)
  interval?: number;                // ms entre les updates
  accuracy?: Location.Accuracy;
}

/**
 * Normalise un LocationObject Expo vers un RideTrackPoint enrichi
 * (unités explicites, conversion m/s -> km/h, valeurs indisponibles
 * ramenées à null plutôt qu'à 0 pour ne jamais inventer une donnée).
 * Cette conversion reste locale au hook : elle dépend du type Expo
 * Location et n'a pas sa place dans geoUtils.ts (qui doit rester pur
 * et testable sans mock d'API native).
 */
function toRideTrackPoint(loc: Location.LocationObject): RideTrackPoint {
  const speedMps = loc.coords.speed;
  const speedKmh = speedMps != null && Number.isFinite(speedMps) && speedMps >= 0
    ? mpsToKmh(speedMps)
    : null;
  const altitudeM = loc.coords.altitude != null && Number.isFinite(loc.coords.altitude)
    ? loc.coords.altitude
    : null;
  const accuracyM = loc.coords.accuracy != null && Number.isFinite(loc.coords.accuracy)
    ? loc.coords.accuracy
    : null;
  return {
    latitude: loc.coords.latitude,
    longitude: loc.coords.longitude,
    timestamp: loc.timestamp,
    altitudeM,
    speedKmh,
    accuracyM,
  };
}

export function useLocation(options: UseLocationOptions = {}) {
  const {
    tracking = false,
    interval = 5000,
    accuracy = Location.Accuracy.Balanced,
  } = options;

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Point enrichi (altitude/vitesse/précision/horodatage) du dernier relevé.
  // Local au hook (pas dans le store carte global) : le store carte
  // n'a besoin que de lat/lon pour l'affichage, et partager un point
  // enrichi globalement forcerait tous les écrans (carte, signalement,
  // etc.) à porter un contrat GPS dont ils n'ont pas l'usage.
  const [trackPoint, setTrackPoint] = useState<RideTrackPoint | null>(null);
  const { userLocation, setUserLocation } = useMapStore();
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      const result = await requestLocationPermission();
      if (!mounted) return;

      if (!result.success) {
        setHasPermission(false);
        setError(result.error ?? 'Permission refusée');
        return;
      }
      setHasPermission(true);

      if (tracking) {
        // Suivi continu
        subscriptionRef.current = await Location.watchPositionAsync(
          { accuracy, timeInterval: interval, distanceInterval: 5 },
          (loc) => {
            if (!mounted) return;
            setUserLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
            setTrackPoint(toRideTrackPoint(loc));
          },
        );
      } else {
        // Position unique
        const loc = await Location.getCurrentPositionAsync({ accuracy });
        if (!mounted) return;
        setUserLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        setTrackPoint(toRideTrackPoint(loc));
      }
    }

    init().catch(() => {
      if (mounted) setError('Impossible d\'obtenir la position.');
    });

    return () => {
      mounted = false;
      subscriptionRef.current?.remove();
    };
  }, [tracking, interval, accuracy, setUserLocation]);

  return {
    location: userLocation,
    // Point enrichi (altitude/vitesse/précision) pour les écrans qui en
    // ont besoin (suivi de sortie). null tant qu'aucun relevé n'est reçu.
    trackPoint,
    hasPermission,
    error,
  };
}
