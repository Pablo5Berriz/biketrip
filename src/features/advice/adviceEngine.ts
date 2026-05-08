// ============================================================
// Moteur de conseils contextuels BikeTrip — V1 déterministe
// ============================================================

import type { WeatherData, WeatherAdvice, RideAdvice, ChecklistItem, RiskLevel } from '@/types/weather';
import type { Trail, Report, CyclingLevel, BikeType } from '@/types/database';

type AdviceTrail = Pick<Trail, 'difficulty' | 'distance_km' | 'elevation_gain_m' | 'surface_type' | 'trail_type' | 'estimated_duration_minutes'>;

export interface AdviceInput {
  weather: WeatherData;
  trail: AdviceTrail;
  activeReports: Report[];
  userLevel: CyclingLevel;
  bikeType: BikeType;
  departureHour: number;             // 0-23
  comfortableDistanceKm: number;
}

/**
 * Point d'entrée principal du moteur de conseils
 */
export function generateRideAdvice(input: AdviceInput): RideAdvice {
  const advices: WeatherAdvice[] = [];
  const checklist: ChecklistItem[] = [];
  let riskScore = 0;

  // --- Conseils météo ---
  const weatherAdvices = generateWeatherAdvices(input.weather);
  advices.push(...weatherAdvices);
  riskScore += computeWeatherRisk(input.weather);

  // --- Conseils dénivelé ---
  const elevationAdvices = generateElevationAdvices(input.trail, input.userLevel);
  advices.push(...elevationAdvices);
  if (input.trail.elevation_gain_m > 500 && input.userLevel === 'BEGINNER') riskScore += 30;
  else if (input.trail.elevation_gain_m > 300 && input.userLevel === 'CASUAL') riskScore += 15;

  // --- Conseils distance ---
  if (input.trail.distance_km > input.comfortableDistanceKm * 1.5) {
    advices.push({
      message: `Ce parcours (${input.trail.distance_km} km) dépasse largement ta distance habituelle de ${input.comfortableDistanceKm} km. Prévois des pauses.`,
      icon: 'route',
      category: 'general',
      priority: 3,
    });
    riskScore += 20;
  } else if (input.trail.distance_km > input.comfortableDistanceKm) {
    advices.push({
      message: `Parcours légèrement au-delà de ta distance confortable. Reste à l'écoute de tes sensations.`,
      icon: 'route',
      category: 'general',
      priority: 5,
    });
    riskScore += 10;
  }

  // --- Compatibilité vélo/surface ---
  const bikeAdvices = generateBikeCompatibilityAdvices(input.trail, input.bikeType);
  advices.push(...bikeAdvices);

  // --- Signalements actifs ---
  const reportAdvices = generateReportAdvices(input.activeReports);
  advices.push(...reportAdvices);
  const criticalReports = input.activeReports.filter(r => r.severity === 'CRITICAL').length;
  const highReports = input.activeReports.filter(r => r.severity === 'HIGH').length;
  riskScore += criticalReports * 25 + highReports * 10;

  // --- Conseils éclairage ---
  const lightingAdvice = generateLightingAdvice(input.weather, input.departureHour, input.trail.estimated_duration_minutes);
  if (lightingAdvice) {
    advices.push(lightingAdvice);
    checklist.push({ label: 'Éclairage avant et arrière', icon: 'lamp', required: true });
  }

  // --- Checklist complète ---
  checklist.push(...buildChecklist(input));

  // --- Niveau de risque global ---
  const riskLevel = scoreToRiskLevel(riskScore);

  // Trier par priorité
  advices.sort((a, b) => a.priority - b.priority);

  return {
    riskLevel,
    riskLabel: riskLevelLabel(riskLevel),
    advices,
    checklist,
    bestDepartureTime: suggestDepartureTime(input.weather, input.departureHour),
  };
}

// ============================================================
// Conseils météo
// ============================================================

