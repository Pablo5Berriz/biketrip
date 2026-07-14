# Résultats des commandes — Audit BikeTrip (2026-07-14)

Environnement d'exécution : sandbox Linux isolée, sans Docker ni Supabase local disponible. Aucune commande destructive, aucune migration distante, aucun push n'a été exécuté. `node_modules` déjà présent dans le dépôt (835 paquets) — non réinstallé pour ne rien modifier.

---

## 1. `npx eslint . --ext .ts,.tsx` (équivalent `npm run lint`)

**Commande exacte** : `npx eslint . --ext .ts,.tsx --format json` (exécutée deux fois : une sortie texte, une sortie JSON pour comptage exact)

**Statut** : ✅ Exécutée avec succès

**Sortie résumée** :
```
files linted: 64
files with issues: 0
total errors: 0
total warnings: 0
```

**Erreurs** : aucune.

**Cause** : n/a.

**Action recommandée** : aucune — ce résultat doit être préservé via la CI (voir backlog P0-4).

---

## 2. `npx tsc --noEmit` (équivalent `npm run type-check`)

**Commande exacte** : `npx tsc --noEmit`

**Statut** : ✅ Exécutée avec succès

**Sortie résumée** : aucune sortie, code de sortie 0 → 0 erreur de type sur l'ensemble du projet.

**Erreurs** : aucune.

**Nuance importante** : ce résultat propre **ne valide pas** la correction des routes de navigation (`router.push('/(tabs)/home')` etc., voir §5 du rapport principal). Le typage strict des routes Expo Router (`experiments.typedRoutes: true`) n'a, dans cette configuration, pas fait échouer la compilation sur ces chaînes de route invalides — la preuve de leur invalidité vient du fichier généré `.expo/types/router.d.ts` (liste exhaustive des routes valides), pas de `tsc`. Ne pas interpréter un `tsc` vert comme une garantie de navigation fonctionnelle dans cette configuration.

**Action recommandée** : corriger les routes manuellement (backlog P1-1) ; envisager à terme un lint dédié (`eslint-plugin-expo-router` ou équivalent) qui détecterait ce type de chaîne invalide si un tel outil existe pour la version d'Expo Router utilisée.

---

## 3. `npx jest --ci` (équivalent `npm test`)

**Commande exacte** : `npx jest --ci`

**Statut** : ✅ Exécutée avec succès

**Sortie complète** :
```
PASS src/lib/constants/labels.test.ts
  labels
    ✓ exposes readable surface labels (4 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        14.265 s
Ran all test suites.
```

**Erreurs** : aucune.

**Cause** : n/a — mais la couverture est quasi nulle : 1 seul fichier de test existe dans tout le dépôt (`src/lib/constants/labels.test.ts`), sur un total de 64 fichiers source. Aucun test pour `adviceEngine.ts` (479 lignes de logique métier), aucun test pour les 10 services (`src/features/*`), aucun test pour les stores Zustand.

**Action recommandée** : voir backlog P1-5 (tests `adviceEngine` en priorité).

---

## 4. `npm run test:rls`

**Commande exacte tentée** : `npm run test:rls`

**Statut** : ⚠️ Script inexistant

**Sortie** : `package.json` ne définit que les scripts `start`, `android`, `ios`, `web`, `lint`, `type-check`, `test` — aucun script `test:rls`.

**Cause probable** : ce script n'a jamais été ajouté à `package.json` ; l'exécution des tests RLS est documentée manuellement dans `docs/qa.md` via une commande PowerShell directe (`Get-Content supabase\tests\rls_security.sql -Raw | docker exec -i supabase_db_BikeTrip psql ...`), pas via npm.

