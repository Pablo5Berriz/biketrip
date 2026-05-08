# QA BikeTrip

## Tests Storage a executer

Executer ces scenarios sur une base Supabase locale ou de staging apres application des migrations.

1. User A peut uploader `avatars/{userA}/avatar.webp`.
   Resultat attendu : upload accepte, URL publique lisible.

2. User B ne peut pas supprimer `avatars/{userA}/avatar.webp`.
   Resultat attendu : suppression refusee par la policy `avatars: supprimer son avatar`.

3. User A peut uploader `report-images/{userA}/incident.webp`.
   Resultat attendu : upload accepte dans le dossier de user A.

4. User B ne peut pas supprimer `report-images/{userA}/incident.webp`.
   Resultat attendu : suppression refusee par la policy `reports: supprimer son image`.

5. User A peut lire publiquement une image `report-images`.
   Resultat attendu : lecture publique acceptee, car les images de reports publics sont partageables.

6. User A ne peut pas lire `ride-photos/{userB}/photo.webp`.
   Resultat attendu : lecture refusee, car `ride-photos` est prive et filtre le premier segment du chemin avec `auth.uid()`.

7. Admin peut uploader `trail-covers/{trailId}/cover.webp`.
   Resultat attendu : upload accepte si `current_user_role()` retourne `ADMIN` ou `SUPER_ADMIN`.

8. User standard ne peut pas uploader `trail-covers/{trailId}/cover.webp`.
   Resultat attendu : upload refuse par la policy `trail-covers: upload admin`.

## Commandes de controle securite

```powershell
rg "ENABLE ROW LEVEL SECURITY|CREATE POLICY|auth.uid|WITH CHECK|USING|role|admin|moderator|audit_logs" supabase\migrations
rg "storage|bucket|objects|trail-covers|report-images|ride-photos|avatars|CREATE POLICY|WITH CHECK|USING" supabase src
rg "service_role|SUPABASE_SERVICE|secret|password|anon|createClient" .env.example src app supabase
npm run lint
npm run type-check
npm test
```

## Execution des tests RLS SQL

Prerequis local :

- Docker Desktop demarre.
- Supabase CLI disponible via `npx supabase`.
- Base locale initialisee avec les migrations du projet.

Commande locale :

```powershell
npx supabase db reset
npx supabase db query --local --file supabase/tests/rls_security.sql
```

Commande staging, si une base de staging est fournie :

```powershell
npx supabase db query --db-url "$env:DATABASE_URL" --file supabase/tests/rls_security.sql
```

Resultat attendu :

- chaque assertion emet un `NOTICE: PASS`;
- aucun `FAIL` ne doit apparaitre;
- la transaction se termine par `ROLLBACK`, sans modifier durablement les donnees de test.
