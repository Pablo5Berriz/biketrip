import React, { useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Alert,
} from 'react-native';
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
import { formatDuration } from '@/lib/geo/geoUtils';
import { colors } from '@/config/colors';

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
    ridePoints, currentSpeed,
    setActiveRide, setIsPaused, setElapsedSeconds,
    setCurrentPosition, setCurrentSpeed, addRidePoint,
    resetRide,
  } = useRideStore();

  const { location } = useLocation();

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

  const startTimer = useCallback(() => {
    stopTimer();
    timerRef.current = setInterval(() => {
      if (!isPaused) setElapsedSeconds(elapsedSeconds + 1);
    }, 1000);
  }, [elapsedSeconds, isPaused, setElapsedSeconds, stopTimer]);

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

  // Suivi de position
  useEffect(() => {
    if (!location || !activeRide || isPaused) return;

    setCurrentPosition(location);
    setCurrentSpeed(0);

    // Sauvegarde du point (toutes les 5 secondes environ via le hook useLocation)
    if (activeRide.id) {
      void saveRidePoint(activeRide.id, {
        latitude: location.latitude,
        longitude: location.longitude,
        altitude_m: null,
        speed_kmh: null,
      }).then((result) => {
        if (!result.success) {
          console.warn('[BikeTrip] Position non sauvegardée', result.error);
        }
      });
    }
    addRidePoint(location);

    // Recentre la carte
    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.005,
      longitudeDelta: 0.005,
    }, 300);
  }, [activeRide, addRidePoint, isPaused, location, setCurrentPosition, setCurrentSpeed]);

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

  const finishMutation = useMutation({
    mutationFn: () =>
      finishRide(activeRide!.id, user!.id, {
        distance_km: distanceKm,
        duration_seconds: elapsedSeconds,
      }),
    onSuccess: (result) => {
      stopTimer();
      resetRide();
      router.replace({
        pathname: '/ride/summary',
        params: { rideId: result.data?.id ?? '' },
      });
    },
  });

  function handleFinish() {
    if (elapsedSeconds < 30) {
      Alert.alert(
        'Terminer la sortie ?',
        'Tu n\'as roulé que quelques secondes. Tu veux vraiment arrêter ?',
        [
          { text: 'Continuer', style: 'cancel' },
          {
            text: 'Terminer',
            style: 'destructive',
            onPress: () => finishMutation.mutate(),
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
          onPress: () => finishMutation.mutate(),
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
          speedKmh={currentSpeed * 3.6}
          averageSpeedKmh={
            elapsedSeconds > 0 ? (distanceKm / (elapsedSeconds / 3600)) : 0
          }
        />

        {/* Boutons de contrôle */}
        <View className="flex-row items-center justify-center gap-5 mt-5">
          {/* Signaler */}
          <TouchableOpacity
            onPress={() => router.push('/reports/new')}
            className="w-12 h-12 bg-warning/10 rounded-full items-center justify-center"
          >
            <AlertTriangle size={20} color={colors.warning} />
          </TouchableOpacity>

          {/* Pause / Play */}
          <TouchableOpacity
            onPress={() => isPaused ? resumeMutation.mutate() : pauseMutation.mutate()}
            className="w-16 h-16 bg-primary-600 rounded-full items-center justify-center"
            disabled={!activeRide}
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
      >
        <Navigation size={20} color={colors.primary.DEFAULT} />
      </TouchableOpacity>
    </View>
  );
}
