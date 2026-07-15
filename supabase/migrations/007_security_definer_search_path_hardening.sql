-- ============================================================
-- Migration 007 — Durcissement search_path des fonctions SECURITY DEFINER
-- ============================================================
-- Contexte (lot BIKETRIP-P0-SEC-001) :
-- Les fonctions SECURITY DEFINER ci-dessous s'exécutent avec les privilèges
-- de leur PROPRIÉTAIRE, pas de l'appelant. Sans search_path verrouillé au
-- niveau de la fonction, la résolution des objets non qualifiés (tables,
-- types, fonctions) dépend du search_path de la SESSION APPELANTE. Un rôle
-- disposant du droit CREATE sur un schéma placé avant "public" dans son
-- propre search_path pourrait potentiellement faire résoudre un objet
-- homonyme forgé au lieu de l'objet public.* attendu ("search_path
-- hijacking" — cf. avis de sécurité PostgreSQL historiques CVE-2018-1058 et
-- la règle de durcissement standard qui en découle).
--
-- current_user_role() est appelée par la quasi-totalité des politiques RLS
-- d'écriture du projet (voir 005_rls.sql) : c'est la fonction la plus
-- sensible à durcir.
--
-- Correction appliquée : recréer les 4 fonctions avec SET search_path = ''
-- (recommandation officielle du linter de sécurité Supabase pour l'alerte
-- "Function Search Path Mutable") et qualifier explicitement par leur schéma
-- ("public." ou "auth.") tous les objets référencés dans le corps de chaque
-- fonction. pg_catalog reste implicitement résolu par PostgreSQL quel que
-- soit le search_path configuré (comportement documenté), donc les
-- fonctions/opérateurs standard (now(), COALESCE, l'opérateur ->>, etc.)
-- continuent de fonctionner normalement.
--
-- Aucune signature, aucun type de retour, aucun comportement métier n'est
-- modifié. Migration strictement additive : les migrations 001 à 006 ne
-- sont pas modifiées par ce fichier.
-- ============================================================

-- ----------------------------------------------------------------
-- handle_new_user()
-- Référence : public.profiles (INSERT).
-- Reste SECURITY DEFINER : nécessaire — au moment où ce trigger se déclenche
-- (AFTER INSERT ON auth.users), l'utilisateur nouvellement créé n'a pas
-- encore de ligne dans profiles ; l'insertion doit s'exécuter avec les
-- privilèges du propriétaire de la fonction pour ne pas dépendre d'une
-- policy RLS "profiles: modifier son propre profil" qui ne peut pas encore
-- s'appliquer (la ligne n'existe pas au moment du INSERT).
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------
-- expire_old_reports()
-- Référence : public.reports (UPDATE).
-- Reste SECURITY DEFINER : nécessaire — cette fonction doit pouvoir expirer
-- des signalements appartenant à n'importe quel utilisateur (tâche de
-- maintenance globale), ce qui dépasse le périmètre de la policy
-- "reports: modifier son propre signalement" liée à auth.uid().
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_old_reports()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.reports
  SET status = 'EXPIRED', updated_at = now()
  WHERE status = 'ACTIVE'
    AND expires_at IS NOT NULL
    AND expires_at < now();
END;
$$;

-- ----------------------------------------------------------------
-- current_user_role()
-- Référence : public.profiles (SELECT), public.user_role (type énuméré),
-- auth.uid() (fonction du schéma auth — déjà qualifiée dans le code
-- d'origine, revalidée explicitement ici).
-- Reste SECURITY DEFINER et STABLE : nécessaire — cette fonction est
-- utilisée à l'intérieur même des policies RLS de "profiles" ; si elle
-- n'était pas SECURITY DEFINER, l'appel à "SELECT role FROM profiles"
-- déclencherait une évaluation récursive des policies RLS de profiles
-- (qui dépendent elles-mêmes potentiellement du rôle courant), avec un
-- risque de récursion ou de résultat incohérent. SECURITY DEFINER isole
-- cette lecture des policies RLS de profiles, ce qui est le pattern
-- standard recommandé pour ce type de fonction "helper de rôle".
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = ''
AS $$
DECLARE
  v_role public.user_role;
BEGIN
  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  RETURN COALESCE(v_role, 'USER'::public.user_role);
END;
$$;

-- ----------------------------------------------------------------
-- prevent_profile_role_escalation()
-- Référence : public.current_user_role() (déjà qualifiée ci-dessus).
-- Reste SECURITY DEFINER : nécessaire pour appeler current_user_role() de
-- façon cohérente avec son propre statut SECURITY DEFINER, dans le contexte
-- du trigger BEFORE UPDATE ON profiles.
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_profile_role_escalation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND public.current_user_role() NOT IN ('ADMIN', 'SUPER_ADMIN') THEN
    RAISE EXCEPTION 'Modification du rôle non autorisée';
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================
-- Note sur les privilèges EXECUTE (vérification, pas de changement)
-- ============================================================
-- Les 4 fonctions ci-dessus doivent rester exécutables par le rôle
-- "authenticated" (elles sont invoquées à l'intérieur des policies RLS
-- évaluées pour ce rôle) et par le système (triggers, qui s'exécutent
-- indépendamment des privilèges EXECUTE de l'appelant SQL). Aucun GRANT ni
-- REVOKE n'est modifié par cette migration : les privilèges EXECUTE par
-- défaut de PostgreSQL (accordés à PUBLIC à la création de toute fonction,
-- sauf révocation explicite) étaient déjà en vigueur avant ce lot et
-- continuent de l'être après. Une revue plus stricte des privilèges EXECUTE
-- (révoquer PUBLIC puis regranter explicitement à authenticated/service_role
-- selon le besoin réel de chaque fonction) est documentée comme piste
-- d'amélioration P3 dans le backlog de reprise, hors périmètre de ce lot
-- P0 strictement focalisé sur le search_path.
