import { create } from 'zustand';
import type { Ride, GeoCoordinates } from '@/types/database';

// ============================================================
// Store de sortie active — Zustand
// ============================================================

interface RideState {
  activeRide: Ride | null;
  ridePoints: GeoCoordinates[];
  currentPosition: GeoCoordinates | null;
  currentSpeed: number;
  elapsedSeconds: number;
  distanceKm: number;
  isPaused: boolean;

  // Actions
  setActiveRide:       (ride: Ride | null) => void;
  addRidePoint:        (point: GeoCoordinates) => void;
  setCurrentPosition:  (pos: GeoCoordinates) => void;
  setCurrentSpeed:     (speed: number) => void;
  setElapsedSeconds:   (s: number) => void;
  setDistanceKm:       (d: number) => void;
  setIsPaused:         (paused: boolean) => void;
  resetRide:           () => void;
}

export const useRideStore = create<RideState>((set) => ({
  activeRide: null,
  ridePoints: [],
  currentPosition: null,
  currentSpeed: 0,
  elapsedSeconds: 0,
  distanceKm: 0,
  isPaused: false,

  setActiveRide:      (activeRide) => set({ activeRide }),
  addRidePoint:       (point) => set((s) => ({ ridePoints: [...s.ridePoints, point] })),
  setCurrentPosition: (currentPosition) => set({ currentPosition }),
  setCurrentSpeed:    (currentSpeed) => set({ currentSpeed }),
  setElapsedSeconds:  (elapsedSeconds) => set({ elapsedSeconds }),
  setDistanceKm:      (distanceKm) => set({ distanceKm }),
  setIsPaused:        (isPaused) => set({ isPaused }),
  resetRide: () => set({
    activeRide: null,
    ridePoints: [],
    currentPosition: null,
    currentSpeed: 0,
    elapsedSeconds: 0,
    distanceKm: 0,
    isPaused: false,
  }),
}));
