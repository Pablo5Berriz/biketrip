-- ============================================================
-- Migration 004 — Fonctions utilitaires
-- ============================================================

-- Mise à jour automatique du champ updated_at
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Appliquer le trigger updated_at sur les tables concernées
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_trails
  BEFORE UPDATE ON trails
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_reports
  BEFORE UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_trail_reviews
  BEFORE UPDATE ON trail_reviews
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_collections
  BEFORE UPDATE ON collections
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_rides
  BEFORE UPDATE ON rides
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_points_of_interest
  BEFORE UPDATE ON points_of_interest
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_planned_rides
  BEFORE UPDATE ON planned_rides
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- Créer un profil automatiquement à l'inscription
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- Expirer automatiquement les signalements anciens
-- ============================================================
CREATE OR REPLACE FUNCTION expire_old_reports()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE reports
  SET status = 'EXPIRED', updated_at = now()
  WHERE status = 'ACTIVE'
    AND expires_at IS NOT NULL
    AND expires_at < now();
END;
$$;

-- ============================================================
-- Recalculer la note moyenne d'une piste
-- ============================================================
CREATE OR REPLACE FUNCTION update_trail_average_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE trails
  SET average_rating = (
    SELECT ROUND(AVG(rating)::numeric, 2)
    FROM trail_reviews
    WHERE trail_id = COALESCE(NEW.trail_id, OLD.trail_id)
      AND deleted_at IS NULL
  )
  WHERE id = COALESCE(NEW.trail_id, OLD.trail_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER recalc_trail_rating_after_review
  AFTER INSERT OR UPDATE OR DELETE ON trail_reviews
  FOR EACH ROW EXECUTE FUNCTION update_trail_average_rating();

-- ============================================================
-- Mise à jour compteurs de votes sur les signalements
-- ============================================================
CREATE OR REPLACE FUNCTION update_report_vote_counts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_report_id UUID := COALESCE(NEW.report_id, OLD.report_id);
BEGIN
  UPDATE reports
  SET
    confirmed_count = (
      SELECT COUNT(*) FROM report_votes
      WHERE report_id = v_report_id AND vote_type = 'CONFIRM'
    ),
    resolved_count = (
      SELECT COUNT(*) FROM report_votes
      WHERE report_id = v_report_id AND vote_type = 'RESOLVED'
    ),
    updated_at = now()
  WHERE id = v_report_id;

  -- Auto-confirmer si 3+ confirmations
  UPDATE reports
  SET status = 'CONFIRMED', updated_at = now()
  WHERE id = v_report_id
    AND status = 'ACTIVE'
    AND confirmed_count >= 3;

  -- Auto-résoudre si 5+ votes résolus
  UPDATE reports
  SET status = 'RESOLVED', updated_at = now()
  WHERE id = v_report_id
    AND status IN ('ACTIVE', 'CONFIRMED')
    AND resolved_count >= 5;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_vote_counts
  AFTER INSERT OR DELETE ON report_votes
  FOR EACH ROW EXECUTE FUNCTION update_report_vote_counts();

-- ============================================================
-- Recherche de pistes proches (rayon en km)
-- ============================================================
CREATE OR REPLACE FUNCTION nearby_trails(
  lat   FLOAT8,
  lng   FLOAT8,
  radius_km FLOAT8 DEFAULT 25
)
RETURNS TABLE (
  id            UUID,
  name          TEXT,
  distance_km   NUMERIC,
  difficulty    trail_difficulty,
  surface_type  surface_type,
  average_rating NUMERIC,
  start_latitude  NUMERIC,
  start_longitude NUMERIC,
  dist_meters   FLOAT8
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.name,
    t.distance_km,
    t.difficulty,
    t.surface_type,
    t.average_rating,
    t.start_latitude,
    t.start_longitude,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(t.start_longitude::float8, t.start_latitude::float8), 4326)::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) AS dist_meters
  FROM trails t
  WHERE ST_DWithin(
    ST_SetSRID(ST_MakePoint(t.start_longitude::float8, t.start_latitude::float8), 4326)::geography,
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
    radius_km * 1000
  )
  ORDER BY dist_meters ASC;
END;
$$;

-- ============================================================
-- Signalements proches d'un point
-- ============================================================
CREATE OR REPLACE FUNCTION nearby_reports(
  lat   FLOAT8,
  lng   FLOAT8,
  radius_km FLOAT8 DEFAULT 5
)
RETURNS TABLE (
  id         UUID,
  type       report_type,
  severity   report_severity,
  status     report_status,
  latitude   NUMERIC,
  longitude  NUMERIC,
  dist_meters FLOAT8
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.type,
    r.severity,
    r.status,
    r.latitude,
    r.longitude,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(r.longitude::float8, r.latitude::float8), 4326)::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
    ) AS dist_meters
  FROM reports r
  WHERE r.status IN ('ACTIVE', 'CONFIRMED')
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(r.longitude::float8, r.latitude::float8), 4326)::geography,
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      radius_km * 1000
    )
  ORDER BY dist_meters ASC;
END;
$$;
