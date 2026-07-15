import { create } from 'zustand';
import type { GeoCoordinates } from '@/types/database';
import type { TrailDifficulty, SurfaceType, TrailType } from '@/types/database';

// ============================================================
// Store carte — filtres et état de la carte
// ============================================================

interface MapFilters {
  difficulty?: TrailDifficulty;
  surface_type?: SurfaceType;
  trail_type?: TrailType;
  showReports: boolean;
  showPois: boolean;
}

interface MapState {
  userLocation: GeoCoordinates | null;
  mapRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null;
  filters: MapFilters;
  selectedTrailId: string | null;
  selectedReportId: string | null;

  // Actions
  setUserLocation:    (loc: GeoCoordinates) => void;
  setMapRegion:       (region: MapState['mapRegion']) => void;
  setFilters:         (filters: Partial<MapFilters>) => void;
  resetFilters:       () => void;
  setSelectedTrailId: (id: string | null) => void;
  setSelectedReport:  (id: string | null) => void;
}

const defaultFilters: MapFilters = {
  showReports: true,
  showPois: true,
};

export const useMapStore = create<MapState>((set) => ({
  userLocation: null,
  mapRegion: null,
  filters: defaultFilters,
  selectedTrailId: null,
  selectedReportId: null,

  setUserLocation:    (userLocation) => set({ userLocation }),
  setMapRegion:       (mapRegion) => set({ mapRegion }),
  setFilters:         (partial) => set((s) => ({ filters: { ...s.filters, ...partial } })),
  resetFilters:       () => set({ filters: defaultFilters }),
  setSelectedTrailId: (selectedTrailId) => set({ selectedTrailId }),
  setSelectedReport:  (selectedReportId) => set({ selectedReportId }),
}));
