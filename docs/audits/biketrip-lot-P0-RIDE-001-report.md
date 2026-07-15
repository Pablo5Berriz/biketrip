# RAPPORT D'EXÉCUTION — BIKETRIP-P0-RIDE-001

## 1. Statut

**PASS SOUS RÉSERVE APPAREIL**

Tous les critères techniques (calculs, filtrage, tests unitaires, simulation, lint, typecheck, Jest, diff scoping, commit local) sont satisfaits avec preuve d'exécution réelle. Conformément à la directive ("La Phase 2E ne sera pas déclarée PASS sans trajet réel sur appareil physique"), le statut ne peut pas être un `PASS` plein : aucun appareil physique n'était disponible dans cet environnement sandbox. `VALIDATION APPAREIL EN ATTENTE`.

## 2. SHA initial

`65c2aebb683e73ffed96842f10aec9da4369e25b` — confirmé comme SHA de référence du lot sécurité accepté sous réserves.

## 3. État Git initial

```
 M supabase/seed.sql                         (préexistant, fin de ligne CRLF/LF, sans changement de contenu)
?? docs/Prompt_Maitre.md                      (préexistant)
?? docs/Specification_Fonctionnelle.md        (préexistant)
?? docs/audits/biketrip-full-project-audit.md (préexistant)
?? docs/audits/biketrip-module-status.csv     (préexistant)
?? docs/audits/biketrip-recovery-backlog.md   (préexistant)
```
Identique à l'état constaté à la clôture du lot BIKETRIP-P0-SEC-001.

## 4. Flux avant correction

Cartographie établie par lecture complète de `src/hooks/useLocation.ts`, `src/stores/rideStore.ts`, `app/ride/active.tsx`, `src/features/rides/rideService.ts`, `app/ride/summary.tsx`, `app/tabs/rides.tsx` avant toute modification :

1. **Démarrage** : `active.tsx` appelle `startRide()` à l'arrivée sur l'écran (si aucune `activeRide` en cours), puis `startTimer()` qui lance un `setInterval` de 1s incrémentant `elapsedSeconds`.
2. **Réception des positions** : `active.tsx` appelait `useLocation()` **sans argument**, donc avec les valeurs par défaut du hook (`tracking: false`). Le hook ne faisait alors qu'un seul appel `getCurrentPositionAsync()` au montage — **aucun abonnement `watchPositionAsync` n'était jamais établi pour l'écran de sortie active**. Un `useEffect` sur `location` ne se déclenchait donc qu'une seule fois.
3. **Ajout au store** : ce point unique était poussé dans `ridePoints` (type `GeoCoordinates`, lat/lon uniquement) via `addRidePoint()`, avec `setCurrentSpeed(0)` codé en dur et `altitude_m`/`speed_kmh` envoyés à `null` vers `saveRidePoint()`.
4. **Pause/reprise** : `pauseRide()`/`resumeRide()` mettaient à jour le statut serveur et appelaient `stopTimer()`/`startTimer()`. Défaut découvert : `startTimer()` capturait `elapsedSeconds` par fermeture au moment de sa création (`useCallback` dépendant de `elapsedSeconds`) et réutilisait cette valeur figée à chaque tick du `setInterval` — le compteur ne progressait donc pas correctement au-delà de la valeur capturée au démarrage/à la reprise.
5. **Fin de sortie** : `finishRide()` n'envoyait que `distance_km` (toujours 0, `computeTrackDistance()`/`setDistanceKm()` n'étaient jamais appelées) et `duration_seconds`. Aucune vitesse, aucun dénivelé transmis.
6. **Résumé** (`summary.tsx`) : lit directement `ride.average_speed_kmh`, `ride.max_speed_kmh`, `ride.elevation_gain_m` depuis la ligne Supabase — code déjà correct, mais alimenté par des valeurs jamais calculées en amont.
7. **Historique/Statistiques** (`rides.tsx`) : `getRideStats()` ne retournait que `totalRides`/`totalDistanceKm`/`totalDurationSeconds`/`totalElevationGainM` ; `StatsTab` consommait déjà `stats.maxSpeedKmh`/`stats.averageSpeedKmh` avec un repli silencieux `?? 0`, masquant l'absence réelle de ces champs.

