import type { WeatherData, WeatherCondition, HourlyForecast, DailyForecast } from '@/types/weather';
import type { ServiceResult } from '@/types/database';

// ============================================================
// Service Météo — Open-Meteo (gratuit, sans clé API)
// ============================================================

const OPEN_METEO_BASE = 'https://api.open-meteo.com/v1';

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    wind_speed_10m: number;
    wind_gusts_10m: number;
    wind_direction_10m: number;
    precipitation_probability: number;
    precipitation: number;
    relative_humidity_2m: number;
    uv_index: number;
    visibility: number;
    cloud_cover: number;
    weather_code: number;
    is_day: number;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max: number[];
    precipitation_sum: number[];
    wind_speed_10m_max: number[];
    uv_index_max: number[];
    weather_code: number[];
    sunrise: string[];
    sunset: string[];
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    precipitation_probability: number[];
    precipitation: number[];
    wind_speed_10m: number[];
    weather_code: number[];
  };
}

/**
 * Récupérer la météo actuelle pour une position
 */
export async function getCurrentWeather(
  latitude: number,
  longitude: number,
): Promise<ServiceResult<WeatherData>> {
  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current: [
        'temperature_2m', 'apparent_temperature', 'wind_speed_10m',
        'wind_gusts_10m', 'wind_direction_10m', 'precipitation_probability',
        'precipitation', 'relative_humidity_2m', 'uv_index',
        'visibility', 'cloud_cover', 'weather_code', 'is_day',
      ].join(','),
      hourly: [
        'temperature_2m', 'precipitation_probability',
        'precipitation', 'wind_speed_10m', 'weather_code',
      ].join(','),
      daily: [
        'temperature_2m_max', 'temperature_2m_min',
        'precipitation_probability_max', 'precipitation_sum',
        'wind_speed_10m_max', 'uv_index_max', 'weather_code',
        'sunrise', 'sunset',
      ].join(','),
      timezone: 'auto',
      forecast_days: '7',
      forecast_hours: '24',
    });

    const response = await fetch(`${OPEN_METEO_BASE}/forecast?${params}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const raw: OpenMeteoResponse = await response.json();
    const weather = mapOpenMeteoToWeatherData(raw);

    return { success: true, data: weather };
  } catch {
    return { success: false, error: 'Impossible de récupérer la météo. Vérifie ta connexion.' };
  }
}

/**
 * Météo pour une piste (point de départ)
 */
export async function getTrailWeather(
  startLat: number,
  startLng: number,
): Promise<ServiceResult<WeatherData>> {
  return getCurrentWeather(startLat, startLng);
}

// ============================================================
// Mapping Open-Meteo → WeatherData BikeTrip
// ============================================================

function mapOpenMeteoToWeatherData(raw: OpenMeteoResponse): WeatherData {
  const c = raw.current;
  const d = raw.daily;
  const h = raw.hourly;

  const todayIdx = 0;

  const hourly: HourlyForecast[] = h.time.slice(0, 24).map((time, i) => ({
    time,
    temperature_c: h.temperature_2m[i] ?? 0,
    precipitation_probability: h.precipitation_probability[i] ?? 0,
    precipitation_mm: h.precipitation[i] ?? 0,
    wind_speed_kmh: h.wind_speed_10m[i] ?? 0,
    condition: wmoCodeToCondition(h.weather_code[i] ?? 0),
  }));

  const daily: DailyForecast[] = d.time.map((date, i) => ({
    date,
    temp_min_c: d.temperature_2m_min[i] ?? 0,
    temp_max_c: d.temperature_2m_max[i] ?? 0,
    precipitation_probability: d.precipitation_probability_max[i] ?? 0,
    precipitation_mm: d.precipitation_sum[i] ?? 0,
    wind_speed_kmh: d.wind_speed_10m_max[i] ?? 0,
    uv_index: d.uv_index_max[i] ?? 0,
    condition: wmoCodeToCondition(d.weather_code[i] ?? 0),
  }));

  return {
    temperature_c: Math.round(c.temperature_2m),
    feels_like_c: Math.round(c.apparent_temperature),
    wind_speed_kmh: Math.round(c.wind_speed_10m),
    wind_gust_kmh: Math.round(c.wind_gusts_10m),
    wind_direction_deg: c.wind_direction_10m,
    precipitation_probability: c.precipitation_probability ?? 0,
    precipitation_mm: c.precipitation ?? 0,
    humidity: c.relative_humidity_2m,
    uv_index: c.uv_index ?? 0,
    visibility_km: (c.visibility ?? 10000) / 1000,
    cloud_cover_percent: c.cloud_cover ?? 0,
    condition: wmoCodeToCondition(c.weather_code),
    sunrise_time: d.sunrise[todayIdx] ?? '',
    sunset_time: d.sunset[todayIdx] ?? '',
    is_daytime: c.is_day === 1,
    hourly_forecast: hourly,
    daily_forecast: daily,
  };
}

/**
 * Convertit un code WMO (Open-Meteo) en condition BikeTrip
 */
function wmoCodeToCondition(code: number): WeatherCondition {
  if (code === 0) return 'CLEAR';
  if (code <= 2) return 'PARTLY_CLOUDY';
  if (code === 3) return 'CLOUDY';
  if (code <= 49) return 'FOG';
  if (code <= 55) return 'DRIZZLE';
  if (code <= 65) return 'RAIN';
  if (code <= 67) return 'HEAVY_RAIN';
  if (code <= 77) return 'SNOW';
  if (code <= 82) return 'RAIN';
  if (code <= 86) return 'SNOW';
  if (code <= 99) return 'THUNDERSTORM';
  return 'UNKNOWN';
}
