// ============================================================
// Types TypeScript — Schéma Supabase BikeTrip
// ============================================================

export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN' | 'SUPER_ADMIN';
export type CyclingLevel = 'BEGINNER' | 'CASUAL' | 'REGULAR' | 'SPORT' | 'EXPERT';
export type BikeType = 'ROAD' | 'HYBRID' | 'MOUNTAIN' | 'GRAVEL' | 'ELECTRIC' | 'CARGO' | 'URBAN' | 'OTHER';
export type TrailDifficulty = 'EASY' | 'MODERATE' | 'HARD' | 'EXPERT';
export type SurfaceType = 'ASPHALT' | 'GRAVEL' | 'DIRT' | 'MIXED' | 'UNKNOWN';
export type TrailType = 'URBAN' | 'NATURE' | 'GREENWAY' | 'FAMILY' | 'SPORT' | 'SHARED_ROAD' | 'GRAVEL' | 'LONG_DISTANCE' | 'TOURISM';
export type ReportType =
  | 'CONSTRUCTION' | 'TRAIL_CLOSED' | 'OBSTACLE' | 'POTHOLE'
  | 'DANGEROUS_GRAVEL' | 'MUD' | 'ICE' | 'SNOW'
  | 'WATER_ACCUMULATION' | 'FALLEN_TREE' | 'POOR_SIGNAGE'
  | 'ACCIDENT' | 'ROAD_HAZARD' | 'POOR_LIGHTING'
  | 'UNSAFE_AREA' | 'HEAVY_TRAFFIC' | 'ANIMALS' | 'OTHER';
export type ReportSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ReportStatus = 'ACTIVE' | 'CONFIRMED' | 'RESOLVED' | 'EXPIRED' | 'REJECTED';
export type VoteType = 'CONFIRM' | 'RESOLVED';
export type RideStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
export type PoiType =
  | 'WATER_FOUNTAIN' | 'TOILET' | 'BIKE_PARKING' | 'REPAIR_STATION'
  | 'CHARGING_STATION' | 'CAFE' | 'PARK' | 'VIEWPOINT'
  | 'CYCLING_REST' | 'TRAIN_STATION' | 'CAR_PARKING'
  | 'BIKE_SHOP' | 'REST_AREA' | 'OTHER';
export type PlannedRideStatus = 'PLANNED' | 'DONE' | 'CANCELLED';
export type UnitSystem = 'METRIC' | 'IMPERIAL';

// ============================================================
// Tables
// ============================================================

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  city: string | null;
  cycling_level: CyclingLevel;
  primary_bike_type: BikeType;
  preferred_surface: SurfaceType | null;
  comfortable_distance_km: number;
  unit_system: UnitSystem;
  is_private: boolean;
  role: UserRole;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Trail {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string;
  region: string;
  country: string;
  distance_km: number;
  estimated_duration_minutes: number | null;
  elevation_gain_m: number;
  elevation_loss_m: number;
  min_altitude_m: number | null;
  max_altitude_m: number | null;
  difficulty: TrailDifficulty;
  surface_type: SurfaceType;
  trail_type: TrailType;
  recommended_bike_types: BikeType[];
  safety_score: number;
  popularity_score: number;
  average_rating: number;
  cover_image_url: string | null;
  geometry_geojson: Record<string, unknown> | null;
  start_latitude: number;
  start_longitude: number;
  end_latitude: number | null;
  end_longitude: number | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrailPoint {
  id: string;
  trail_id: string;
  latitude: number;
  longitude: number;
  altitude_m: number | null;
  position: number;
  created_at: string;
}

export interface Report {
  id: string;
  trail_id: string | null;
  user_id: string;
  type: ReportType;
  title: string;
  description: string | null;
  severity: ReportSeverity;
  status: ReportStatus;
  latitude: number;
  longitude: number;
  image_url: string | null;
  confirmed_count: number;
  resolved_count: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportVote {
  id: string;
  report_id: string;
  user_id: string;
  vote_type: VoteType;
  created_at: string;
}

export interface ReportComment {
  id: string;
  report_id: string;
  user_id: string;
  content: string;
  created_at: string;
  deleted_at: string | null;
}

export interface TrailReview {
  id: string;
  trail_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Favorite {
  id: string;
  user_id: string;
  trail_id: string;
  note: string | null;
  created_at: string;
}

export interface Collection {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CollectionTrail {
  id: string;
  collection_id: string;
  trail_id: string;
  created_at: string;
}

export interface Ride {
  id: string;
  user_id: string;
  trail_id: string | null;
  title: string | null;
  started_at: string;
  ended_at: string | null;
  distance_km: number;
  duration_seconds: number;
  average_speed_kmh: number | null;
  max_speed_kmh: number | null;
  elevation_gain_m: number;
  elevation_loss_m: number;
  weather_summary: string | null;
  notes: string | null;
  status: RideStatus;
  created_at: string;
  updated_at: string;
}

export interface RidePoint {
  id: string;
  ride_id: string;
  latitude: number;
  longitude: number;
  altitude_m: number | null;
  speed_kmh: number | null;
  recorded_at: string;
}

export interface RidePhoto {
  id: string;
  ride_id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface PointOfInterest {
  id: string;
  trail_id: string | null;
  name: string;
  type: PoiType;
  description: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
  updated_at: string;
}

export interface PlannedRide {
  id: string;
  user_id: string;
  trail_id: string;
  planned_date: string;
  planned_time: string | null;
  notes: string | null;
  status: PlannedRideStatus;
  created_at: string;
  updated_at: string;
}

export interface WeatherSnapshot {
  id: string;
  trail_id: string | null;
  ride_id: string | null;
  latitude: number;
  longitude: number;
  temperature_c: number | null;
  feels_like_c: number | null;
  wind_speed_kmh: number | null;
  wind_gust_kmh: number | null;
  precipitation_probability: number | null;
  humidity: number | null;
  uv_index: number | null;
  visibility_km: number | null;
  raw_data: Record<string, unknown> | null;
  captured_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ============================================================
// Types jointures (avec relations)
// ============================================================

export interface TrailWithReviews extends Trail {
  trail_reviews: TrailReview[];
}

export interface TrailWithReports extends Trail {
  reports: Report[];
}

export interface ReportWithAuthor extends Report {
  profiles: Pick<Profile, 'id' | 'full_name' | 'avatar_url'>;
}

export interface FavoriteWithTrail extends Favorite {
  trails: Trail;
}

export interface CollectionWithTrails extends Collection {
  collection_trails: (CollectionTrail & { trails: Trail })[];
}

export interface RideWithTrail extends Ride {
  trails: Trail | null;
}

// ============================================================
// Types utilitaires
// ============================================================

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface ServiceResult<T = void> {
  success?: boolean;
  data?: T | null;
  error?: string | null;
  fieldErrors?: Record<string, string[]>;
}

export interface PaginatedResult<T> {
  data: T[];
  count: number;
  hasMore: boolean;
  nextCursor?: string;
}
