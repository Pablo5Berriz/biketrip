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
