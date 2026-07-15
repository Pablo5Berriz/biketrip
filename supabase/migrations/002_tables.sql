-- ============================================================
-- Migration 002 — Tables BikeTrip
-- ============================================================

-- Extension pour UUID et géographie
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- ============================================================
-- TABLE : profiles
-- ============================================================
CREATE TABLE profiles (
  id                      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name               TEXT,
  avatar_url              TEXT,
  city                    TEXT,
  cycling_level           cycling_level NOT NULL DEFAULT 'CASUAL',
  primary_bike_type       bike_type NOT NULL DEFAULT 'URBAN',
  preferred_surface       surface_type,
  comfortable_distance_km INTEGER DEFAULT 30,
  unit_system             unit_system NOT NULL DEFAULT 'METRIC',
  is_private              BOOLEAN NOT NULL DEFAULT false,
  role                    user_role NOT NULL DEFAULT 'USER',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at              TIMESTAMPTZ
);

-- ============================================================
-- TABLE : trails (pistes cyclables)
-- ============================================================
CREATE TABLE trails (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                      TEXT NOT NULL,
  slug                      TEXT UNIQUE NOT NULL,
  description               TEXT,
  city                      TEXT NOT NULL,
  region                    TEXT NOT NULL,
  country                   TEXT NOT NULL DEFAULT 'Canada',
  distance_km               NUMERIC(8,2) NOT NULL,
  estimated_duration_minutes INTEGER,
  elevation_gain_m          INTEGER DEFAULT 0,
  elevation_loss_m          INTEGER DEFAULT 0,
  min_altitude_m            INTEGER,
  max_altitude_m            INTEGER,
  difficulty                trail_difficulty NOT NULL DEFAULT 'EASY',
  surface_type              surface_type NOT NULL DEFAULT 'ASPHALT',
  trail_type                trail_type NOT NULL DEFAULT 'URBAN',
  recommended_bike_types    bike_type[] DEFAULT '{}',
  safety_score              NUMERIC(3,1) DEFAULT 5.0 CHECK (safety_score BETWEEN 0 AND 10),
  popularity_score          NUMERIC(3,1) DEFAULT 0.0,
  average_rating            NUMERIC(3,2) DEFAULT 0.0,
  cover_image_url           TEXT,
  geometry_geojson          JSONB,
  start_latitude            NUMERIC(10,7) NOT NULL,
  start_longitude           NUMERIC(10,7) NOT NULL,
  end_latitude              NUMERIC(10,7),
  end_longitude             NUMERIC(10,7),
  is_verified               BOOLEAN NOT NULL DEFAULT false,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE : trail_points (points GPS d'une piste)
-- ============================================================
CREATE TABLE trail_points (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trail_id     UUID NOT NULL REFERENCES trails(id) ON DELETE CASCADE,
  latitude     NUMERIC(10,7) NOT NULL,
  longitude    NUMERIC(10,7) NOT NULL,
  altitude_m   INTEGER,
  position     INTEGER NOT NULL,  -- ordre du point sur la piste
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE : reports (signalements)
-- ============================================================
CREATE TABLE reports (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trail_id         UUID REFERENCES trails(id) ON DELETE SET NULL,
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type             report_type NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  severity         report_severity NOT NULL DEFAULT 'MEDIUM',
  status           report_status NOT NULL DEFAULT 'ACTIVE',
  latitude         NUMERIC(10,7) NOT NULL,
  longitude        NUMERIC(10,7) NOT NULL,
  image_url        TEXT,
  confirmed_count  INTEGER NOT NULL DEFAULT 0,
  resolved_count   INTEGER NOT NULL DEFAULT 0,
  expires_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE : report_votes
-- ============================================================
CREATE TABLE report_votes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id   UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote_type   vote_type NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(report_id, user_id, vote_type)
);

-- ============================================================
-- TABLE : report_comments
-- ============================================================
CREATE TABLE report_comments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id   UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ
);

-- ============================================================
-- TABLE : trail_reviews (avis sur une piste)
-- ============================================================
CREATE TABLE trail_reviews (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trail_id    UUID NOT NULL REFERENCES trails(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating      INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at  TIMESTAMPTZ,
  UNIQUE(trail_id, user_id)
);

-- ============================================================
-- TABLE : favorites
-- ============================================================
CREATE TABLE favorites (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trail_id    UUID NOT NULL REFERENCES trails(id) ON DELETE CASCADE,
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, trail_id)
);

-- ============================================================
-- TABLE : collections
-- ============================================================
CREATE TABLE collections (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE : collection_trails
-- ============================================================
CREATE TABLE collection_trails (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  collection_id  UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  trail_id       UUID NOT NULL REFERENCES trails(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(collection_id, trail_id)
);

-- ============================================================
-- TABLE : rides (sorties vélo)
-- ============================================================
CREATE TABLE rides (
  id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trail_id           UUID REFERENCES trails(id) ON DELETE SET NULL,
  title              TEXT,
  started_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at           TIMESTAMPTZ,
  distance_km        NUMERIC(8,2) DEFAULT 0,
  duration_seconds   INTEGER DEFAULT 0,
  average_speed_kmh  NUMERIC(5,1),
  max_speed_kmh      NUMERIC(5,1),
  elevation_gain_m   INTEGER DEFAULT 0,
  elevation_loss_m   INTEGER DEFAULT 0,
  weather_summary    TEXT,
  notes              TEXT,
  status             ride_status NOT NULL DEFAULT 'ACTIVE',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE : ride_points (trace GPS d'une sortie)
-- ============================================================
CREATE TABLE ride_points (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id      UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  latitude     NUMERIC(10,7) NOT NULL,
  longitude    NUMERIC(10,7) NOT NULL,
  altitude_m   INTEGER,
  speed_kmh    NUMERIC(5,1),
  recorded_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE : ride_photos
-- ============================================================
CREATE TABLE ride_photos (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ride_id     UUID NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  caption     TEXT,
  latitude    NUMERIC(10,7),
  longitude   NUMERIC(10,7),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE : points_of_interest
-- ============================================================
CREATE TABLE points_of_interest (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trail_id    UUID REFERENCES trails(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  type        poi_type NOT NULL,
  description TEXT,
  latitude    NUMERIC(10,7) NOT NULL,
  longitude   NUMERIC(10,7) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE : planned_rides (sorties planifiées)
-- ============================================================
CREATE TABLE planned_rides (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trail_id      UUID NOT NULL REFERENCES trails(id) ON DELETE CASCADE,
  planned_date  DATE NOT NULL,
  planned_time  TIME,
  notes         TEXT,
  status        planned_ride_status NOT NULL DEFAULT 'PLANNED',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE : weather_snapshots
-- ============================================================
CREATE TABLE weather_snapshots (
  id                       UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trail_id                 UUID REFERENCES trails(id) ON DELETE SET NULL,
  ride_id                  UUID REFERENCES rides(id) ON DELETE SET NULL,
  latitude                 NUMERIC(10,7) NOT NULL,
  longitude                NUMERIC(10,7) NOT NULL,
  temperature_c            NUMERIC(5,1),
  feels_like_c             NUMERIC(5,1),
  wind_speed_kmh           NUMERIC(5,1),
  wind_gust_kmh            NUMERIC(5,1),
  precipitation_probability INTEGER,
  humidity                 INTEGER,
  uv_index                 INTEGER,
  visibility_km            NUMERIC(5,1),
  raw_data                 JSONB,
  captured_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE : audit_logs
-- ============================================================
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity      TEXT NOT NULL,
  entity_id   UUID,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
