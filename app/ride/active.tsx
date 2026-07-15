import React, { useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Alert,
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Polyline, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Pause, Play, StopCircle, AlertTriangle, Navigation } from 'lucide-react-native';
import { useRideStore } from '@/stores/rideStore';
import { useUser } from '@/stores/authStore';
import { useLocation } from '@/hooks/useLocation';
import { startRide, pauseRide, resumeRide, finishRide, saveRidePoint } from '@/features/rides/rideService';
import { getTrailById } from '@/features/trails/trailService';
import { RideTrackingPanel } from '@/components/rides/StatTile';
import { formatDuration, computeAverageSpeed } from '@/lib/geo/geoUtils';
import { colors } from '@/config/colors';

// Cadence et précision du suivi GPS pendant une sortie active. Plus
// resserrées que les valeurs par défaut du hook (interval=5000ms,
// Balanced) utilisées par les écrans d'affichage simple (carte,
// accueil) : le calcul de vitesse/distance d'une sortie à vélo profite
// d'une précision et d'une fréquence de relevé plus élevées. Reste en
// mode FOREGROUND_TRACKING uniquement (watchPositionAsync, pas de
// TaskManager ni de service arrière-plan).
const RIDE_TRACKING_INTERVAL_MS = 3000;
const RIDE_TRACKING_ACCURACY = Location.Accuracy.High;

// ============================================================
// Écran Sortie active — GPS + suivi en temps réel
// ============================================================

