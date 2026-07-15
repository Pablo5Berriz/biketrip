// ============================================================
// Labels français BikeTrip
// ============================================================

import type {
  TrailDifficulty, SurfaceType, TrailType, BikeType,
  CyclingLevel, ReportType, ReportSeverity, ReportStatus,
  PoiType,
} from '@/types/database';

export const DIFFICULTY_LABELS: Record<TrailDifficulty, string> = {
  EASY:     'Facile',
  MODERATE: 'Modéré',
  HARD:     'Difficile',
  EXPERT:   'Expert',
};

export const DIFFICULTY_COLORS: Record<TrailDifficulty, string> = {
  EASY:     '#22C55E',
  MODERATE: '#F59E0B',
  HARD:     '#F97316',
  EXPERT:   '#DC2626',
};

export const SURFACE_LABELS: Record<SurfaceType, string> = {
  ASPHALT: 'Asphalté',
  GRAVEL:  'Gravier',
  DIRT:    'Terre',
  MIXED:   'Mixte',
  UNKNOWN: 'Inconnu',
};

export const TRAIL_TYPE_LABELS: Record<TrailType, string> = {
  URBAN:         'Urbain',
  NATURE:        'Nature',
  GREENWAY:      'Voie verte',
  FAMILY:        'Familial',
  SPORT:         'Sportif',
  SHARED_ROAD:   'Route partagée',
  GRAVEL:        'Gravel',
  LONG_DISTANCE: 'Longue distance',
  TOURISM:       'Touristique',
};

export const BIKE_TYPE_LABELS: Record<BikeType, string> = {
  ROAD:     'Vélo de route',
  HYBRID:   'Vélo hybride',
  MOUNTAIN: 'VTT',
  GRAVEL:   'Vélo gravel',
  ELECTRIC: 'Vélo électrique',
  CARGO:    'Vélo cargo',
  URBAN:    'Vélo urbain',
  OTHER:    'Autre',
};

export const CYCLING_LEVEL_LABELS: Record<CyclingLevel, string> = {
  BEGINNER: 'Débutant',
  CASUAL:   'Occasionnel',
  REGULAR:  'Régulier',
  SPORT:    'Sportif',
  EXPERT:   'Expert',
};

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  CONSTRUCTION:        'Travaux',
  TRAIL_CLOSED:        'Piste fermée',
  OBSTACLE:            'Obstacle',
  POTHOLE:             'Nid-de-poule',
  DANGEROUS_GRAVEL:    'Gravier dangereux',
  MUD:                 'Boue',
  ICE:                 'Verglas',
  SNOW:                'Neige',
  WATER_ACCUMULATION:  'Eau accumulée',
  FALLEN_TREE:         'Arbre tombé',
  POOR_SIGNAGE:        'Mauvaise signalisation',
  ACCIDENT:            'Accident',
  ROAD_HAZARD:         'Danger routier',
  POOR_LIGHTING:       'Éclairage insuffisant',
  UNSAFE_AREA:         'Zone non sécurisée',
  HEAVY_TRAFFIC:       'Forte circulation',
  ANIMALS:             'Animaux',
  OTHER:               'Autre',
};

export const REPORT_SEVERITY_LABELS: Record<ReportSeverity, string> = {
  LOW:      'Faible',
  MEDIUM:   'Modéré',
  HIGH:     'Élevé',
  CRITICAL: 'Critique',
};

export const REPORT_SEVERITY_COLORS: Record<ReportSeverity, string> = {
  LOW:      '#22C55E',
  MEDIUM:   '#F59E0B',
  HIGH:     '#F97316',
  CRITICAL: '#DC2626',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  ACTIVE:    'Actif',
  CONFIRMED: 'Confirmé',
  RESOLVED:  'Résolu',
  EXPIRED:   'Expiré',
  REJECTED:  'Rejeté',
};

export const POI_TYPE_LABELS: Record<PoiType, string> = {
  WATER_FOUNTAIN:   'Fontaine d\'eau',
  TOILET:           'Toilettes',
  BIKE_PARKING:     'Stationnement vélos',
  REPAIR_STATION:   'Station de réparation',
  CHARGING_STATION: 'Borne de recharge',
  CAFE:             'Café',
  PARK:             'Parc',
  VIEWPOINT:        'Belvédère',
  CYCLING_REST:     'Halte cyclable',
  TRAIN_STATION:    'Gare',
  CAR_PARKING:      'Stationnement auto',
  BIKE_SHOP:        'Boutique vélo',
  REST_AREA:        'Zone de repos',
  OTHER:            'Autre',
};