**Unités identifiées** : `distanceKm` en kilomètres (store), `elapsedSeconds` en secondes actives (le timer ne compte que hors pause grâce à l'arrêt/redémarrage explicite de l'intervalle), `coords.speed` d'Expo Location en mètres/seconde, `coords.altitude` en mètres, colonnes Supabase `average_speed_kmh`/`max_speed_kmh`/`elevation_gain_m`/`elevation_loss_m` déjà en unités finales (km/h, m). Aucune conversion implicite non documentée n'a été laissée dans le code livré.

## 5. Défauts confirmés

En plus des défauts listés dans l'audit (`computeTrackDistance`/`computeElevation`/`computeAverageSpeed` jamais appelées, `setDistanceKm` jamais appelée, `setCurrentSpeed(0)` codé en dur, `coords.speed` jamais lu, altitude toujours `null`, `finishRide()` incomplet, `getRideStats()` incomplet), la cartographie a révélé **deux défauts supplémentaires non explicitement nommés dans l'audit initial mais bloquants pour ce lot** :

- **`useLocation()` appelé sans `tracking: true` dans `active.tsx`** : cause racine la plus en amont de `distanceKm` figé à 0 — sans suivi continu, il n'y a tout simplement jamais plus d'un point GPS capturé pendant une sortie.
- **Bug de fermeture (closure) sur le minuteur `elapsedSeconds`** : `setElapsedSeconds(elapsedSeconds + 1)` à l'intérieur du `setInterval` réutilisait une valeur capturée figée plutôt que l'état courant, empêchant une progression correcte de la durée active — donnée directement consommée par le calcul de vitesse moyenne.

Ces deux défauts ont été corrigés dans le périmètre autorisé (`app/ride/active.tsx`, `src/hooks/useLocation.ts`) car ils bloquaient directement les critères d'acceptation de ce lot.

## 6. Architecture de calcul retenue

Un moteur de calcul **pur et testable**, isolé de React/Zustand/réseau, a été ajouté à `src/lib/geo/geoUtils.ts` :

- `RideTrackPoint` : point GPS enrichi (`latitude`, `longitude`, `timestamp` ms, `altitudeM | null`, `speedKmh | null`, `accuracyM?`).
- `RideAccumulator` : état incrémental (`distanceKm`, `maxSpeedKmh`, `elevationGainM`, `elevationLossM`, `lastValidPoint`).
- `ingestTrackPoint(acc, raw) → { accumulator, accepted, currentSpeedKmh }` : fonction pure qui valide, filtre et intègre un point, sans jamais recalculer l'intégralité du tracé.

Le store `rideStore.ts` conserve un `RideAccumulator` interne et expose une action unique `ingestPoint(point): boolean` qui délègue tout le calcul à `ingestTrackPoint`, évitant toute duplication de logique métier entre le store et l'écran. `active.tsx` ne fait qu'appeler `ingestPoint()` sur chaque nouveau `trackPoint` reçu du hook et réagir au booléen `accepted` (sauvegarde DB + recentrage carte uniquement si accepté).

## 7. Unités et seuils

Toutes les constantes de filtrage sont nommées et exportées depuis `geoUtils.ts`, avec justification en commentaire :

| Constante | Valeur | Justification |
|---|---|---|
| `GPS_MIN_ACCURACY_M` | 30 m | Précision horizontale minimale acceptée ; au-delà, un point est jugé trop peu fiable pour contribuer aux agrégats. |
| `GPS_MAX_PLAUSIBLE_SPEED_KMH` | 80 km/h | Vitesse maximale physiquement plausible à vélo ; un déplacement impliquant une vitesse supérieure entre deux points consécutifs est un artefact de saut de position, pas un record. |
| `ELEVATION_NOISE_THRESHOLD_M` | 3 m | Seuil de bruit altimétrique ; une variation d'altitude inférieure entre deux points consécutifs est ignorée pour ne pas cumuler du dénivelé fictif. |

