import {
  haversineDistance,
  computeAverageSpeed,
  mpsToKmh,
  createRideAccumulator,
  ingestTrackPoint,
  GPS_MIN_ACCURACY_M,
  GPS_MAX_PLAUSIBLE_SPEED_KMH,
  ELEVATION_NOISE_THRESHOLD_M,
  type RideTrackPoint,
  type RideAccumulator,
} from './geoUtils';

// ============================================================
// Tests unitaires - BIKETRIP-P0-RIDE-001
// ============================================================
// Aucune position personnelle reelle : toutes les coordonnees ci-dessous
// sont des points synthetiques (grille autour de l'equateur/meridien
// d'origine), choisis uniquement pour leurs proprietes geometriques.
// Aucun de ces tests ne depend d'un GPS reel ni d'un appareil physique.

function point(overrides: Partial<RideTrackPoint>): RideTrackPoint {
  return {
    latitude: 0,
    longitude: 0,
    timestamp: 0,
    altitudeM: null,
    speedKmh: null,
    accuracyM: 5,
    ...overrides,
  };
}

function expectFiniteAccumulator(acc: RideAccumulator) {
  expect(Number.isFinite(acc.distanceKm)).toBe(true);
  expect(Number.isFinite(acc.maxSpeedKmh)).toBe(true);
  expect(Number.isFinite(acc.elevationGainM)).toBe(true);
  expect(Number.isFinite(acc.elevationLossM)).toBe(true);
}

describe('mpsToKmh', () => {
  it('convertit une vitesse en metres par seconde vers kilometres par heure', () => {
    expect(mpsToKmh(10)).toBeCloseTo(36, 5);
    expect(mpsToKmh(0)).toBe(0);
  });
});

describe('haversineDistance', () => {
  it('retourne 0 pour deux points identiques', () => {
    const a = point({ latitude: 45, longitude: -71 });
    expect(haversineDistance(a, a)).toBe(0);
  });

  it('calcule une distance connue entre deux coordonnees', () => {
    const a = point({ latitude: 0, longitude: 0 });
    const b = point({ latitude: 0.001, longitude: 0 });
    expect(haversineDistance(a, b)).toBeCloseTo(0.11119, 4);
  });
});

describe('computeAverageSpeed', () => {
  it('retourne 0 quand la duree est nulle', () => {
    expect(computeAverageSpeed(5, 0)).toBe(0);
  });

  it('calcule la vitesse moyenne a partir de la distance et de la duree active uniquement', () => {
    expect(computeAverageSpeed(10, 3600)).toBe(10);
  });
});

describe('createRideAccumulator', () => {
  it('demarre a zero sans dernier point valide', () => {
    const acc = createRideAccumulator();
    expect(acc).toEqual({
      distanceKm: 0,
      maxSpeedKmh: 0,
      elevationGainM: 0,
      elevationLossM: 0,
      lastValidPoint: null,
    });
  });
});

