import { create } from 'zustand';
import type { Ride } from '@/types/database';
import {
  type RideTrackPoint,
  type RideAccumulator,
  createRideAccumulator,
  ingestTrackPoint,
} from '@/lib/geo/geoUtils';

// ============================================================
// Store de sortie active — Zustand
// ============================================================
// BIKETRIP-P0-RIDE-001 : distanceKm/maxSpeedKmh/elevationGainM/
// elevationLossM sont désormais dérivés d'un accumulateur mis à jour de
// façon incrémentale (voir ingestTrackPoint dans src/lib/geo/geoUtils.ts)
// au lieu d'être des setters manuels jamais appelés par l'UI.

interface RideState {
  activeRide: Ride | null;
  ridePoints: RideTrackPoint[];
  currentPosition: RideTrackPoint | null;
  currentSpeedKmh: number;
  maxSpeedKmh: number;
  elevationGainM: number;
  elevationLossM: number;
  elapsedSeconds: number;
  distanceKm: number;
  isPaused: boolean;
  /** État interne du calcul incrémental — non destiné à un usage direct par l'UI. */
  accumulator: RideAccumulator;

  // Actions
  setActiveRide:      (ride: Ride | null) => void;
  /**
   * Intègre un nouveau point GPS brut. Retourne true si le point a été
   * accepté (coordonnées plausibles, précision suffisante, horodatage
   * cohérent, vitesse implicite plausible pour un vélo) et a donc mis à
   * jour distanceKm/maxSpeedKmh/elevationGainM/elevationLossM/ridePoints.
   * Un point rejeté ne modifie aucun agrégat (cf. geoUtils.ingestTrackPoint).
   */
  ingestPoint:        (point: RideTrackPoint) => boolean;
  setElapsedSeconds:  (value: number | ((prev: number) => number)) => void;
  setIsPaused:        (paused: boolean) => void;
  resetRide:          () => void;
}

export const useRideStore = create<RideState>((set, get) => ({
  activeRide: null,
  ridePoints: [],
  currentPosition: null,
  currentSpeedKmh: 0,
  maxSpeedKmh: 0,
  elevationGainM: 0,
  elevationLossM: 0,
  elapsedSeconds: 0,
  distanceKm: 0,
  isPaused: false,
  accumulator: createRideAccumulator(),

  setActiveRide: (activeRide) => set({ activeRide }),

  ingestPoint: (point) => {
    const { accumulator } = get();
    const result = ingestTrackPoint(accumulator, point);
    if (!result.accepted) {
      return false;
    }
    set((s) => ({
      accumulator: result.accumulator,
      distanceKm: result.accumulator.distanceKm,
      maxSpeedKmh: result.accumulator.maxSpeedKmh,
      elevationGainM: result.accumulator.elevationGainM,
      elevationLossM: result.accumulator.elevationLossM,
      currentSpeedKmh: result.currentSpeedKmh ?? 0,
      currentPosition: point,
      ridePoints: [...s.ridePoints, point],
    }));
    return true;
  },

  setElapsedSeconds: (value) => set((s) => ({
    elapsedSeconds: typeof value === 'function' ? value(s.elapsedSeconds) : value,
  })),

  setIsPaused: (isPaused) => set({
    isPaused,
    // En pause : la vitesse affichée doit être zéro et aucun nouveau
    // point ne doit contribuer aux agrégats (directive RIDE-001, §6).
    currentSpeedKmh: isPaused ? 0 : get().currentSpeedKmh,
  }),

  resetRide: () => set({
    activeRide: null,
    ridePoints: [],
    currentPosition: null,
    currentSpeedKmh: 0,
    maxSpeedKmh: 0,
    elevationGainM: 0,
    elevationLossM: 0,
    elapsedSeconds: 0,
    distanceKm: 0,
    isPaused: false,
    accumulator: createRideAccumulator(),
  }),
}));