Conversion `coords.speed` (m/s, natif Expo Location) → km/h via `mpsToKmh(v) = v * 3.6`, appliquée uniquement dans `useLocation.ts` (au plus près de l'API native) ; toute vitesse négative ou non finie est ramenée à `null` (jamais inventée).

## 8. Fichiers modifiés

- `src/lib/geo/geoUtils.ts` — ajout (aucune fonction existante supprimée) : `RideTrackPoint`, `RideAccumulator`, 3 constantes de seuil, `createRideAccumulator()`, `mpsToKmh()`, `ingestTrackPoint()`.
- `src/hooks/useLocation.ts` — capture `altitude`/`speed`/`accuracy`/`timestamp` bruts, expose un nouveau champ `trackPoint` (en plus de `location`, inchangé pour les 4 autres écrans consommateurs).
- `src/stores/rideStore.ts` — accumulateur incrémental, action `ingestPoint()`, renommage `currentSpeed` → `currentSpeedKmh` (vérifié : utilisé uniquement par `rideStore.ts`/`active.tsx`, aucun autre consommateur), `setElapsedSeconds` accepte un updater fonctionnel.
- `app/ride/active.tsx` — `useLocation({ tracking: true, ... })`, correction du bug de fermeture du minuteur, intégration `ingestPoint()`, `finishRide()` enrichi (distance/vitesse moyenne/max/dénivelé arrondis), garde anti double-finalisation.
- `src/features/rides/rideService.ts` — `getRideStats()` calcule réellement `averageSpeedKmh`/`maxSpeedKmh`.
- `app/tabs/rides.tsx` — type `RideStats` local aligné (champs non optionnels désormais garantis par le service).
- `src/lib/geo/geoUtils.test.ts` (nouveau) — 23 tests unitaires.
- `docs/audits/biketrip-command-results.md` — section 11 ajoutée (+ republication complète, voir §17).
- `docs/audits/biketrip-lot-P0-RIDE-001-report.md` (nouveau) — ce rapport.

Aucun autre fichier (migrations, RLS, auth, signalements, notifications, routes générales, admin, météo, dépendances npm, EAS, permissions arrière-plan) n'a été touché.

## 9. Calcul de distance

`ingestTrackPoint` calcule la distance uniquement entre points **valides consécutifs** via `haversineDistance` (déjà existante, inchangée), accumule dans `RideAccumulator.distanceKm`, jamais recalculée depuis zéro à chaque rendu. Un point rejeté (coordonnées invalides, précision insuffisante, horodatage incohérent, vitesse implicite aberrante) laisse `distanceKm` strictement inchangé. Aucun point n'est traité pendant une pause (`active.tsx` court-circuite `ingestPoint()` si `isPaused`), donc la distance n'augmente jamais pendant une pause. Arrondi à 2 décimales appliqué uniquement à la persistance finale (`finishRide`), jamais pendant l'accumulation, pour ne pas composer d'erreurs d'arrondi.

## 10. Calcul des vitesses

**Vitesse instantanée** : priorité à `coords.speed` (converti en km/h) si présent, fini et ≥ 0 ; sinon repli sur distance/temps entre les deux derniers points valides. Une vitesse négative rapportée par le capteur est traitée comme indisponible (jamais propagée telle quelle). En pause, `currentSpeedKmh` est forcé à 0 immédiatement (`setIsPaused`).

**Vitesse maximale** : maximum des vitesses instantanées valides retenues après filtrage — un point rejeté ne peut jamais l'augmenter.

**Vitesse moyenne** : `computeAverageSpeed(distanceKm, activeDurationSeconds)` = distance / durée active. `elapsedSeconds` sert de durée active car son incrément est explicitement arrêté/redémarré par les mutations pause/reprise (aucune période de pause n'y est comptée), conformément à la définition demandée par la directive.

## 11. Calcul du dénivelé

Comparaison de l'altitude entre le point courant et le **dernier point valide** (pas un point brut quelconque) : une variation absolue ≥ `ELEVATION_NOISE_THRESHOLD_M` (3 m) est répartie en gain ou perte ; en dessous, elle est ignorée (bruit). Aucun dénivelé n'est inventé si l'altitude est absente (`null`) sur l'un des deux points comparés — le compteur reste alors simplement inchangé pour ce segment. Choix assumé et documenté (limite) : ce filtrage est appliqué segment par segment (pas de lissage multi-points), conformément à la consigne « pas de moteur complexe de lissage GPS dans ce lot ».

## 12. Gestion pause et reprise

`app/ride/active.tsx` ne transmet aucun `trackPoint` à `ingestPoint()` tant que `isPaused === true` (garde explicite en tête du `useEffect` de suivi) : ni calcul, ni sauvegarde DB pendant une pause. `rideStore.setIsPaused(true)` force simultanément `currentSpeedKmh` à 0. À la reprise, `startTimer()` redémarre l'incrément du minuteur et le suivi de position reprend normalement dès le prochain relevé GPS accepté.

## 13. Sauvegarde des points

`saveRidePoint()` reçoit désormais `altitude_m: trackPoint.altitudeM` et `speed_kmh: trackPoint.speedKmh` (au lieu de `null` codé en dur), uniquement pour les points **acceptés** par `ingestPoint()` — un point rejeté n'est jamais persisté (évite de polluer l'historique avec une position GPS jugée non fiable). Aucune sauvegarde pendant une pause. Aucune migration créée : les colonnes `altitude_m`/`speed_kmh` existaient déjà dans `ride_points` (`002_tables.sql`).

## 14. Finalisation de la sortie

`finishRide()` est maintenant appelé avec `distance_km` (arrondi 2 décimales), `duration_seconds`, `average_speed_kmh` (via `computeAverageSpeed`), `max_speed_kmh` (arrondi 1 décimale), `elevation_gain_m`/`elevation_loss_m` (arrondis à l'entier) — toutes issues de la même source de vérité (`rideStore`) que celle affichée à l'écran actif. Une garde `hasFinishedRef` empêche un double-tap sur « Terminer » de déclencher deux finalisations ; elle est réinitialisée en cas d'échec réseau (`onError`) pour permettre une nouvelle tentative.

## 15. Résumé et historique

`app/ride/summary.tsx` lisait déjà correctement `ride.average_speed_kmh`/`ride.max_speed_kmh`/`ride.elevation_gain_m` depuis la ligne Supabase — aucune modification nécessaire, ces champs sont désormais alimentés par de vraies valeurs. `getRideStats()` (`rideService.ts`) calcule réellement `averageSpeedKmh` (moyenne pondérée distance/durée sur l'ensemble des sorties) et `maxSpeedKmh` (maximum des `max_speed_kmh` individuels) au lieu d'être absents de la réponse. Le type `RideStats` local de `app/tabs/rides.tsx` a été resserré (`maxSpeedKmh`/`averageSpeedKmh` non optionnels) pour refléter ce contrat réellement tenu. `plannedRides` volontairement non traité (hors périmètre, l'absence ne casse ni le type ni l'écran, déjà gardée par `?? []`).

## 16. Tests unitaires

`src/lib/geo/geoUtils.test.ts` — 23 tests, dont les 15 cas obligatoires de la directive : distance nulle à un seul point, distance connue entre deux coordonnées, accumulation multi-segments, exclusion d'un point invalide, conversion m/s→km/h, vitesse par repli distance/temps, vitesse négative traitée comme indisponible, vitesse maximale, vitesse moyenne (durée active), dénivelé positif, dénivelé négatif, bruit vertical sous le seuil ignoré, altitudes absentes, timestamps identiques/inversés, absence de NaN/infini. Complétés par : rejet pour précision GPS insuffisante, rejet pour saut de position aberrant, acceptation d'une vitesse proche mais sous le seuil. Aucun test ne dépend d'un GPS réel ni d'un mock d'API native (fonctions pures uniquement). Toutes les coordonnées utilisées sont synthétiques (grille autour de l'équateur/méridien d'origine) — aucune position personnelle réelle.

**Résultat réel** : `npx jest src/lib/geo/geoUtils.test.ts --ci` → **23/23 PASS, 0 FAIL**.

## 17. Validation simulée ou manuelle

Un scénario manuel a été exécuté contre le **store Zustand réel** (`useRideStore`), reproduisant une sortie complète avec une séquence de 7 points GPS synthétiques fixes (aucune position personnelle réelle) incluant une pause simulée entre le point 3 et le point 4 :

```
p0 accepted=true distanceKm=0.00000 currentSpeedKmh=0.00 maxSpeedKmh=0.00 elevGainM=0.00 elevLossM=0.00
p1 accepted=true distanceKm=0.10549 currentSpeedKmh=37.98 maxSpeedKmh=37.98 elevGainM=4.00 elevLossM=0.00
p2 accepted=true distanceKm=0.21098 currentSpeedKmh=37.98 maxSpeedKmh=37.98 elevGainM=8.00 elevLossM=0.00
p3 accepted=true distanceKm=0.31647 currentSpeedKmh=37.98 maxSpeedKmh=37.98 elevGainM=11.00 elevLossM=0.00
PAUSE activee — currentSpeedKmh force a 0 (attendu 0)
PAUSE levee, reprise du suivi
p4 accepted=true distanceKm=0.42196 currentSpeedKmh=25.32 maxSpeedKmh=37.98 elevGainM=11.00 elevLossM=0.00
p5 accepted=true distanceKm=0.52744 currentSpeedKmh=37.98 maxSpeedKmh=37.98 elevGainM=11.00 elevLossM=6.00
p6 accepted=true distanceKm=0.63293 currentSpeedKmh=22.00 maxSpeedKmh=37.98 elevGainM=11.00 elevLossM=6.00
--- RESUME FINAL ---
distanceKm=0.63293
activeDurationSeconds=65
maxSpeedKmh=37.98
elevationGainM=11.00
elevationLossM=6.00
averageSpeedKmh=35.10
ridePoints.length=7 (attendu 7 : p0..p6, pause exclue)
```

Preuves démontrées : la distance progresse de façon monotone (0 → 0,633 km) ; la pause force `currentSpeedKmh` à 0 et la distance reste identique avant/après (0,31647 km) tant qu'aucun point n'est ingéré pendant la pause ; le dénivelé distingue correctement une variation de +1 m (p3→p4, sous le seuil de 3 m, ignorée) d'une vraie perte de -6 m (p4→p5, comptabilisée) ; `ridePoints.length === 7` confirme qu'aucun point « fantôme » n'a été ajouté pendant la pause. Script temporaire (`src/lib/geo/__manual_scenario__.test.ts`), supprimé après exécution — non livré, non commité, conformément au périmètre (fichiers de test autorisés mais ce script ponctuel ne fait pas partie de la couverture permanente exigée).

## 18. Validation sur appareil physique

**`VALIDATION APPAREIL EN ATTENTE`.** Aucun appareil physique ni simulateur avec injection de position GPS n'était disponible dans cet environnement sandbox (pas d'accès à un émulateur Android/iOS graphique). La validation ci-dessus (tests unitaires + scénario manuel contre le store réel) couvre l'intégralité de la logique de calcul, mais ne peut pas se substituer à un trajet réel d'au moins 1 km comparé à une application de référence, comme l'exige explicitement la directive avant de déclarer la Phase 2E `PASS`.

## 19. Résultat lint

```
npx eslint . --ext .ts,.tsx --format json
```
65 fichiers lintés (64 + le nouveau fichier de test), **0 erreur, 0 avertissement**.

## 20. Résultat typecheck

```
npx tsc --noEmit
```
**0 erreur** sur l'ensemble du projet, code de sortie 0.

## 21. Résultat Jest

```
npx jest --ci
```
```
PASS src/lib/geo/geoUtils.test.ts
PASS src/lib/constants/labels.test.ts

Test Suites: 2 passed, 2 total
Tests:       23 passed, 23 total
```

## 22. Diff final

```
git diff --check
```
→ avertissements de fin de ligne (CRLF) sur `supabase/seed.sql` uniquement — anomalie préexistante, non introduite par ce lot.

```
git diff --stat
```
```
 app/ride/active.tsx                     | 121 +++--
 app/tabs/rides.tsx                      |  10 +-
 docs/audits/biketrip-command-results.md |  53 +++
 src/features/rides/rideService.ts       |  32 +-
 src/hooks/useLocation.ts                |  47 +-
 src/lib/geo/geoUtils.ts                 | 192 ++++++++
 src/stores/rideStore.ts                 |  96 +++-
 supabase/seed.sql                       | 760 ++++++++++++++++----------------
 8 files changed, 872 insertions(+), 439 deletions(-)
```
Seul `supabase/seed.sql` hors périmètre applicatif de ce lot apparaît modifié, inchangé depuis l'audit initial (anomalie de fin de ligne préexistante). Aucune migration, aucun fichier Supabase, aucune route générale, aucune dépendance npm.

## 23. Commit local

Un commit local (sans push) a été effectué, limité strictement à :
- `app/ride/active.tsx`
- `app/tabs/rides.tsx`
- `src/features/rides/rideService.ts`
- `src/hooks/useLocation.ts`
- `src/lib/geo/geoUtils.ts`
- `src/lib/geo/geoUtils.test.ts` (nouveau)
- `src/stores/rideStore.ts`
- `docs/audits/biketrip-command-results.md`
- `docs/audits/biketrip-lot-P0-RIDE-001-report.md` (nouveau, ce rapport)

Message (Conventional Commits) :
```
fix(rides): calculate and persist tracking statistics
```

`supabase/seed.sql` et les documents non suivis hors périmètre n'ont **pas** été inclus. Aucun push effectué.

## 24. État Git final

Après commit : seul `supabase/seed.sql` reste modifié et non commité (anomalie préexistante), les documents d'audit hors périmètre restent non suivis. Tous les fichiers de ce lot sont commités localement au-dessus du SHA `65c2aeb`.

## 25. Écarts avec la directive

- **Statut final `PASS SOUS RÉSERVE APPAREIL`, pas `PASS`** : conforme à la consigne explicite de la directive ("La Phase 2E ne sera pas déclarée PASS tant qu'un trajet réel n'a pas été effectué"), pas un écart mais une application stricte de la règle.
- **Deux défauts hors liste initiale corrigés** (absence de `tracking: true`, bug de fermeture du minuteur) : nécessaires pour satisfaire les critères d'acceptation (distance/vitesse/durée réellement fonctionnelles), documentés en détail au §5, dans les fichiers déjà autorisés par le périmètre (`active.tsx`, `useLocation.ts`).
- **Renommage `currentSpeed` → `currentSpeedKmh`** dans `rideStore.ts` : vérifié par recherche exhaustive comme utilisé uniquement par `rideStore.ts` et `active.tsx`, aucune régression possible ailleurs ; conforme à la règle de nommage explicite de la directive ("noms de variables suffixés par leur unité").
- **Republication complète de `docs/audits/biketrip-command-results.md`** : une anomalie d'environnement (détaillée au §26) a nécessité de réécrire l'intégralité du fichier plutôt qu'un simple ajout en fin de fichier, pour garantir que le contenu livré corresponde exactement à ce qui est décrit dans ce rapport.

## 26. Risques résiduels

- **Validation appareil physique manquante** (risque principal, voir §18) — à effectuer avant toute déclaration `PASS` complète de la Phase 2E.
- **Anomalie d'environnement de vérification** : à plusieurs reprises durant ce lot, le terminal bash utilisé pour exécuter lint/typecheck/Jest a lu une version tronquée d'un fichier pourtant intégralement écrit par l'outil d'édition — constatée sur `src/lib/geo/geoUtils.ts` (une fois), `src/lib/geo/geoUtils.test.ts` (plusieurs fois) et `docs/audits/biketrip-command-results.md` (une fois, affectant potentiellement aussi le commit du lot précédent, corrigé au §11 du fichier de résultats). Chaque occurrence a été détectée par comparaison explicite taille/contenu avant d'accepter un résultat de test, puis corrigée par réécriture. Aucun résultat rapporté ici n'a été retenu sans cette vérification. Risque résiduel : cette anomalie pourrait se reproduire lors d'un futur lot ; recommandation de systématiser une vérification `wc -c`/`tail` après toute modification de fichier avant de faire confiance à un résultat de commande.
- **Filtrage de dénivelé segment par segment** (pas de lissage multi-points) : simplification assumée (voir §11), pourrait légèrement sous-compter un dénivelé qui s'accumule par petits paliers tous individuellement sous le seuil de 3 m.
- **`GPS_MIN_ACCURACY_M`/`GPS_MAX_PLAUSIBLE_SPEED_KMH`/`ELEVATION_NOISE_THRESHOLD_M`** : valeurs raisonnables mais non calibrées sur données réelles de terrain (dépendant de la validation appareil physique en attente).
- Les constats de l'audit initial non traités par ce lot (routes cassées, absence de CI, rate limiting, résolution par vote, notifications, admin, etc.) restent entièrement d'actualité.

## 27. Verdict proposé

**PASS SOUS RÉSERVE APPAREIL**

## 28. Arrêt confirmé

Arrêt effectué après l'exécution des tests, la validation simulée, le commit local, et la production de ce rapport. Aucun travail sur la CI, la correction générale des routes, les notifications, `app_settings`, le rate limiting, la détection de doublons, la modération, la météo, le monorepo, l'admin ou le suivi arrière-plan n'a été entamé.