export default function ActiveRideScreen() {
  const { trailId } = useLocalSearchParams<{ trailId?: string }>();
  const user = useUser();
  const mapRef = useRef<MapView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    activeRide, isPaused, elapsedSeconds, distanceKm,
    ridePoints, currentSpeedKmh, maxSpeedKmh, elevationGainM, elevationLossM,
    setActiveRide, setIsPaused, setElapsedSeconds,
    ingestPoint,
    resetRide,
  } = useRideStore();

  // tracking:true — sans cette option le hook ne fait qu'une capture de
  // position unique (getCurrentPositionAsync) et ne s'abonne jamais à
  // watchPositionAsync : c'est la cause racine de distanceKm figé à 0
  // constatée dans l'audit. Mode FOREGROUND_TRACKING uniquement.
  const { location, trackPoint, hasPermission, error: locationError } = useLocation({
    tracking: true,
    interval: RIDE_TRACKING_INTERVAL_MS,
    accuracy: RIDE_TRACKING_ACCURACY,
  });

  // Piste sélectionnée (optionnelle)
  const trailQuery = useQuery({
    queryKey: ['trail', trailId],
    queryFn: () => getTrailById(trailId!),
    enabled: !!trailId,
    staleTime: 1000 * 60 * 5,
  });

  const trail = trailQuery.data?.data;

  // ─── Démarrage ────────────────────────────────────────────

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // NOTE (correctif RIDE-001) : la version précédente lisait `elapsedSeconds`
  // capturé par fermeture au moment de la création de l'intervalle et le
  // réutilisait à chaque tick (`setElapsedSeconds(elapsedSeconds + 1)`),
  // ce qui figeait le compteur au lieu de l'incrémenter (bug de closure
  // React classique). setElapsedSeconds accepte désormais un updater
  // fonctionnel `(prev) => prev + 1`, lu sur l'état réel au moment de
  // l'exécution — plus de dépendance à `elapsedSeconds`/`isPaused` ici,
  // ils ne servent plus qu'à démarrer/arrêter l'intervalle (déjà fait
  // explicitement par pause/reprise, donc le garde-fou interne devient
  // inutile et est retiré pour éviter la confusion).
  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  }, [setElapsedSeconds, stopTimer]);

  const startMutation = useMutation({
    mutationFn: () =>
      startRide(user!.id, trailId),
    onSuccess: (result) => {
      if (result.data) {
        setActiveRide(result.data);
        startTimer();
      }
    },
  });

  // Démarrage auto à l'arrivée sur l'écran
  useEffect(() => {
    if (!activeRide && user?.id) {
      startMutation.mutate();
    }
    return () => stopTimer();
  }, [activeRide, startMutation, stopTimer, user?.id]);

  // Suivi de position — intègre chaque nouveau relevé GPS enrichi dans
  // l'accumulateur de sortie (distance/vitesse/dénivelé, voir
  // ingestTrackPoint dans geoUtils.ts). Aucun point n'est traité pendant
  // une pause (ni calcul, ni sauvegarde), conformément à la directive.
  useEffect(() => {
    if (!trackPoint || !activeRide || isPaused) return;

    const accepted = ingestPoint(trackPoint);
    // Un point rejeté (précision insuffisante, saut de position aberrant,
    // horodatage incohérent) n'augmente jamais la distance ni la vitesse
    // maximale — voir geoUtils.ingestTrackPoint. On ne recentre pas non
    // plus la carte sur un point jugé non fiable.
    if (!accepted) return;

    if (activeRide.id) {
      void saveRidePoint(activeRide.id, {
        latitude: trackPoint.latitude,
        longitude: trackPoint.longitude,
        altitude_m: trackPoint.altitudeM,
        speed_kmh: trackPoint.speedKmh,
      }).then((result) => {
        if (!result.success) {
          console.warn('[BikeTrip] Position non sauvegardée', result.error);
        }
      });
    }

    // Recentre la carte
    mapRef.current?.animateToRegion({
      latitude: trackPoint.latitude,
      longitude: trackPoint.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }, 300);
  }, [activeRide, ingestPoint, isPaused, trackPoint]);

  // ─── Pause / Reprise ──────────────────────────────────────

  const pauseMutation = useMutation({
    mutationFn: () => pauseRide(activeRide!.id, user!.id),
    onSuccess: () => {
      setIsPaused(true);
      stopTimer();
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => resumeRide(activeRide!.id, user!.id),
    onSuccess: () => {
      setIsPaused(false);
      startTimer();
    },
  });

  // ─── Terminer ─────────────────────────────────────────────

  // Empêche une double finalisation (double-tap sur "Terminer" avant que
  // la mutation ne soit marquée pending) : la source de vérité des
  // agrégats persistés doit rester le même relevé que celui affiché.
  const hasFinishedRef = useRef(false);

  const finishMutation = useMutation({
    mutationFn: () => {
      // Arrondis appliqués uniquement à la persistance (pas pendant
      // l'accumulation, pour ne pas composer d'erreurs d'arrondi).
      const roundedDistanceKm = Math.round(distanceKm * 100) / 100;
      const averageSpeedKmh = computeAverageSpeed(distanceKm, elapsedSeconds);
      return finishRide(activeRide!.id, user!.id, {
        distance_km: roundedDistanceKm,
        duration_seconds: elapsedSeconds,
        average_speed_kmh: averageSpeedKmh,
        max_speed_kmh: Math.round(maxSpeedKmh * 10) / 10,
        elevation_gain_m: Math.round(elevationGainM),
        elevation_loss_m: Math.round(elevationLossM),
      });
    },
    onSuccess: (result) => {
      stopTimer();
      resetRide();
      router.replace({
        pathname: '/ride/summary',
        params: { rideId: result.data?.id ?? '' },
      });
    },
    onError: () => {
      // Permet une nouvelle tentative si la sauvegarde réseau échoue.
      hasFinishedRef.current = false;
    },
  });

  function handleFinish() {
    if (hasFinishedRef.current || finishMutation.isPending) return;
    if (elapsedSeconds < 30) {
      Alert.alert(
        'Terminer la sortie ?',
        'Tu n\'as roulé que quelques secondes. Tu veux vraiment arrêter ?',
        [
          { text: 'Continuer', style: 'cancel' },
          {
            text: 'Terminer',
            style: 'destructive',
            onPress: () => {
              hasFinishedRef.current = true;
              finishMutation.mutate();
            },
          },
        ],
      );
      return;
    }
    Alert.alert(
      'Terminer la sortie',
      `Tu as parcouru ${distanceKm.toFixed(2)} km en ${formatDuration(elapsedSeconds)}. Terminer ?`,
      [
        { text: 'Continuer', style: 'cancel' },
        {
          text: 'Terminer',
          style: 'destructive',
          onPress: () => {
            hasFinishedRef.current = true;
            finishMutation.mutate();
          },
        },
      ],
    );
  }

  // ─── Rendu ────────────────────────────────────────────────

  const polylineCoords = ridePoints.map((p) => ({
    latitude: p.latitude,
    longitude: p.longitude,
  }));

  const initialRegion = location
    ? {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }
    : { latitude: 46.81, longitude: -71.21, latitudeDelta: 0.1, longitudeDelta: 0.1 };

  // Vitesse moyenne en mouvement = distance valide / durée active
  // (elapsedSeconds n'incrémente déjà pas pendant une pause, cf. startTimer
  // ci-dessus). Calcul déplacé hors JSX (fonction pure, testée).
  const averageSpeedKmh = computeAverageSpeed(distanceKm, elapsedSeconds);

  return (
    <View style={{ flex: 1 }}>
      {/* Carte */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={false}
        mapType="standard"
      >
        {/* Tracé */}
        {polylineCoords.length >= 2 && (
          <Polyline
            coordinates={polylineCoords}
            strokeColor={colors.primary.DEFAULT}
            strokeWidth={4}
          />
        )}
        {/* Point de départ */}
        {polylineCoords[0] && (
          <Marker coordinate={polylineCoords[0]} anchor={{ x: 0.5, y: 0.5 }}>
            <View
              style={{
                width: 16, height: 16, borderRadius: 8,
                backgroundColor: colors.primary.DEFAULT,
                borderWidth: 3, borderColor: 'white',
              }}
            />
          </Marker>
        )}
      </MapView>

      {/* Panneau de stats en bas */}
      <View
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: 'white',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 40,
          shadowColor: '#000',
          shadowOpacity: 0.15,
          shadowRadius: 20,
          elevation: 20,
        }}
      >
        <View className="w-12 h-1 bg-border rounded-full self-center mb-4" />

        {/* Indicateur pause/actif */}
        {isPaused && (
          <View className="bg-warning/10 rounded-xl py-2 px-4 mb-3 flex-row items-center gap-2">
            <Pause size={14} color={colors.warning} />
            <Text className="text-warning text-sm font-semibold">Sortie en pause</Text>
          </View>
        )}

        {/* Nom de la piste */}
        {trail && (
          <Text className="text-xs text-slate mb-3 text-center" numberOfLines={1}>
            {trail.name}
          </Text>
        )}

        <RideTrackingPanel
          distanceKm={distanceKm}
          durationSeconds={elapsedSeconds}
          speedKmh={currentSpeedKmh}
          averageSpeedKmh={averageSpeedKmh}
        />

        {/* Boutons de contrôle */}
        <View className="flex-row items-center justify-center gap-5 mt-5">
          {/* Signaler */}
          <TouchableOpacity
            onPress={() => router.push('/reports/new')}
            className="w-12 h-12 bg-warning/10 rounded-full items-center justify-center"
            accessibilityRole="button"
            accessibilityLabel="Signaler un problème pendant la sortie"
          >
            <AlertTriangle size={20} color={colors.warning} />
          </TouchableOpacity>

          {/* Pause / Play */}
          <TouchableOpacity
            onPress={() => isPaused ? resumeMutation.mutate() : pauseMutation.mutate()}
            className="w-16 h-16 bg-primary-600 rounded-full items-center justify-center"
            disabled={!activeRide}
            accessibilityRole="button"
            accessibilityLabel={isPaused ? 'Reprendre la sortie' : 'Mettre la sortie en pause'}
          >
            {isPaused ? (
              <Play size={28} color="white" fill="white" />
            ) : (
              <Pause size={28} color="white" />
            )}
          </TouchableOpacity>

          {/* Terminer */}
          <TouchableOpacity
            onPress={handleFinish}
            className="w-12 h-12 bg-danger/10 rounded-full items-center justify-center"
            disabled={finishMutation.isPending}
            accessibilityRole="button"
            accessibilityLabel="Terminer la sortie"
          >
            <StopCircle size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bouton recentrer */}
      <TouchableOpacity
        onPress={() => {
          if (location) {
            mapRef.current?.animateToRegion({
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }, 500);
          }
        }}
        style={{
          position: 'absolute', top: 60, right: 16,
        }}
        className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-float"
        accessibilityRole="button"
        accessibilityLabel="Recentrer la carte sur ma position"
      >
        <Navigation size={20} color={colors.primary.DEFAULT} />
      </TouchableOpacity>

      {(hasPermission === false || locationError) && (
        <View
          style={{ position: 'absolute', top: 116, left: 16, right: 16 }}
          className="bg-white rounded-2xl border border-warning/40 p-4 shadow-float"
        >
          <Text className="text-carbon font-semibold text-sm">Localisation indisponible</Text>
          <Text className="text-slate text-xs mt-1">
            Active la permission de localisation pour enregistrer précisément ta sortie.
          </Text>
        </View>
      )}
    </View>
  );
}
