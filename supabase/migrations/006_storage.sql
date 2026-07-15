-- ============================================================
-- Migration 006 — Buckets Supabase Storage
-- ============================================================

-- Bucket pour les avatars (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT DO NOTHING;

-- Bucket pour les images de signalements (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'report-images',
  'report-images',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT DO NOTHING;

-- Bucket pour les photos de sorties (privé, accès propriétaire)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ride-photos',
  'ride-photos',
  false,
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT DO NOTHING;

-- Bucket pour les photos de couverture des pistes (public, admin)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'trail-covers',
  'trail-covers',
  true,
  10485760,  -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT DO NOTHING;

-- ============================================================
-- Policies de stockage
-- ============================================================

-- avatars : chaque utilisateur gère son dossier
CREATE POLICY "avatars: upload propriétaire"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatars: lecture publique"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars: supprimer son avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- report-images : upload par utilisateur connecté dans son dossier
CREATE POLICY "reports: upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'report-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "reports: lecture publique"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'report-images');

CREATE POLICY "reports: supprimer son image"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'report-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ride-photos : accès uniquement propriétaire
CREATE POLICY "ride-photos: upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'ride-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "ride-photos: lecture propriétaire"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'ride-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "ride-photos: supprimer"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'ride-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- trail-covers : lecture publique, écriture admin
CREATE POLICY "trail-covers: lecture publique"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'trail-covers');

CREATE POLICY "trail-covers: upload admin"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'trail-covers'
    AND current_user_role() IN ('ADMIN', 'SUPER_ADMIN')
  );

CREATE POLICY "trail-covers: supprimer admin"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'trail-covers'
    AND current_user_role() IN ('ADMIN', 'SUPER_ADMIN')
  );