**Ce problème bloque-t-il la suite ?** Non pour l'audit statique (le fichier SQL a été lu intégralement et analysé, voir rapport principal §7), mais **oui pour toute validation dynamique de la sécurité RLS** — cette suite n'a, à la connaissance de cet audit, jamais été exécutée avec succès contre une base réelle. Docker Desktop et Supabase CLI local ne sont pas disponibles dans cet environnement d'audit sandbox, donc la commande n'a **pas pu être tentée** ici, conformément à l'interdiction d'exécuter des opérations pouvant générer des coûts ou nécessiter une infrastructure non disponible.

**Action recommandée** : ajouter un script `"test:rls"` à `package.json` qui encapsule la commande Docker/psql documentée dans `qa.md`, et l'exécuter avant toute mise en production (backlog, dépendance de P0-1).

---

## 5. `npm run build`

**Commande exacte tentée** : `npm run build`

**Statut** : ⚠️ Script inexistant

**Sortie** : aucun script `build` dans `package.json`.

**Cause** : projet Expo géré (managed workflow) — la production d'un binaire se fait normalement via `eas build`, pas via un script `build` local. Or `eas.json` est absent du dépôt et `app.json` contient un `projectId` placeholder (`"your-eas-project-id"`), donc **EAS n'est pas configuré** — la commande `eas build` échouerait également si tentée.

**Ce problème bloque-t-il la suite ?** Oui, pour toute distribution (TestFlight, Play Console interne ou production) — aucun binaire ne peut être produit dans l'état actuel.

**Action recommandée** : configurer `eas.json` et lier un vrai projet EAS avant toute tentative de distribution (backlog P3, conditionné à une décision produit sur le calendrier de publication, voir §16-6 du rapport principal).

---

## 6. `pnpm install --frozen-lockfile`

**Commande exacte tentée** : n/a — non exécutée intentionnellement.

**Statut** : ⚠️ Non applicable / non exécutée

**Cause** : le projet utilise `npm` (`package-lock.json` présent, pas de `pnpm-lock.yaml` ni `pnpm-workspace.yaml`), pas `pnpm`. `node_modules` est déjà présent dans le dépôt avec 835 paquets installés — une réinstallation n'a pas été effectuée pour respecter la consigne de ne modifier aucun fichier pendant la phase d'audit. L'équivalent `npm ci` n'a pas non plus été exécuté pour la même raison (aurait pu modifier `node_modules`/`package-lock.json` en cas de dérive).

**Action recommandée** : lors de la reprise, exécuter `npm ci` en environnement de développement propre pour confirmer la reproductibilité de l'installation (non fait ici par prudence).

---

## 7. `npm audit --omit=dev`

**Commande exacte** : `npm audit --omit=dev` puis `npm audit --omit=dev --json` pour comptage exact par sévérité.

**Statut** : ✅ Exécutée avec succès

**Sortie résumée** :
```
27 vulnerabilities (1 low, 6 moderate, 19 high, 1 critical)
```