describe('ingestTrackPoint', () => {
  it('ne calcule aucune distance avec un seul point', () => {
    const acc = createRideAccumulator();
    const result = ingestTrackPoint(acc, point({ latitude: 0, longitude: 0, timestamp: 1000 }));
    expect(result.accepted).toBe(true);
    expect(result.accumulator.distanceKm).toBe(0);
    expectFiniteAccumulator(result.accumulator);
  });

  it('accumule la distance sur plusieurs segments consecutifs', () => {
    const p0 = point({ latitude: 0, longitude: 0, timestamp: 0 });
    const p1 = point({ latitude: 0.001, longitude: 0, timestamp: 10000 });
    const p2 = point({ latitude: 0.002, longitude: 0, timestamp: 20000 });
    const p3 = point({ latitude: 0.003, longitude: 0, timestamp: 30000 });

    let acc = createRideAccumulator();
    for (const p of [p0, p1, p2, p3]) {
      const result = ingestTrackPoint(acc, p);
      expect(result.accepted).toBe(true);
      acc = result.accumulator;
    }

    const expectedTotal = haversineDistance(p0, p1) + haversineDistance(p1, p2) + haversineDistance(p2, p3);
    expect(acc.distanceKm).toBeCloseTo(expectedTotal, 6);
    expect(acc.distanceKm).toBeGreaterThan(0);
  });

  it('rejette un point aux coordonnees invalides sans modifier accumulateur', () => {
    const acc0 = createRideAccumulator();
    const first = ingestTrackPoint(acc0, point({ latitude: 0, longitude: 0, timestamp: 0 }));
    const acc1 = first.accumulator;

    const invalid = point({ latitude: 200, longitude: 0, timestamp: 10000 });
    const result = ingestTrackPoint(acc1, invalid);

    expect(result.accepted).toBe(false);
    expect(result.accumulator).toBe(acc1);
    expect(result.currentSpeedKmh).toBeNull();
  });

  it('rejette un point dont la precision GPS depasse le seuil accepte', () => {
    const acc0 = createRideAccumulator();
    const first = ingestTrackPoint(acc0, point({ latitude: 0, longitude: 0, timestamp: 0 }));
    const acc1 = first.accumulator;

    const imprecise = point({
      latitude: 0.001, longitude: 0, timestamp: 10000,
      accuracyM: GPS_MIN_ACCURACY_M + 1,
    });
    const result = ingestTrackPoint(acc1, imprecise);

    expect(result.accepted).toBe(false);
    expect(result.accumulator.distanceKm).toBe(0);
  });

  it('calcule la vitesse instantanee par repli distance temps', () => {
    const acc0 = createRideAccumulator();
    const first = ingestTrackPoint(acc0, point({ latitude: 0, longitude: 0, timestamp: 0, speedKmh: null }));
    const second = ingestTrackPoint(
      first.accumulator,
      point({ latitude: 0.001, longitude: 0, timestamp: 10000, speedKmh: null }),
    );

    expect(second.accepted).toBe(true);
    expect(second.currentSpeedKmh).not.toBeNull();
    expect(second.currentSpeedKmh!).toBeCloseTo(40.03, 1);
  });

  it('traite une vitesse capteur negative comme indisponible', () => {
    const acc0 = createRideAccumulator();
    const first = ingestTrackPoint(acc0, point({ latitude: 0, longitude: 0, timestamp: 0 }));
    const second = ingestTrackPoint(
      first.accumulator,
      point({ latitude: 0.001, longitude: 0, timestamp: 10000, speedKmh: -5 }),
    );

    expect(second.accepted).toBe(true);
    expect(second.currentSpeedKmh).not.toBeNull();
    expect(second.currentSpeedKmh!).toBeGreaterThan(0);
    expect(second.currentSpeedKmh!).toBeCloseTo(40.03, 1);
  });

  it('rejette un point impliquant une vitesse physiquement aberrante', () => {
    const acc0 = createRideAccumulator();
    const first = ingestTrackPoint(acc0, point({ latitude: 0, longitude: 0, timestamp: 0 }));
    const teleport = point({ latitude: 0.1, longitude: 0, timestamp: 1000 });
    const result = ingestTrackPoint(first.accumulator, teleport);

    expect(result.accepted).toBe(false);
    expect(result.accumulator.distanceKm).toBe(0);
    expect(result.accumulator.maxSpeedKmh).toBe(0);
  });

  it('accepte une vitesse proche mais sous le seuil plausible', () => {
    const acc0 = createRideAccumulator();
    const first = ingestTrackPoint(acc0, point({ latitude: 0, longitude: 0, timestamp: 0 }));
    const fast = point({ latitude: 0.001, longitude: 0, timestamp: 5700 });
    const result = ingestTrackPoint(first.accumulator, fast);

    expect(result.accepted).toBe(true);
    expect(result.currentSpeedKmh!).toBeLessThan(GPS_MAX_PLAUSIBLE_SPEED_KMH);
  });

  it('retient la vitesse maximale parmi les vitesses valides', () => {
    const p0 = point({ latitude: 0, longitude: 0, timestamp: 0, speedKmh: 10 });
    const p1 = point({ latitude: 0, longitude: 0, timestamp: 1000, speedKmh: 25 });
    const p2 = point({ latitude: 0, longitude: 0, timestamp: 2000, speedKmh: 15 });

    let acc = createRideAccumulator();
    for (const p of [p0, p1, p2]) {
      const result = ingestTrackPoint(acc, p);
      expect(result.accepted).toBe(true);
      acc = result.accumulator;
    }

    expect(acc.maxSpeedKmh).toBe(25);
  });

  it('cumule le denivele positif au-dela du seuil de bruit', () => {
    const p0 = point({ latitude: 0, longitude: 0, timestamp: 0, altitudeM: 100 });
    const p1 = point({ latitude: 0, longitude: 0, timestamp: 1000, altitudeM: 100 + ELEVATION_NOISE_THRESHOLD_M + 2 });

    const first = ingestTrackPoint(createRideAccumulator(), p0);
    const second = ingestTrackPoint(first.accumulator, p1);

    expect(second.accumulator.elevationGainM).toBeCloseTo(ELEVATION_NOISE_THRESHOLD_M + 2, 6);
    expect(second.accumulator.elevationLossM).toBe(0);
  });

  it('cumule le denivele negatif au-dela du seuil de bruit', () => {
    const p0 = point({ latitude: 0, longitude: 0, timestamp: 0, altitudeM: 100 });
    const p1 = point({ latitude: 0, longitude: 0, timestamp: 1000, altitudeM: 100 - ELEVATION_NOISE_THRESHOLD_M - 2 });

    const first = ingestTrackPoint(createRideAccumulator(), p0);
    const second = ingestTrackPoint(first.accumulator, p1);

    expect(second.accumulator.elevationLossM).toBeCloseTo(ELEVATION_NOISE_THRESHOLD_M + 2, 6);
    expect(second.accumulator.elevationGainM).toBe(0);
  });

  it('ignore une variation altitude sous le seuil de bruit', () => {
    const p0 = point({ latitude: 0, longitude: 0, timestamp: 0, altitudeM: 100 });
    const p1 = point({ latitude: 0, longitude: 0, timestamp: 1000, altitudeM: 100 + (ELEVATION_NOISE_THRESHOLD_M - 1) });

    const first = ingestTrackPoint(createRideAccumulator(), p0);
    const second = ingestTrackPoint(first.accumulator, p1);

    expect(second.accumulator.elevationGainM).toBe(0);
    expect(second.accumulator.elevationLossM).toBe(0);
  });

  it('n invente aucun denivele quand altitude absente sur un point', () => {
    const p0 = point({ latitude: 0, longitude: 0, timestamp: 0, altitudeM: null });
    const p1 = point({ latitude: 0.0001, longitude: 0, timestamp: 1000, altitudeM: 50 });
    const p2 = point({ latitude: 0.0002, longitude: 0, timestamp: 2000, altitudeM: null });

    let acc = createRideAccumulator();
    for (const p of [p0, p1, p2]) {
      const result = ingestTrackPoint(acc, p);
      expect(result.accepted).toBe(true);
      acc = result.accumulator;
    }

    expect(acc.elevationGainM).toBe(0);
    expect(acc.elevationLossM).toBe(0);
  });

  it('rejette un point avec horodatage identique au precedent', () => {
    const first = ingestTrackPoint(createRideAccumulator(), point({ latitude: 0, longitude: 0, timestamp: 5000 }));
    const result = ingestTrackPoint(first.accumulator, point({ latitude: 0.001, longitude: 0, timestamp: 5000 }));

    expect(result.accepted).toBe(false);
  });

  it('rejette un point avec horodatage anterieur au precedent', () => {
    const first = ingestTrackPoint(createRideAccumulator(), point({ latitude: 0, longitude: 0, timestamp: 5000 }));
    const result = ingestTrackPoint(first.accumulator, point({ latitude: 0.001, longitude: 0, timestamp: 4000 }));

    expect(result.accepted).toBe(false);
  });

  it('ne produit jamais de NaN ni infini sur une sequence mixte', () => {
    const sequence: RideTrackPoint[] = [
      point({ latitude: 0, longitude: 0, timestamp: 0, altitudeM: 10 }),
      point({ latitude: 0.001, longitude: 0, timestamp: 10000, altitudeM: 12 }),
      point({ latitude: 200, longitude: 0, timestamp: 20000 }),
      point({ latitude: 0.002, longitude: 0, timestamp: 5000 }),
      point({ latitude: 0.002, longitude: 0, timestamp: 30000, accuracyM: GPS_MIN_ACCURACY_M + 5 }),
      point({ latitude: 0.003, longitude: 0, timestamp: 40000, altitudeM: 9 }),
    ];

    let acc = createRideAccumulator();
    for (const p of sequence) {
      const result = ingestTrackPoint(acc, p);
      expectFiniteAccumulator(result.accumulator);
      if (result.currentSpeedKmh != null) {
        expect(Number.isFinite(result.currentSpeedKmh)).toBe(true);
      }
      acc = result.accumulator;
    }
  });
});

