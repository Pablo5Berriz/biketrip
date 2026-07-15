# RAPPORT D'EXÉCUTION — BIKETRIP-P0-SEC-001

## 1. Statut

**PASS**

## 2. SHA initial

`dbf46f79efed39eb2db4b21a2c3b0bb02f6589a3` (branche `master`) — identique au SHA de référence de l'audit accepté sous réserves.

## 3. État Git initial

```
 M supabase/seed.sql                         (préexistant, fin de ligne CRLF/LF uniquement, sans changement de contenu)
?? docs/Prompt_Maitre.md                      (préexistant)
?? docs/Specification_Fonctionnelle.md        (préexistant)
?? docs/audits/                               (préexistant, livrables de l'audit)
```
Aucune migration, aucun fichier `app/`/`src/`, aucune dépendance n'était modifié avant le début de ce lot.

## 4. Inventaire des fonctions

| Fonction | Signature (arguments) | Type de retour | `SECURITY DEFINER` | `STABLE` | Fichier d'origine |
|---|---|---|---|---|---|
| `handle_new_user` | aucun (déclencheur) | `TRIGGER` | oui | non | `004_functions.sql:50-61` |
| `expire_old_reports` | aucun | `void` | oui | non | `004_functions.sql:70-79` |
| `current_user_role` | aucun | `user_role` | oui | oui | `005_rls.sql:29-37` |
| `prevent_profile_role_escalation` | aucun (déclencheur) | `TRIGGER` | oui | non | `005_rls.sql:40-49` |

Objets référencés sans qualification de schéma avant correction :
- `handle_new_user` → `profiles` (table)
- `expire_old_reports` → `reports` (table)
- `current_user_role` → `profiles` (table), `user_role` (type énuméré) — `auth.uid()` était déjà qualifié dans le code d'origine
- `prevent_profile_role_escalation` → `current_user_role()` (fonction)

Propriétaire : le rôle ayant exécuté les migrations (`postgres` dans l'environnement de test local ; l'équivalent `postgres`/`supabase_admin` en environnement Supabase réel). Droits `EXECUTE` : privilèges par défaut PostgreSQL (`PUBLIC`), inchangés par ce lot — voir §6 pour la justification de ne pas les restreindre dans ce lot.

## 5. Migration créée

`supabase/migrations/007_security_definer_search_path_hardening.sql` (nouveau fichier, additif, aucune migration existante modifiée).

Contenu : `CREATE OR REPLACE FUNCTION` pour les 4 fonctions, signatures et types de retour identiques à l'original, ajout de `SET search_path = ''` et qualification explicite `public.`/`auth.` de tous les objets référencés dans chaque corps de fonction. Commentaires SQL expliquant, pour chacune, pourquoi elle doit rester `SECURITY DEFINER`.

## 6. Choix de sécurité par fonction

**Configuration retenue : `SET search_path = ''`** (chaîne vide), pas `public, pg_temp`.

