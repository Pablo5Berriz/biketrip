-- ============================================================
-- Tests manuels RLS BikeTrip
-- ============================================================
-- Execution recommandee :
--   supabase db reset
--   psql "$DATABASE_URL" -f supabase/tests/rls_security.sql
--
-- Le script utilise les claims JWT Supabase locaux via request.jwt.claim.sub
-- et s'arrete a la premiere regression de securite.

BEGIN;

CREATE SCHEMA IF NOT EXISTS rls_test;

CREATE OR REPLACE FUNCTION rls_test.set_actor(actor_id uuid)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', actor_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
END;
$$;

CREATE OR REPLACE FUNCTION rls_test.assert_count(
  label text,
  actual_count bigint,
  expected_count bigint
)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF actual_count IS DISTINCT FROM expected_count THEN
    RAISE EXCEPTION 'FAIL: %, attendu %, obtenu %', label, expected_count, actual_count;
  END IF;
  RAISE NOTICE 'PASS: %', label;
END;
$$;

CREATE OR REPLACE FUNCTION rls_test.assert_blocked(label text, statement text)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  affected_rows integer;
BEGIN
  EXECUTE statement;
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  IF affected_rows > 0 THEN
    RAISE EXCEPTION 'FAIL: %, operation autorisee alors qu''elle doit etre bloquee', label;
  END IF;
  RAISE NOTICE 'PASS: %', label;
EXCEPTION
  WHEN insufficient_privilege OR check_violation OR raise_exception OR with_check_option_violation THEN
    RAISE NOTICE 'PASS: %', label;
END;
$$;