function generateWeatherAdvices(weather: WeatherData): WeatherAdvice[] {
  const advices: WeatherAdvice[] = [];

  // Pluie
  if (weather.precipitation_probability >= 70) {
    advices.push({
      message: `Forte probabilité de pluie (${weather.precipitation_probability}%). Prévois un imperméable ou reporte ta sortie.`,
      icon: 'cloud-rain',
      category: 'rain',
      priority: 1,
    });
  } else if (weather.precipitation_probability >= 40) {
    advices.push({
      message: `Risque de pluie (${weather.precipitation_probability}%). Emporte un imperméable léger.`,
      icon: 'cloud-drizzle',
      category: 'rain',
      priority: 2,
    });
  }

  // Vent
  if (weather.wind_speed_kmh >= 40) {
    advices.push({
      message: `Vent fort (${weather.wind_speed_kmh} km/h). Trajet exigeant, prévois 30% de temps en plus.`,
      icon: 'wind',
      category: 'wind',
      priority: 1,
    });
  } else if (weather.wind_gust_kmh >= 50) {
    advices.push({
      message: `Rafales intenses (${weather.wind_gust_kmh} km/h). Sois prudent dans les zones dégagées.`,
      icon: 'wind',
      category: 'wind',
      priority: 2,
    });
  } else if (weather.wind_speed_kmh >= 20) {
    advices.push({
      message: `Vent modéré (${weather.wind_speed_kmh} km/h). Prévois un effort légèrement accru.`,
      icon: 'wind',
      category: 'wind',
      priority: 5,
    });
  }

  // Température basse
  if (weather.temperature_c < 5) {
    advices.push({
      message: `Température froide (${weather.temperature_c}°C). Gants, cache-cou et couche chaude obligatoires.`,
      icon: 'thermometer-snowflake',
      category: 'temperature',
      priority: 2,
    });
  } else if (weather.temperature_c < 10) {
    advices.push({
      message: `Température fraîche (${weather.temperature_c}°C). Gants et coupe-vent recommandés.`,
      icon: 'thermometer',
      category: 'temperature',
      priority: 4,
    });
  }

  // Température haute
  if (weather.temperature_c >= 32) {
    advices.push({
      message: `Forte chaleur (${weather.temperature_c}°C). Hydrate-toi bien, évite les heures les plus chaudes.`,
      icon: 'sun',
      category: 'temperature',
      priority: 2,
    });
  } else if (weather.temperature_c >= 28) {
    advices.push({
      message: `Chaleur (${weather.temperature_c}°C). Prévois au moins 1L d'eau supplémentaire.`,
      icon: 'sun',
      category: 'temperature',
      priority: 3,
    });
  }

  // UV
  if (weather.uv_index >= 8) {
    advices.push({
      message: `Indice UV très élevé (${weather.uv_index}). Crème solaire, lunettes et casquette indispensables.`,
      icon: 'sun',
      category: 'uv',
      priority: 2,
    });
  } else if (weather.uv_index >= 6) {
    advices.push({
      message: `Indice UV élevé (${weather.uv_index}). Prévois crème solaire et lunettes de soleil.`,
      icon: 'sun',
      category: 'uv',
      priority: 4,
    });
  }

  // Brouillard / visibilité
  if (weather.visibility_km < 2) {
    advices.push({
      message: `Visibilité réduite (${weather.visibility_km} km). Éclairage obligatoire, réduis la vitesse.`,
      icon: 'eye-off',
      category: 'visibility',
      priority: 1,
    });
  }

  // Fenêtre météo favorable
  if (
    weather.precipitation_probability < 20 &&
    weather.wind_speed_kmh < 20 &&
    weather.temperature_c >= 12 &&
    weather.temperature_c <= 26
  ) {
    advices.push({
      message: 'Excellentes conditions météo. Bonne fenêtre pour rouler !',
      icon: 'check-circle',
      category: 'general',
      priority: 10,
    });
  }

  return advices;
}

// ============================================================
// Conseils dénivelé
// ============================================================

function generateElevationAdvices(trail: AdviceTrail, level: CyclingLevel): WeatherAdvice[] {
  const advices: WeatherAdvice[] = [];
  const gain = trail.elevation_gain_m;

  if (gain > 500 && level === 'BEGINNER') {
    advices.push({
      message: `Dénivelé important (+${gain}m) pour ton niveau actuel. Envisage un parcours plus plat.`,
      icon: 'trending-up',
      category: 'general',
      priority: 2,
    });
  } else if (gain > 800 && level === 'CASUAL') {
    advices.push({
      message: `Ce parcours est exigeant (${gain}m D+). Assure-toi d'être en forme.`,
      icon: 'trending-up',
      category: 'general',
      priority: 3,
    });
  } else if (gain > 1200 && (level === 'REGULAR' || level === 'SPORT')) {
    advices.push({
      message: `Grosse montée au programme (+${gain}m). Prévois une alimentation adaptée.`,
      icon: 'trending-up',
      category: 'general',
      priority: 4,
    });
  }

  return advices;
}