Justification commune aux 4 fonctions : `pg_catalog` reste toujours implicitement résolu par PostgreSQL quel que soit le `search_path` configuré (comportement documenté), donc les fonctions/opérateurs standard (`now()`, `COALESCE`, l'opérateur `->>`, comparaisons, `RAISE EXCEPTION`) continuent de fonctionner sans qu'aucun schéma applicatif ne soit implicitement recherché. C'est la configuration recommandée par le linter de sécurité officiel de Supabase pour l'alerte *"Function Search Path Mutable"*, et elle est strictement plus restrictive que `public, pg_temp` proposée initialement dans le backlog de l'audit — ce dernier choix aurait laissé `public` implicitement recherché, ce qui n'apporte aucune protection contre un schéma malveillant créé par un rôle disposant du droit `CREATE` sur `public` lui-même (moins probable, mais `search_path = ''` avec qualification complète élimine cette classe de risque également).

- **`handle_new_user()`** : seul objet référencé = `profiles` (table) → qualifié en `public.profiles`. Aucun autre objet à risque.
- **`expire_old_reports()`** : seul objet référencé = `reports` (table) → qualifié en `public.reports`.
- **`current_user_role()`** : `profiles` → `public.profiles` ; le type `user_role` utilisé pour la variable `v_role` et le cast `'USER'::user_role` → qualifié en `public.user_role` ; `auth.uid()` était déjà qualifié, revalidé sans changement.
- **`prevent_profile_role_escalation()`** : appel à `current_user_role()` → qualifié en `public.current_user_role()`.

Aucun `REVOKE`/`GRANT` n'a été modifié : les 4 fonctions doivent rester exécutables par le rôle `authenticated` (elles sont invoquées à l'intérieur de policies RLS évaluées pour ce rôle) et par le système (déclencheurs). Une revue plus stricte des privilèges `EXECUTE` (révoquer `PUBLIC` puis regranter explicitement) est documentée comme piste P3 dans le backlog, car elle sort du périmètre strictement autorisé de ce lot (search_path uniquement) et présenterait un risque de régression fonctionnelle nécessitant ses propres tests dédiés.

## 7. Résultat d'application des migrations

