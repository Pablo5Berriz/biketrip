-- ============================================================
-- Migration 005 — Row Level Security (RLS)
-- ============================================================

-- Activer RLS sur toutes les tables sensibles
ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports             ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_votes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_comments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE trail_reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites           ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections         ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_trails   ENABLE ROW LEVEL SECURITY;
ALTER TABLE rides               ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_points         ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_photos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_rides       ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs          ENABLE ROW LEVEL SECURITY;

-- Les trails et POI sont publics en lecture
ALTER TABLE trails              ENABLE ROW LEVEL SECURITY;
ALTER TABLE trail_points        ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_of_interest  ENABLE ROW LEVEL SECURITY;
ALTER TABLE weather_snapshots   ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Helper : rôle de l'utilisateur courant
-- ============================================================
CREATE OR REPLACE FUNCTION current_user_role()
RETURNS user_role LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE
  v_role user_role;
BEGIN
  SELECT role INTO v_role FROM profiles WHERE id = auth.uid();
  RETURN COALESCE(v_role, 'USER'::user_role);
END;
$$;

-- ============================================================
-- POLICIES : profiles
-- ============================================================
CREATE POLICY "profiles: lire son propre profil"
  ON profiles FOR SELECT
  USING (id = auth.uid() OR NOT is_private);

CREATE POLICY "profiles: modifier son propre profil"
  ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles: admin lit tout"
  ON profiles FOR SELECT
  USING (current_user_role() IN ('ADMIN', 'SUPER_ADMIN'));

-- ============================================================
-- POLICIES : trails (lecture publique, écriture admin)
-- ============================================================
CREATE POLICY "trails: lecture publique"
  ON trails FOR SELECT
  USING (true);

CREATE POLICY "trails: écriture admin uniquement"
  ON trails FOR ALL
  USING (current_user_role() IN ('ADMIN', 'SUPER_ADMIN'));

CREATE POLICY "trail_points: lecture publique"
  ON trail_points FOR SELECT
  USING (true);

CREATE POLICY "trail_points: écriture admin"
  ON trail_points FOR ALL
  USING (current_user_role() IN ('ADMIN', 'SUPER_ADMIN'));

-- ============================================================
-- POLICIES : reports
-- ============================================================
CREATE POLICY "reports: lecture publique (actif/confirmé)"
  ON reports FOR SELECT
  USING (
    status IN ('ACTIVE', 'CONFIRMED')
    OR user_id = auth.uid()
    OR current_user_role() IN ('MODERATOR', 'ADMIN', 'SUPER_ADMIN')
  );

CREATE POLICY "reports: créer un signalement (connecté)"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "reports: modifier son propre signalement"
  ON reports FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "reports: modération"
  ON reports FOR UPDATE
  USING (current_user_role() IN ('MODERATOR', 'ADMIN', 'SUPER_ADMIN'));

CREATE POLICY "reports: suppression admin"
  ON reports FOR DELETE
  USING (current_user_role() IN ('ADMIN', 'SUPER_ADMIN'));

-- ============================================================
-- POLICIES : report_votes
-- ============================================================
CREATE POLICY "report_votes: lecture"
  ON report_votes FOR SELECT
  USING (true);

CREATE POLICY "report_votes: voter (connecté)"
  ON report_votes FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "report_votes: supprimer son vote"
  ON report_votes FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- POLICIES : report_comments
-- ============================================================
CREATE POLICY "report_comments: lecture publique"
  ON report_comments FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "report_comments: commenter (connecté)"
  ON report_comments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "report_comments: supprimer son commentaire"
  ON report_comments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "report_comments: modération"
  ON report_comments FOR UPDATE
  USING (current_user_role() IN ('MODERATOR', 'ADMIN', 'SUPER_ADMIN'));

-- ============================================================
-- POLICIES : trail_reviews
-- ============================================================
CREATE POLICY "trail_reviews: lecture publique"
  ON trail_reviews FOR SELECT
  USING (deleted_at IS NULL);

CREATE POLICY "trail_reviews: créer un avis"
  ON trail_reviews FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "trail_reviews: modifier son avis"
  ON trail_reviews FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "trail_reviews: modération"
  ON trail_reviews FOR UPDATE
  USING (current_user_role() IN ('MODERATOR', 'ADMIN', 'SUPER_ADMIN'));

-- ============================================================
-- POLICIES : favorites
-- ============================================================
CREATE POLICY "favorites: voir ses favoris"
  ON favorites FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "favorites: ajouter un favori"
  ON favorites FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND user_id = auth.uid());

CREATE POLICY "favorites: supprimer son favori"
  ON favorites FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- POLICIES : collections
-- ============================================================
CREATE POLICY "collections: voir ses collections"
  ON collections FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "collections: gérer ses collections"
  ON collections FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- POLICIES : collection_trails
-- ============================================================
CREATE POLICY "collection_trails: voir"
  ON collection_trails FOR SELECT
  USING (
    collection_id IN (SELECT id FROM collections WHERE user_id = auth.uid())
  );

CREATE POLICY "collection_trails: gérer"
  ON collection_trails FOR ALL
  USING (
    collection_id IN (SELECT id FROM collections WHERE user_id = auth.uid())
  );

-- ============================================================
-- POLICIES : rides
-- ============================================================
CREATE POLICY "rides: voir ses sorties"
  ON rides FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "rides: gérer ses sorties"
  ON rides FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "rides: admin lit tout"
  ON rides FOR SELECT
  USING (current_user_role() IN ('ADMIN', 'SUPER_ADMIN'));

-- ============================================================
-- POLICIES : ride_points
-- ============================================================
CREATE POLICY "ride_points: accès propriétaire"
  ON ride_points FOR ALL
  USING (
    ride_id IN (SELECT id FROM rides WHERE user_id = auth.uid())
  );

-- ============================================================
-- POLICIES : ride_photos
-- ============================================================
CREATE POLICY "ride_photos: accès propriétaire"
  ON ride_photos FOR ALL
  USING (user_id = auth.uid());

-- ============================================================
-- POLICIES : points_of_interest
-- ============================================================
CREATE POLICY "poi: lecture publique"
  ON points_of_interest FOR SELECT
  USING (true);

CREATE POLICY "poi: écriture admin"
  ON points_of_interest FOR ALL
  USING (current_user_role() IN ('ADMIN', 'SUPER_ADMIN'));

-- ============================================================
-- POLICIES : planned_rides
-- ============================================================
CREATE POLICY "planned_rides: accès propriétaire"
  ON planned_rides FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- POLICIES : weather_snapshots
-- ============================================================
CREATE POLICY "weather: lecture publique"
  ON weather_snapshots FOR SELECT
  USING (true);

CREATE POLICY "weather: insertion système"
  ON weather_snapshots FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- POLICIES : audit_logs
-- ============================================================
CREATE POLICY "audit: admin uniquement"
  ON audit_logs FOR SELECT
  USING (current_user_role() IN ('ADMIN', 'SUPER_ADMIN'));

CREATE POLICY "audit: insertion système"
  ON audit_logs FOR INSERT
  WITH CHECK (true);