// ============================================================
// Compatibilité vélo/surface
// ============================================================

function generateBikeCompatibilityAdvices(trail: AdviceTrail, bikeType: BikeType): WeatherAdvice[] {
  const advices: WeatherAdvice[] = [];

  if (trail.surface_type === 'GRAVEL' && bikeType === 'ROAD') {
    advices.push({
      message: 'Surface gravel non adaptée au vélo de route. Risque de crevaison plus élevé.',
      icon: 'alert-triangle',
      category: 'general',
      priority: 2,
    });
  }
  if (trail.surface_type === 'DIRT' && (bikeType === 'ROAD' || bikeType === 'URBAN')) {
    advices.push({
      message: 'Piste en terre. Ton vélo n\'est pas optimal pour cette surface.',
      icon: 'alert-triangle',
      category: 'general',
      priority: 3,
    });
  }
  if (trail.trail_type === 'SPORT' && bikeType === 'URBAN') {
    advices.push({
      message: 'Parcours sportif avec un vélo urbain. Prévois plus de temps.',
      icon: 'info',
      category: 'general',
      priority: 5,
    });
  }

  return advices;
}

// ============================================================
// Signalements actifs
// ============================================================

function generateReportAdvices(reports: Report[]): WeatherAdvice[] {
  const advices: WeatherAdvice[] = [];
  const critical = reports.filter(r => r.severity === 'CRITICAL');
  const high = reports.filter(r => r.severity === 'HIGH');

  critical.forEach(r => {
    advices.push({
      message: `⚠️ Signalement critique actif : ${r.title}. Extrême prudence ou évite ce parcours.`,
      icon: 'alert-octagon',
      category: 'general',
      priority: 1,
    });
  });

  if (high.length > 0) {
    advices.push({
      message: `${high.length} signalement(s) de niveau élevé sur ce parcours. Reste vigilant.`,
      icon: 'alert-triangle',
      category: 'general',
      priority: 2,
    });
  }

  if (reports.some(r => r.type === 'ICE' || r.type === 'SNOW')) {
    advices.push({
      message: 'Verglas ou neige signalé sur ce parcours. Conditions dangereuses.',
      icon: 'thermometer-snowflake',
      category: 'general',
      priority: 1,
    });
  }

  return advices;
}

// ============================================================
// Conseil éclairage
// ============================================================

function generateLightingAdvice(
  weather: WeatherData,
  departureHour: number,
  durationMinutes: number | null,
): WeatherAdvice | null {
  const estimatedReturn = departureHour + ((durationMinutes ?? 90) / 60);
  const sunsetHour = parseSunsetHour(weather.sunset_time);
  const isDarkDeparture = departureHour < 7 || departureHour >= 20;
  const willReturnAfterSunset = sunsetHour !== null && estimatedReturn > sunsetHour;

  if (isDarkDeparture || willReturnAfterSunset) {
    return {
      message: willReturnAfterSunset
        ? `Retour prévu après le coucher du soleil (${weather.sunset_time.slice(11, 16)}). Éclairage obligatoire.`
        : 'Départ en conditions de faible luminosité. Éclairage avant/arrière requis.',
      icon: 'lamp',
      category: 'general',
      priority: 2,
    };
  }
  return null;
}

function parseSunsetHour(sunsetTime: string): number | null {
  try {
    const parts = sunsetTime.slice(11, 16).split(':');
    return parseInt(parts[0] ?? '0') + parseInt(parts[1] ?? '0') / 60;
  } catch {
    return null;
  }
}

// ============================================================
// Checklist recommandée
// ============================================================

