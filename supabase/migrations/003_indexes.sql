-- ============================================================
-- Migration 003 — Index de performance
-- ============================================================

-- --- profiles ---
CREATE INDEX idx_profiles_role        ON profiles(role);
CREATE INDEX idx_profiles_deleted_at  ON profiles(deleted_at) WHERE deleted_at IS NULL;

-- --- trails ---
CREATE INDEX idx_trails_difficulty    ON trails(difficulty);
CREATE INDEX idx_trails_surface_type  ON trails(surface_type);
CREATE INDEX idx_trails_trail_type    ON trails(trail_type);
CREATE INDEX idx_trails_is_verified   ON trails(is_verified);
CREATE INDEX idx_trails_slug          ON trails(slug);
-- Index géographique sur le point de départ
CREATE INDEX idx_trails_start_location
  ON trails USING gist(
    ST_SetSRID(ST_MakePoint(start_longitude::float8, start_latitude::float8), 4326)
  );

-- --- trail_points ---
CREATE INDEX idx_trail_points_trail_id ON trail_points(trail_id);
CREATE INDEX idx_trail_points_position ON trail_points(trail_id, position);

-- --- reports ---
CREATE INDEX idx_reports_trail_id    ON reports(trail_id);
CREATE INDEX idx_reports_user_id     ON reports(user_id);
CREATE INDEX idx_reports_status      ON reports(status);
CREATE INDEX idx_reports_severity    ON reports(severity);
CREATE INDEX idx_reports_type        ON reports(type);
CREATE INDEX idx_reports_created_at  ON reports(created_at DESC);
CREATE INDEX idx_reports_expires_at  ON reports(expires_at) WHERE expires_at IS NOT NULL;
-- Index géographique pour les signalements proches
CREATE INDEX idx_reports_location
  ON reports USING gist(
    ST_SetSRID(ST_MakePoint(longitude::float8, latitude::float8), 4326)
  );

-- --- report_votes ---
CREATE INDEX idx_report_votes_report_id ON report_votes(report_id);
CREATE INDEX idx_report_votes_user_id   ON report_votes(user_id);

-- --- report_comments ---
CREATE INDEX idx_report_comments_report_id  ON report_comments(report_id);
CREATE INDEX idx_report_comments_deleted_at ON report_comments(deleted_at) WHERE deleted_at IS NULL;

-- --- trail_reviews ---
CREATE INDEX idx_trail_reviews_trail_id   ON trail_reviews(trail_id);
CREATE INDEX idx_trail_reviews_user_id    ON trail_reviews(user_id);
CREATE INDEX idx_trail_reviews_deleted_at ON trail_reviews(deleted_at) WHERE deleted_at IS NULL;

-- --- favorites ---
CREATE INDEX idx_favorites_user_id  ON favorites(user_id);
CREATE INDEX idx_favorites_trail_id ON favorites(trail_id);

-- --- collections ---
CREATE INDEX idx_collections_user_id ON collections(user_id);

-- --- collection_trails ---
CREATE INDEX idx_collection_trails_collection_id ON collection_trails(collection_id);
CREATE INDEX idx_collection_trails_trail_id       ON collection_trails(trail_id);

-- --- rides ---
CREATE INDEX idx_rides_user_id    ON rides(user_id);
CREATE INDEX idx_rides_trail_id   ON rides(trail_id);
CREATE INDEX idx_rides_status     ON rides(status);
CREATE INDEX idx_rides_started_at ON rides(started_at DESC);

-- --- ride_points ---
CREATE INDEX idx_ride_points_ride_id     ON ride_points(ride_id);
CREATE INDEX idx_ride_points_recorded_at ON ride_points(ride_id, recorded_at);

-- --- ride_photos ---
CREATE INDEX idx_ride_photos_ride_id ON ride_photos(ride_id);
CREATE INDEX idx_ride_photos_user_id ON ride_photos(user_id);

-- --- points_of_interest ---
CREATE INDEX idx_pois_trail_id ON points_of_interest(trail_id);
CREATE INDEX idx_pois_type     ON points_of_interest(type);
CREATE INDEX idx_pois_location
  ON points_of_interest USING gist(
    ST_SetSRID(ST_MakePoint(longitude::float8, latitude::float8), 4326)
  );

-- --- planned_rides ---
CREATE INDEX idx_planned_rides_user_id      ON planned_rides(user_id);
CREATE INDEX idx_planned_rides_trail_id     ON planned_rides(trail_id);
CREATE INDEX idx_planned_rides_planned_date ON planned_rides(planned_date);
CREATE INDEX idx_planned_rides_status       ON planned_rides(status);

-- --- weather_snapshots ---
CREATE INDEX idx_weather_trail_id    ON weather_snapshots(trail_id);
CREATE INDEX idx_weather_captured_at ON weather_snapshots(captured_at DESC);

-- --- audit_logs ---
CREATE INDEX idx_audit_user_id    ON audit_logs(user_id);
CREATE INDEX idx_audit_entity     ON audit_logs(entity, entity_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);
