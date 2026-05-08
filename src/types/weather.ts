// ============================================================
// Types — Météo BikeTrip
// ============================================================

export interface WeatherData {
  temperature_c: number;
  feels_like_c: number;
  wind_speed_kmh: number;
  wind_gust_kmh: number;
  wind_direction_deg: number;
  precipitation_probability: number;       // 0-100
  precipitation_mm: number;
  humidity: number;                         // 0-100
  uv_index: number;
  visibility_km: number;
  cloud_cover_percent: number;
  condition: WeatherCondition;
  sunrise_time: string;
  sunset_time: string;
  is_daytime: boolean;
  hourly_forecast: HourlyForecast[];
  daily_forecast: DailyForecast[];
}

export type WeatherCondition =
  | 'CLEAR'
  | 'PARTLY_CLOUDY'
  | 'CLOUDY'
  | 'FOG'
  | 'DRIZZLE'
  | 'RAIN'
  | 'HEAVY_RAIN'
  | 'SNOW'
  | 'SLEET'
  | 'THUNDERSTORM'
  | 'HAIL'
  | 'WINDY'
  | 'UNKNOWN';

export interface HourlyForecast {
  time: string;                             // ISO datetime
  temperature_c: number;
  precipitation_probability: number;
  precipitation_mm: number;
  wind_speed_kmh: number;
  condition: WeatherCondition;
}

export interface DailyForecast {
  date: string;                             // ISO date
  temp_min_c: number;
  temp_max_c: number;
  precipitation_probability: number;
  precipitation_mm: number;
  wind_speed_kmh: number;
  uv_index: number;
  condition: WeatherCondition;
}

// ============================================================
// Conseils météo
// ============================================================

export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'EXTREME';

export interface WeatherAdvice {
  message: string;
  icon: string;                             // nom icône lucide
  category: 'rain' | 'wind' | 'temperature' | 'uv' | 'visibility' | 'general';
  priority: number;                         // 1 = plus urgent
}

export interface RideAdvice {
  riskLevel: RiskLevel;
  riskLabel: string;
  advices: WeatherAdvice[];
  checklist: ChecklistItem[];
  bestDepartureTime?: string;               // ex: "Avant 16h00"
}

export interface ChecklistItem {
  label: string;
  icon: string;
  required: boolean;
}