function buildChecklist(input: AdviceInput): ChecklistItem[] {
  const { weather, trail, userLevel } = input;
  const items: ChecklistItem[] = [];

  // Toujours
  items.push({ label: 'Casque', icon: 'hard-hat', required: true });
  items.push({ label: 'Eau (minimum 500 ml)', icon: 'droplets', required: true });

  // Eau selon distance/chaleur
  const waterLiters = Math.max(0.5, trail.distance_km / 20);
  if (waterLiters > 0.5) {
    items.push({
      label: `Eau (${waterLiters.toFixed(1)}L recommandé pour ce parcours)`,
      icon: 'droplets',
      required: true,
    });
  }

  // Pluie
  if (weather.precipitation_probability >= 40) {
    items.push({ label: 'Imperméable léger', icon: 'cloud-rain', required: false });
  }

  // Froid
  if (weather.temperature_c < 10) {
    items.push({ label: 'Gants de cyclisme', icon: 'hand', required: true });
    items.push({ label: 'Coupe-vent', icon: 'wind', required: false });
  }
  if (weather.temperature_c < 5) {
    items.push({ label: 'Bonnet sous le casque', icon: 'thermometer', required: false });
  }

  // Soleil
  if (weather.uv_index >= 6) {
    items.push({ label: 'Crème solaire SPF50+', icon: 'sun', required: false });
    items.push({ label: 'Lunettes de soleil', icon: 'glasses', required: false });
  }

  // Réparation
  if (trail.distance_km > 20 || trail.surface_type !== 'ASPHALT') {
    items.push({ label: 'Kit réparation (chambre à air, démonte-pneu)', icon: 'wrench', required: false });
    items.push({ label: 'Pompe portable', icon: 'wind', required: false });
  }

  // Alimentation longue distance
  if (trail.distance_km > 40 || (trail.estimated_duration_minutes ?? 0) > 120) {
    items.push({ label: 'Barres énergétiques / ravitaillement', icon: 'zap', required: false });
  }

  // Téléphone
  items.push({ label: 'Téléphone chargé', icon: 'smartphone', required: true });

  // Niveau débutant
  if (userLevel === 'BEGINNER') {
    items.push({ label: 'Informer quelqu\'un de ton itinéraire', icon: 'users', required: false });
  }

  return items;
}

// ============================================================
// Utilitaires
// ============================================================

function computeWeatherRisk(weather: WeatherData): number {
  let score = 0;
  if (weather.precipitation_probability >= 70) score += 30;
  else if (weather.precipitation_probability >= 40) score += 15;
  if (weather.wind_speed_kmh >= 40) score += 25;
  else if (weather.wind_speed_kmh >= 25) score += 10;
  if (weather.wind_gust_kmh >= 60) score += 20;
  if (weather.temperature_c < 0) score += 30;
  else if (weather.temperature_c < 5) score += 15;
  if (weather.visibility_km < 2) score += 25;
  if (weather.uv_index >= 10) score += 10;
  return score;
}

function scoreToRiskLevel(score: number): RiskLevel {
  if (score >= 70) return 'EXTREME';
  if (score >= 45) return 'HIGH';
  if (score >= 20) return 'MODERATE';
  return 'LOW';
}

function riskLevelLabel(level: RiskLevel): string {
  const labels: Record<RiskLevel, string> = {
    LOW: 'Conditions favorables',
    MODERATE: 'Conditions modérées',
    HIGH: 'Conditions difficiles',
    EXTREME: 'Conditions dangereuses',
  };
  return labels[level];
}

function suggestDepartureTime(weather: WeatherData, currentHour: number): string | undefined {
  // Si forte chaleur en après-midi, suggérer le matin
  if (weather.temperature_c >= 28 && currentHour >= 12) {
    return 'Départ conseillé avant 10h pour éviter la chaleur';
  }
  // Si pluie probable dans l'après-midi
  if (weather.precipitation_probability >= 50 && currentHour < 12) {
    return 'Départ conseillé le matin pour éviter la pluie';
  }
  // Si crépuscule proche et durée longue
  const sunsetHour = parseSunsetHour(weather.sunset_time);
  if (sunsetHour && currentHour + 2 >= sunsetHour) {
    return `Départ conseillé avant ${Math.floor(sunsetHour - 1.5)}h pour rentrer avant la nuit`;
  }
  return undefined;
}