Détail du paquet en sévérité critique : `shell-quote` (dépendance transitive de l'outillage de build, pas du bundle applicatif runtime). Sévérité élevée notable : `ws` (WebSocket) — plusieurs CVE de déni de service par épuisement mémoire, présent dans les chaînes de dépendances de `@react-native/community-cli-plugin`, `@react-native/dev-middleware`, `metro`, `react-devtools-core`, `react-native` — **outillage de développement**, pas de code exécuté en production dans l'app compilée, mais à corriger pour l'hygiène de la chaîne d'approvisionnement logicielle.

**Erreurs** : aucune (la commande s'exécute normalement, elle rapporte des vulnérabilités, ce n'est pas un échec de commande).

**Action recommandée** : `npm audit fix` pour les correctifs non cassants ; évaluer `npm audit fix --force` avec prudence pour le reste (peut introduire des changements de version majeurs sur des dépendances Expo/React Native, à tester soigneusement). Voir backlog P3-4.

---

## 8. Commandes de sécurité de `docs/qa.md` (grep manuel, adapté en environnement Linux)

**Commandes exactes exécutées** (adaptation Linux de la version PowerShell documentée dans `qa.md`) :
```bash
grep -rn "ENABLE ROW LEVEL SECURITY|CREATE POLICY|auth.uid|WITH CHECK|USING|role|admin|moderator|audit_logs" supabase/migrations
grep -rn "service_role|SUPABASE_SERVICE|secret|password|anon|createClient" .env.example src app supabase
```

**Statut** : ✅ Exécutées avec succès

**Résultat** : confirmation que RLS est activée sur toutes les tables listées dans `security.md`, aucune occurrence de `service_role` ni de clé/secret en clair dans `src/`, `app/`, `.env.example` (uniquement le commentaire d'avertissement attendu). Voir rapport principal §3 et §8 pour l'analyse complète.

---

## 9. Recherches ciblées complémentaires (non listées dans le prompt mais nécessaires pour étayer les preuves)

Toutes exécutées via `grep -rn`/`grep -rln` en lecture seule, aucune n'a modifié de fichier :

| Recherche | Résultat | Interprétation |
|---|---|---|
| `TaskManager\|startLocationUpdatesAsync\|BACKGROUND_TRACKING\|expo-task-manager` dans `src app package.json` | 0 résultat | Confirme `FOREGROUND_TRACKING` exclusif, aucun mélange avec le suivi arrière-plan |
| `SQLite\|SyncQueue\|expo-sqlite\|OfflineQueue` dans `src app package.json` | 0 résultat | Confirme l'absence totale du mode hors ligne |
| `exif\|EXIF` dans `src app` | 0 résultat | Confirme l'absence de traitement EXIF explicite |
| `coords.speed` dans `src app` | 0 résultat | Confirme que la vitesse GPS n'est jamais lue |
| `app_settings` dans `src app supabase` | 0 résultat | Confirme l'absence totale de la table et de son usage |
| `RATE_LIMITED` dans `src app supabase` | 0 résultat | Confirme l'absence de rate limiting |
| `duplicate` (insensible à la casse) dans `src app supabase` | 0 résultat | Confirme l'absence de détection de doublons |
| `anonymiz` (insensible à la casse) dans `src app supabase` | 0 résultat | Confirme l'absence de logique d'anonymisation |
| `setDistanceKm` dans `app src` | 2 résultats, tous deux dans la définition du store (jamais un appel) | Confirme le bug P0-2 |
| `computeTrackDistance`/`computeElevation`/`computeAverageSpeed` dans `app src` | 1 résultat chacun, tous dans leur propre définition | Confirme le code mort / le bug P0-2 |
| `: any\b` dans `src app` | 0 résultat | Confirme l'absence totale de `any` |
| `TODO\|FIXME\|XXX\|HACK` dans `src app supabase` | 0 résultat | Aucun marqueur explicite de travail inachevé laissé dans le code |
| `SECURITY DEFINER` dans `supabase/migrations/*.sql` | 4 résultats (`004_functions.sql` ×2, `005_rls.sql` ×2) | Base du finding P0-1 |
| `search_path` dans `supabase/migrations/*.sql` | 0 résultat | Confirme qu'aucune des 4 fonctions ne verrouille `search_path` |
| `git diff --ignore-all-space --stat supabase/seed.sql` | Aucune sortie | Confirme que la seule modification non commitée est un changement de fin de ligne (CRLF/LF), sans impact fonctionnel |
| `git ls-files \| grep '^\.env$'` | 0 résultat | Confirme qu'aucun `.env` n'est suivi par Git |

---

## 10. Lot BIKETRIP-P0-SEC-001 — Durcissement `search_path` (2026-07-14, suite à l'audit)

Contexte : ce lot fait suite à la revue PM de l'audit ci-dessus, qui a demandé de traiter en priorité P0 le durcissement des 4 fonctions `SECURITY DEFINER` avant toute réparation fonctionnelle. Contrairement à la phase d'audit initiale, ce lot **a pu exécuter réellement** les migrations et les tests RLS contre une base PostgreSQL 16 + PostGIS 3.5 locale, provisionnée en espace utilisateur (sans root, sans Docker) via `micromamba`/conda-forge, `initdb` et `pg_ctl`, faute d'accès à Docker Desktop/Supabase CLI dans cet environnement sandbox.

**Limite méthodologique explicite** : cette base locale n'est pas une instance Supabase réelle. Les schémas `auth` (table `auth.users`, fonctions `auth.uid()`/`auth.role()`) et `storage` (`storage.buckets`, `storage.objects`, `storage.foldername()`) que Supabase fournit nativement ont dû être reconstitués manuellement à l'identique de leur comportement documenté publiquement, uniquement pour permettre le rejeu des migrations du projet. Ces fichiers de reconstitution (`/tmp/auth_stub.sql`, `/tmp/storage_stub.sql`) sont des artefacts de test **hors du dépôt BikeTrip**, non commités, non livrés.

| Commande / étape | Statut | Résultat |
|---|---|---|
| Provisionnement PostgreSQL 16.10 + PostGIS 3.5.0 local (`micromamba create -n pgtest -c conda-forge postgresql=16 postgis`) | ✅ Exécutée | Installation réussie en espace utilisateur, aucun accès root requis |
| `initdb` + `pg_ctl start` sur `/tmp/pgdata` | ✅ Exécutée | Cluster local opérationnel sur socket Unix `/tmp/.s.PGSQL.5544` |
| Rejeu de `supabase/migrations/001_enums.sql` → `006_storage.sql` (non modifiées) sur base vide | ✅ Exécutée | Toutes appliquées sans erreur après ajout des stubs `auth`/`storage` |
| Application de `supabase/migrations/007_security_definer_search_path_hardening.sql` (nouvelle) | ✅ Exécutée | Appliquée sans erreur à la suite des 6 précédentes |
| Requête d'inspection `pg_proc` (fournie par le PM) | ✅ Exécutée | Les 4 fonctions affichent `prosecdef = t` et `proconfig = {"search_path=\"\""}`  |
| `supabase/tests/rls_security.sql` (intégral, non modifié) | ✅ Exécutée | **17/17 assertions `PASS`, 0 `FAIL`**, transaction terminée par `ROLLBACK` (aucune donnée de test conservée) |
| Validation directe `SELECT expire_old_reports();` et `SELECT current_user_role();` hors contexte RLS | ✅ Exécutée | Les deux fonctions s'exécutent sans erreur ; `current_user_role()` retourne correctement le fallback `USER` en l'absence de profil correspondant |
| `npx eslint . --ext .ts,.tsx` | ✅ Exécutée | 0 erreur, 0 avertissement (inchangé — aucun fichier TS/TSX modifié par ce lot) |
| `npx tsc --noEmit` | ✅ Exécutée | 0 erreur (inchangé) |
| `npx jest --ci` | ✅ Exécutée | 1 suite, 1 test, 100 % pass (inchangé) |
| `git diff --check` | ✅ Exécutée | 2 avertissements de fin de ligne (CRLF) sur `supabase/seed.sql` uniquement — anomalie **préexistante à ce lot**, documentée dans l'audit initial (§3), non introduite ni aggravée ici |
| `git diff --stat` (fichiers suivis) | ✅ Exécutée | Seul `supabase/seed.sql` apparaît modifié (380/380, inchangé depuis l'audit) — aucune migration historique (001 à 006) altérée |

**Erreurs rencontrées et corrigées pendant l'exécution (documentées pour transparence)** :
- Premier essai de script avec `set -e` : arrêt silencieux sans affichage du journal — corrigé en retirant `set -e` et en inspectant le fichier journal directement.
- `CREATE ROLE anon/authenticated/service_role` échouait au 2e essai (les rôles Postgres sont globaux au cluster, pas à la base de données, donc persistent après un `dropdb`/`createdb`) — corrigé en rendant la création idempotente via `DO $$ ... IF NOT EXISTS ... $$`.
- `006_storage.sql` échouait initialement car `storage.buckets` n'existait pas — corrigé en ajoutant le stub `storage` avant application de cette migration.

Aucune de ces corrections n'a touché un fichier du dépôt BikeTrip ; elles concernent uniquement l'infrastructure de test locale temporaire.

---

## 11. Lot BIKETRIP-P0-RIDE-001 — Statistiques réelles de suivi de sortie (2026-07-14)

**Correctif de scope préalable** : en préparant ce lot, une divergence a été détectée entre le fichier réel (`docs/audits/biketrip-command-results.md`, source de vérité de l'outil d'édition) et l'état observé par le terminal bash de vérification lors du lot précédent — la section 10 ci-dessus, bien que réellement écrite dans le fichier, n'était pas visible depuis le terminal au moment du commit `65c2aeb`. Ce nouveau commit republie le fichier complet (sections 1 à 10 incluses) : aucune perte de contenu, aucune réécriture d'historique Git (pas d'amend/rebase), simple republication normale dans un nouveau commit.

| Commande / étape | Statut | Résultat |
|---|---|---|
| `git status --short` / `git rev-parse HEAD` / `git show --stat --oneline HEAD` | ✅ Exécutée | HEAD confirmé à `65c2aeb` avant modification |
| Cartographie du flux GPS existant (`useLocation.ts`, `rideStore.ts`, `active.tsx`, `rideService.ts`) | ✅ Exécutée | Voir §6 du rapport de lot dédié |
| Création `RideTrackPoint`/`RideAccumulator`/`ingestTrackPoint`/seuils nommés dans `geoUtils.ts` | ✅ Exécutée | Fonction pure, sans dépendance React/réseau/GPS réel |
| Câblage `useLocation.ts` (capture altitude/vitesse/précision) + `rideStore.ts` (accumulateur incrémental) + `active.tsx` (tracking:true, minuteur corrigé, finishRide enrichi) | ✅ Exécutée | Voir diff scoping ci-dessous |
| `getRideStats()` calcule désormais `averageSpeedKmh`/`maxSpeedKmh` | ✅ Exécutée | `src/features/rides/rideService.ts` |
| `npx jest src/lib/geo/geoUtils.test.ts --ci` (23 tests, 15 cas obligatoires + compléments) | ✅ Exécutée | **23/23 PASS**, 0 FAIL |
| Scénario manuel simulé (séquence de points fixe, avec pause) via `useRideStore` réel | ✅ Exécutée | distance 0→0.633 km, pause vérifiée sans accumulation, dénivelé +11 m/-6 m, bruit <3 m ignoré — script temporaire supprimé après exécution, non livré |
| `npx eslint . --ext .ts,.tsx --format json` | ✅ Exécutée | 65 fichiers, 0 erreur, 0 avertissement |
| `npx tsc --noEmit` | ✅ Exécutée | 0 erreur |
| `npx jest --ci` (suite complète) | ✅ Exécutée | 2 suites, 23 tests, 100 % pass |
| `git diff --check` | ✅ Exécutée | Avertissements de fin de ligne sur `supabase/seed.sql` uniquement — anomalie préexistante, non introduite par ce lot |
| `git diff --stat` (périmètre autorisé) | ✅ Exécutée | 6 fichiers applicatifs + `command-results.md`, aucune migration, aucun fichier hors périmètre |

**Anomalie d'environnement rencontrée et documentée pour transparence** : à plusieurs reprises pendant ce lot, le terminal bash de vérification a lu une version tronquée d'un fichier pourtant correctement et intégralement écrit par l'outil d'édition (confirmé par relecture directe du fichier réel). Chaque occurrence a été détectée par comparaison systématique de la taille/contenu observés côté terminal avec le contenu réellement écrit, puis corrigée par réécriture explicite côté terminal avant de considérer un résultat de test comme valide. Aucun résultat « PASS » n'a été retenu dans ce rapport tant que la correspondance entre le fichier exécuté et le code réellement livré n'était pas vérifiée.
