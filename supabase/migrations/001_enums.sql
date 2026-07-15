-- ============================================================
-- Migration 001 — Enums BikeTrip
-- ============================================================

-- Rôles utilisateurs
CREATE TYPE user_role AS ENUM (
  'USER',
  'MODERATOR',
  'ADMIN',
  'SUPER_ADMIN'
);

-- Niveau cycliste
CREATE TYPE cycling_level AS ENUM (
  'BEGINNER',
  'CASUAL',
  'REGULAR',
  'SPORT',
  'EXPERT'
);

-- Type de vélo
CREATE TYPE bike_type AS ENUM (
  'ROAD',
  'HYBRID',
  'MOUNTAIN',
  'GRAVEL',
  'ELECTRIC',
  'CARGO',
  'URBAN',
  'OTHER'
);

-- Difficulté d'une piste
CREATE TYPE trail_difficulty AS ENUM (
  'EASY',
  'MODERATE',
  'HARD',
  'EXPERT'
);

-- Type de surface
CREATE TYPE surface_type AS ENUM (
  'ASPHALT',
  'GRAVEL',
  'DIRT',
  'MIXED',
  'UNKNOWN'
);

-- Type de piste
CREATE TYPE trail_type AS ENUM (
  'URBAN',
  'NATURE',
  'GREENWAY',
  'FAMILY',
  'SPORT',
  'SHARED_ROAD',
  'GRAVEL',
  'LONG_DISTANCE',
  'TOURISM'
);

-- Type de signalement
CREATE TYPE report_type AS ENUM (
  'CONSTRUCTION',
  'TRAIL_CLOSED',
  'OBSTACLE',
  'POTHOLE',
  'DANGEROUS_GRAVEL',
  'MUD',
  'ICE',
  'SNOW',
  'WATER_ACCUMULATION',
  'FALLEN_TREE',
  'POOR_SIGNAGE',
  'ACCIDENT',
  'ROAD_HAZARD',
  'POOR_LIGHTING',
  'UNSAFE_AREA',
  'HEAVY_TRAFFIC',
  'ANIMALS',
  'OTHER'
);

-- Gravité d'un signalement
CREATE TYPE report_severity AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
);

-- Statut d'un signalement
CREATE TYPE report_status AS ENUM (
  'ACTIVE',
  'CONFIRMED',
  'RESOLVED',
  'EXPIRED',
  'REJECTED'
);

-- Type de vote sur un signalement
CREATE TYPE vote_type AS ENUM (
  'CONFIRM',
  'RESOLVED'
);

-- Statut d'une sortie vélo
CREATE TYPE ride_status AS ENUM (
  'ACTIVE',
  'PAUSED',
  'COMPLETED',
  'CANCELLED'
);

-- Type de point d'intérêt
CREATE TYPE poi_type AS ENUM (
  'WATER_FOUNTAIN',
  'TOILET',
  'BIKE_PARKING',
  'REPAIR_STATION',
  'CHARGING_STATION',
  'CAFE',
  'PARK',
  'VIEWPOINT',
  'CYCLING_REST',
  'TRAIN_STATION',
  'CAR_PARKING',
  'BIKE_SHOP',
  'REST_AREA',
  'OTHER'
);

-- Statut d'une sortie planifiée
CREATE TYPE planned_ride_status AS ENUM (
  'PLANNED',
  'DONE',
  'CANCELLED'
);

-- Système d'unités
CREATE TYPE unit_system AS ENUM (
  'METRIC',
  'IMPERIAL'
);