// ============================================================
// Tests unitaires - BIKETRIP-P0-RIDE-002
// Plafonnement de la vitesse rapportee par le capteur
// (raw.speedKmh) par GPS_MAX_PLAUSIBLE_SPEED_KMH, y compris sur
// le tout premier point de la sortie (aucun deplacement disponible
// pour la valider par comparaison).
// ============================================================
describe('ingestTrackPoint - vitesse capteur bornee (BIKETRIP-P0-RIDE-002)', () => {
  it('rejette une vitesse capteur aberrante sur le tout premier point de la sortie', () => {
    const acc0 = createRideAccumulator();
    const result = ingestTrackPoint(
      acc0,
      point({ latitude: 0, longitude: 0, timestamp: 0, speedKmh: 120 }),
    );

    // Le point reste geometriquement valide (coordonnees plausibles) : seule
    // la vitesse rapportee par le capteur est jugee aberrante et ignoree.
    expect(result.accepted).toBe(true);
    expect(result.currentSpeedKmh).toBeNull();
    expect(result.accumulator.maxSpeedKmh).toBe(0);
  });

  it('ignore une vitesse capteur aberrante et retombe sur la vitesse implicite quand le deplacement est plausible', () => {
    const acc0 = createRideAccumulator();
    const first = ingestTrackPoint(acc0, point({ latitude: 0, longitude: 0, timestamp: 0 }));
    const second = ingestTrackPoint(
      first.accumulator,
      point({ latitude: 0.001, longitude: 0, timestamp: 10000, speedKmh: 120 }),
    );

    expect(second.accepted).toBe(true);
    expect(second.currentSpeedKmh).not.toBeNull();
    // Identique a la vitesse de repli distance/temps du test existant
    // ("calcule la vitesse instantanee par repli distance temps"), car la
    // vitesse capteur aberrante (120) doit etre totalement ignoree.
    expect(second.currentSpeedKmh!).toBeCloseTo(40.03, 1);
    expect(second.accumulator.maxSpeedKmh).toBeCloseTo(40.03, 1);
  });

  it('accepte une vitesse capteur exactement egale au seuil plausible', () => {
    const acc0 = createRideAccumulator();
    const result = ingestTrackPoint(
      acc0,
      point({ latitude: 0, longitude: 0, timestamp: 0, speedKmh: GPS_MAX_PLAUSIBLE_SPEED_KMH }),
    );

    expect(result.accepted).toBe(true);
    expect(result.currentSpeedKmh).toBe(GPS_MAX_PLAUSIBLE_SPEED_KMH);
    expect(result.accumulator.maxSpeedKmh).toBe(GPS_MAX_PLAUSIBLE_SPEED_KMH);
  });

  it('rejette une vitesse capteur legerement superieure au seuil plausible', () => {
    const acc0 = createRideAccumulator();
    const result = ingestTrackPoint(
      acc0,
      point({ latitude: 0, longitude: 0, timestamp: 0, speedKmh: GPS_MAX_PLAUSIBLE_SPEED_KMH + 0.1 }),
    );

    expect(result.accepted).toBe(true);
    expect(result.currentSpeedKmh).toBeNull();
    expect(result.accumulator.maxSpeedKmh).toBe(0);
  });

  it('rejette une vitesse capteur infinie', () => {
    const acc0 = createRideAccumulator();
    const result = ingestTrackPoint(
      acc0,
      point({ latitude: 0, longitude: 0, timestamp: 0, speedKmh: Infinity }),
    );

    expect(result.accepted).toBe(true);
    expect(result.currentSpeedKmh).toBeNull();
    expect(result.accumulator.maxSpeedKmh).toBe(0);
  });

  it('rejette une vitesse capteur NaN', () => {
    const acc0 = createRideAccumulator();
    const result = ingestTrackPoint(
      acc0,
      point({ latitude: 0, longitude: 0, timestamp: 0, speedKmh: NaN }),
    );

    expect(result.accepted).toBe(true);
    expect(result.currentSpeedKmh).toBeNull();
    expect(result.accumulator.maxSpeedKmh).toBe(0);
  });

  it('ne laisse jamais maxSpeedKmh depasser le seuil plausible sur une sequence mixte capteur/implicite', () => {
    const sequence: RideTrackPoint[] = [
      point({ latitude: 0, longitude: 0, timestamp: 0, speedKmh: 500 }),
      point({ latitude: 0.0001, longitude: 0, timestamp: 5000, speedKmh: GPS_MAX_PLAUSIBLE_SPEED_KMH - 1 }),
      point({ latitude: 0.0002, longitude: 0, timestamp: 10000, speedKmh: -999 }),
      point({ latitude: 0.0003, longitude: 0, timestamp: 15000, speedKmh: Infinity }),
      point({ latitude: 0.0004, longitude: 0, timestamp: 20000, speedKmh: NaN }),
    ];

    let acc = createRideAccumulator();
    for (const p of sequence) {
      const result = ingestTrackPoint(acc, p);
      acc = result.accumulator;
      expect(acc.maxSpeedKmh).toBeLessThanOrEqual(GPS_MAX_PLAUSIBLE_SPEED_KMH);
      expect(Number.isFinite(acc.maxSpeedKmh)).toBe(true);
    }
  });
});
