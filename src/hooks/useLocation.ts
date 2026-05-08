import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { useMapStore } from '@/stores/mapStore';
import { requestLocationPermission } from '@/lib/permissions/permissionService';

// ============================================================
// Hook de localisation GPS
// ============================================================

interface UseLocationOptions {
  tracking?: boolean;               // suivi continu (sortie active)
  interval?: number;                // ms entre les updates
  accuracy?: Location.Accuracy;
}

export function useLocation(options: UseLocationOptions = {}) {
  const {
    tracking = false,
    interval = 5000,
    accuracy = Location.Accuracy.Balanced,
  } = options;

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  return { location: userLocation, hasPermission, error };
}