CREATE OR REPLACE FUNCTION rls_test.assert_allowed(label text, statement text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE statement;
  RAISE NOTICE 'PASS: %', label;
END;
$$;

GRANT USAGE ON SCHEMA rls_test TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA rls_test TO authenticated;

DO $$
DECLARE
  user_a uuid := '00000000-0000-4000-8000-0000000000a1';
  user_b uuid := '00000000-0000-4000-8000-0000000000b2';
  admin_user uuid := '00000000-0000-4000-8000-0000000000ad';
  moderator_user uuid := '00000000-0000-4000-8000-0000000000c3';
  trail_id uuid := '10000000-0000-4000-8000-000000000001';
  ride_a uuid := '20000000-0000-4000-8000-0000000000a1';
  ride_b uuid := '20000000-0000-4000-8000-0000000000b2';
  report_a uuid := '30000000-0000-4000-8000-0000000000a1';
  report_b_private uuid := '30000000-0000-4000-8000-0000000000b2';
  favorite_a uuid := '40000000-0000-4000-8000-0000000000a1';
  collection_a uuid := '50000000-0000-4000-8000-0000000000a1';
BEGIN
  PERFORM set_config('role', 'postgres', true);

  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
  VALUES
    (user_a, 'rls-user-a@example.test', 'test', now(), now(), now()),
    (user_b, 'rls-user-b@example.test', 'test', now(), now(), now()),
    (admin_user, 'rls-admin@example.test', 'test', now(), now(), now()),
    (moderator_user, 'rls-moderator@example.test', 'test', now(), now(), now())
  ON CONFLICT (id) DO NOTHING;

  ALTER TABLE profiles DISABLE TRIGGER prevent_profile_role_escalation;

  INSERT INTO profiles (id, full_name, is_private, role)
  VALUES
    (user_a, 'RLS User A', true, 'USER'),
    (user_b, 'RLS User B', false, 'USER'),
    (admin_user, 'RLS Admin', false, 'ADMIN'),
    (moderator_user, 'RLS Moderator', false, 'MODERATOR')
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      is_private = EXCLUDED.is_private,
      role = EXCLUDED.role;

  ALTER TABLE profiles ENABLE TRIGGER prevent_profile_role_escalation;

  INSERT INTO trails (
    id,
    name,
    slug,
    city,
    region,
    distance_km,
    start_latitude,
    start_longitude,
    is_verified
  )
  VALUES (
    trail_id,
    'RLS Test Trail',
    'rls-test-trail',
    'Montreal',
    'Quebec',
    12.5,
    45.5017,
    -73.5673,
    true
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO rides (id, user_id, trail_id, title, status)
  VALUES
    (ride_a, user_a, trail_id, 'Ride A privee', 'ACTIVE'),
    (ride_b, user_b, trail_id, 'Ride B privee', 'ACTIVE')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO ride_points (ride_id, latitude, longitude)
  VALUES
    (ride_a, 45.5017, -73.5673),
    (ride_b, 45.5020, -73.5680);

  INSERT INTO favorites (id, user_id, trail_id, note)
  VALUES (favorite_a, user_a, trail_id, 'Favori prive A')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO collections (id, user_id, name)
  VALUES (collection_a, user_a, 'Collection privee A')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO reports (id, user_id, trail_id, type, title, status, latitude, longitude)
  VALUES
    (report_a, user_a, trail_id, 'OBSTACLE', 'Report public A', 'ACTIVE', 45.5017, -73.5673),
    (report_b_private, user_b, trail_id, 'POTHOLE', 'Report non public B', 'RESOLVED', 45.5020, -73.5680)
  ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

  PERFORM rls_test.set_actor(user_a);

  PERFORM rls_test.assert_count(
    'user A lit son profil prive',
    (SELECT count(*) FROM profiles WHERE id = user_a),
    1
  );

  PERFORM rls_test.assert_count(
    'user A lit le profil public de user B',
    (SELECT count(*) FROM profiles WHERE id = user_b),
    1
  );

  PERFORM rls_test.assert_blocked(
    'user A ne peut pas auto-elever profiles.role',
    format('UPDATE profiles SET role = %L WHERE id = %L', 'ADMIN', user_a)
  );

  PERFORM rls_test.assert_blocked(
    'user A ne peut pas inserer audit_logs',
    format(
      'INSERT INTO audit_logs (user_id, action, entity, entity_id) VALUES (%L, %L, %L, %L)',
      user_a,
      'RLS_USER_INSERT',
      'profiles',
      user_a
    )
  );

  PERFORM rls_test.assert_count(
    'user A lit uniquement ses rides',
    (SELECT count(*) FROM rides WHERE id IN (ride_a, ride_b)),
    1
  );

  PERFORM rls_test.assert_count(
    'user A lit uniquement ses ride_points',
    (SELECT count(*) FROM ride_points WHERE ride_id IN (ride_a, ride_b)),
    1
  );

  PERFORM rls_test.assert_count(
    'user A lit uniquement ses favorites',
    (SELECT count(*) FROM favorites WHERE id = favorite_a),
    1
  );

  PERFORM rls_test.set_actor(user_b);

  PERFORM rls_test.assert_count(
    'user B ne lit pas les favorites de user A',
    (SELECT count(*) FROM favorites WHERE id = favorite_a),
    0
  );

  PERFORM rls_test.assert_count(
    'user B ne lit pas les collections de user A',
    (SELECT count(*) FROM collections WHERE id = collection_a),
    0
  );

  PERFORM rls_test.assert_count(
    'user B lit les reports publics ACTIVE/CONFIRMED',
    (SELECT count(*) FROM reports WHERE id = report_a),
    1
  );

  PERFORM rls_test.assert_blocked(
    'user B ne modifie pas le report de user A',
    format('UPDATE reports SET title = %L WHERE id = %L', 'Tentative B', report_a)
  );

  PERFORM rls_test.set_actor(user_a);

  PERFORM rls_test.assert_count(
    'user A ne lit pas un report RESOLVED appartenant a user B',
    (SELECT count(*) FROM reports WHERE id = report_b_private),
    0
  );

  PERFORM rls_test.assert_allowed(
    'auteur modifie son report',
    format('UPDATE reports SET title = %L WHERE id = %L', 'Update auteur A', report_a)
  );

  PERFORM rls_test.set_actor(moderator_user);

  PERFORM rls_test.assert_allowed(
    'moderator modifie un report',
    format('UPDATE reports SET status = %L WHERE id = %L', 'CONFIRMED', report_a)
  );

  PERFORM rls_test.assert_blocked(
    'moderator ne modifie pas profiles.role',
    format('UPDATE profiles SET role = %L WHERE id = %L', 'ADMIN', user_b)
  );

  PERFORM rls_test.set_actor(admin_user);

  PERFORM rls_test.assert_allowed(
    'admin modifie profiles.role',
    format('UPDATE profiles SET role = %L WHERE id = %L', 'MODERATOR', user_b)
  );

  PERFORM rls_test.assert_allowed(
    'admin insere audit_logs',
    format(
      'INSERT INTO audit_logs (user_id, action, entity, entity_id) VALUES (%L, %L, %L, %L)',
      admin_user,
      'RLS_ADMIN_INSERT',
      'profiles',
      user_b
    )
  );
END;
$$;

ROLLBACK;