Base locale : PostgreSQL 16.10 + PostGIS 3.5.0, provisionnée en espace utilisateur via `micromamba`/conda-forge (aucun accès root, aucun Docker disponible dans cet environnement d'audit — voir limite méthodologique ci-dessous). Base créée vide (`createdb biketrip_test` après `dropdb --if-exists`).

Séquence appliquée dans l'ordre, chacune avec `psql -v ON_ERROR_STOP=1` :
1. Stub `auth` (schéma, table `auth.users`, fonctions `auth.uid()`/`auth.role()`, rôles `anon`/`authenticated`/`service_role`) — **hors dépôt**, voir limite méthodologique.
2. `001_enums.sql` → OK (14 `CREATE TYPE`)
3. `002_tables.sql` → OK (18 `CREATE TABLE`, extensions `uuid-ossp` et `postgis` créées avec succès)
4. `003_indexes.sql` → OK (50 `CREATE INDEX`, y compris les index GiST géographiques)
5. `004_functions.sql` → OK (6 `CREATE FUNCTION`, 8 `CREATE TRIGGER`)
6. `005_rls.sql` → OK (17 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, 2 `CREATE FUNCTION`, 1 `CREATE TRIGGER`, 40 `CREATE POLICY`)
7. Stub `storage` (schéma, tables `storage.buckets`/`storage.objects`, fonction `storage.foldername()`) — **hors dépôt**, voir limite méthodologique.
8. `006_storage.sql` → OK (4 buckets, policies de stockage)
9. **`007_security_definer_search_path_hardening.sql` → OK** (4 `CREATE OR REPLACE FUNCTION`)

**Résultat : les 7 migrations du dépôt (001 à 007) s'appliquent intégralement et sans erreur sur une base vide, dans l'ordre.**

**Limite méthodologique explicite** : les schémas `auth` et `storage` ne sont pas fournis par une instance Supabase réelle ici (Docker/Supabase CLI indisponibles dans ce sandbox). Ils ont été reconstitués à l'identique de leur comportement public documenté par Supabase (`auth.uid()` lit le claim JWT `sub` via `current_setting('request.jwt.claim.sub', true)`, exactement comme la fonction officielle). Cette reconstitution n'est **pas** un composant du projet BikeTrip et n'a pas été commitée. Elle permet de valider la logique SQL du projet et l'interaction RLS/`SECURITY DEFINER`, mais ne remplace pas un test contre une instance Supabase locale réelle (`supabase start`) ou un projet Supabase de développement, qu'il est recommandé d'exécuter dès que Docker Desktop est disponible, avant toute mise en production.

## 8. Résultat de l'inspection pg_proc

Requête exécutée telle que fournie par le PM :

```
 schema_name |             proname             | identity_arguments | prosecdef |      proconfig
-------------+----------------------------------+--------------------+-----------+----------------------
 public      | current_user_role               |                    | t         | {"search_path=\"\""}
 public      | expire_old_reports               |                    | t         | {"search_path=\"\""}
 public      | handle_new_user                  |                    | t         | {"search_path=\"\""}
 public      | prevent_profile_role_escalation  |                    | t         | {"search_path=\"\""}
(4 rows)
```

Les 4 fonctions confirment `prosecdef = t` (SECURITY DEFINER conservé) et `proconfig` contenant `search_path=""` (search_path verrouillé et vide, conformément au choix justifié en §6).

Validation complémentaire (hors exigence stricte du PM, ajoutée par rigueur) : appel direct de `SELECT expire_old_reports();` et `SELECT current_user_role();` en dehors du contexte des tests RLS — les deux s'exécutent sans erreur ; `current_user_role()` retourne correctement le fallback `USER` en l'absence de profil correspondant à l'acteur courant.

## 9. Résultat des tests RLS

Exécution intégrale et non modifiée de `supabase/tests/rls_security.sql` contre la base locale après application de la migration 007 :

```
NOTICE:  PASS: user A lit son profil prive
NOTICE:  PASS: user A lit le profil public de user B
NOTICE:  PASS: user A ne peut pas auto-elever profiles.role
NOTICE:  PASS: user A ne peut pas inserer audit_logs
NOTICE:  PASS: user A lit uniquement ses rides
NOTICE:  PASS: user A lit uniquement ses ride_points
NOTICE:  PASS: user A lit uniquement ses favorites
NOTICE:  PASS: user B ne lit pas les favorites de user A
NOTICE:  PASS: user B ne lit pas les collections de user A
NOTICE:  PASS: user B lit les reports publics ACTIVE/CONFIRMED
NOTICE:  PASS: user B ne modifie pas le report de user A
NOTICE:  PASS: user A ne lit pas un report RESOLVED appartenant a user B
NOTICE:  PASS: auteur modifie son report
NOTICE:  PASS: moderator modifie un report
NOTICE:  PASS: moderator ne modifie pas profiles.role
NOTICE:  PASS: admin modifie profiles.role
NOTICE:  PASS: admin insere audit_logs
ROLLBACK
```

**17/17 assertions `PASS`, 0 `FAIL`.** Le script se termine par `ROLLBACK` comme conçu : aucune donnée de test n'est restée en base. Le trigger `on_auth_user_created` (`handle_new_user`, durci) s'est déclenché avec succès lors des `INSERT INTO auth.users` du script de test, confirmant que le trigger reste fonctionnel après durcissement.

## 10. Résultat lint

```
npx eslint . --ext .ts,.tsx
```
0 erreur, 0 avertissement, 64 fichiers. Inchangé par rapport à l'audit (ce lot ne modifie aucun fichier TypeScript).

## 11. Résultat typecheck

```
npx tsc --noEmit
```
0 erreur. Inchangé.

## 12. Résultat Jest

```
npx jest --ci
```
```
PASS src/lib/constants/labels.test.ts
Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
```
Inchangé.

## 13. Diff final

```
git diff --check
```
→ avertissements de fin de ligne (CRLF) sur `supabase/seed.sql` uniquement — **anomalie préexistante**, documentée dans l'audit initial (§3), non introduite ni modifiée par ce lot.

```
git diff --stat
```
```
supabase/seed.sql | 760 +++++++++++++++++++++++++++---------------------------
1 file changed, 380 insertions(+), 380 deletions(-)
```
Seul fichier suivi modifié : `supabase/seed.sql`, à l'identique de l'état constaté avant ce lot (changement de fin de ligne uniquement, non touché par ce lot). **Aucune des migrations 001 à 006 n'a été modifiée.**

## 14. Fichiers modifiés

Créés par ce lot :
- `supabase/migrations/007_security_definer_search_path_hardening.sql` (nouveau, additif)
- `docs/audits/biketrip-lot-P0-SEC-001-report.md` (ce rapport)

Mis à jour par ce lot :
- `docs/audits/biketrip-command-results.md` (ajout de la section 10, résultats de ce lot uniquement — sections 1 à 9 préexistantes non modifiées)

Non touchés par ce lot (vérifié) : `supabase/migrations/001_enums.sql` à `006_storage.sql`, `supabase/seed.sql`, `app/**`, `src/**`, `package.json`, `app.json`, toute dépendance npm.

## 15. Commit local

Un commit local (sans push) a été effectué, limité strictement à :
- `supabase/migrations/007_security_definer_search_path_hardening.sql`
- `docs/audits/biketrip-lot-P0-SEC-001-report.md`
- `docs/audits/biketrip-command-results.md`

Message (Conventional Commits) :
```
fix(security): harden security definer search paths
```

`supabase/seed.sql` (diff de fin de ligne préexistant) et les documents `docs/Prompt_Maitre.md`/`docs/Specification_Fonctionnelle.md` (non suivis, hors périmètre) n'ont **pas** été inclus dans ce commit, conformément à la consigne explicite du PM. Aucun push effectué.

## 16. État Git final

```
 M supabase/seed.sql                         (préexistant, inchangé par ce lot, toujours non commité)
?? docs/Prompt_Maitre.md                      (préexistant, toujours non suivi)
?? docs/Specification_Fonctionnelle.md        (préexistant, toujours non suivi)
```
`supabase/migrations/007_...sql`, `docs/audits/biketrip-lot-P0-SEC-001-report.md` et la mise à jour de `docs/audits/biketrip-command-results.md` sont désormais commités localement (nouveau commit au-dessus de `dbf46f7`, non poussé).

## 17. Écarts avec la directive

- Le script `test:rls` optionnel autorisé par le PM (`package.json`) n'a **pas** été ajouté : la commande réelle documentée dans `qa.md` dépend du nom du conteneur Docker local de l'utilisateur (`supabase_db_BikeTrip`) et de PowerShell, propres à son poste ; livrer un script npm générique aurait risqué d'être incorrect sur sa machine réelle plutôt qu'utile. Décision documentée ici plutôt qu'exécutée sans certitude.
- L'exécution des migrations et des tests RLS n'a pas eu lieu contre une instance Supabase locale réelle (`supabase start`, Docker) mais contre un PostgreSQL+PostGIS local reconstituant fidèlement les schémas `auth`/`storage` de Supabase — limite d'environnement, documentée en détail en §7. Recommandation : rejouer ce même lot (migrations 001-007 + tests RLS) contre une vraie instance Supabase locale dès que Docker Desktop est disponible, avant toute mise en production, pour lever ce dernier doute.

## 18. Risques résiduels

- Les privilèges `EXECUTE` des 4 fonctions restent à `PUBLIC` par défaut (non modifiés dans ce lot, décision justifiée en §6) — amélioration possible en P3.
- La validation RLS ci-dessus repose sur une reconstitution locale du schéma `auth`/`storage`, pas sur l'instance Supabase réelle du projet — à revalider une fois Docker disponible.
- Les autres constats de l'audit initial (statistiques de sortie non calculées, absence de rate limiting, résolution automatique de signalement par vote, etc.) restent entièrement d'actualité — ce lot ne les traite pas, conformément à son périmètre strictement limité au search_path.

## 19. Verdict proposé

**PASS**

## 20. Arrêt confirmé

Arrêt effectué après l'exécution des tests, le commit local, et la production de ce rapport. Aucun travail sur le calcul GPS, la CI, les routes, les notifications, `app_settings`, le rate limiting, la détection de doublons, la météo, l'admin ou le monorepo n'a été entamé, conformément à la consigne d'arrêt obligatoire.
