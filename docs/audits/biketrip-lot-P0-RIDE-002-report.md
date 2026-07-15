# RAPPORT D'EXÉCUTION — BIKETRIP-P0-RIDE-002

**Date** : 2026-07-14
**Lot** : BIKETRIP-P0-RIDE-002 — Plafonnement de la vitesse rapportée par le capteur
**Statut final** : **PASS SOUS RÉSERVE APPAREIL**

---

## 1. Identification du lot

| Champ | Valeur |
|---|---|
| Identifiant | BIKETRIP-P0-RIDE-002 |
| Lot précédent | BIKETRIP-P0-RIDE-001 (`7b0c2a9d52daf9d00d8d5c9c13f71abfe17bab9d`) |
| Nature | Correctif ciblé, additif, sans changement de contrat public ni d'architecture |
| Périmètre | `src/lib/geo/geoUtils.ts`, `src/lib/geo/geoUtils.test.ts` |

---

## 2. Objectif

Corriger un défaut résiduel identifié en revue PM du lot RIDE-001 : la vitesse rapportée par le capteur GPS (`raw.speedKmh`, dérivée de `coords.speed`) n'était bornée par aucun seuil de plausibilité physique, contrairement à la vitesse implicite (déplacement/temps). Une valeur aberrante issue du capteur (bruit matériel, saut de position, valeur mal normalisée en amont) pouvait donc contaminer `currentSpeedKmh` et `maxSpeedKmh` — y compris sur le tout premier point d'une sortie, où aucune vérification par déplacement n'est possible faute de point précédent.

---

## 3. Point de départ Git et vérification d'intégrité du commit précédent

- **HEAD au début du lot** : `7b0c2a9d52daf9d00d8d5c9c13f71abfe17bab9d`
- **Message** : `fix(rides): calculate and persist tracking statistics`
- **Arbre de travail** : propre au démarrage sur le périmètre applicatif (seule dérive préexistante : `supabase/seed.sql`, voir §14).

**Vérification anti-troncature du commit précédent** — chaque fichier du commit `7b0c2a9` a été comparé octet à octet entre `git show HEAD:<fichier> | wc -c` et son contenu attendu (aucun fichier tronqué, aucune terminaison syntaxique incomplète) :

| Fichier | Taille (octets) | Terminaison vérifiée |
|---|---|---|
| `app/ride/active.tsx` | 14 918 | ✅ propre |
| `app/tabs/rides.tsx` | 12 755 | ✅ propre |
| `docs/audits/biketrip-command-results.md` | 18 073 | ✅ propre |
| `docs/audits/biketrip-lot-P0-RIDE-001-report.md` | 23 184 | ✅ propre |
| `src/features/rides/rideService.ts` | 8 307 | ✅ propre |
| `src/hooks/useLocation.ts` | 4 179 | ✅ propre |
| `src/lib/geo/geoUtils.test.ts` | 11 284 | ✅ propre |
| `src/lib/geo/geoUtils.ts` | 9 716 | ✅ propre |
| `src/stores/rideStore.ts` | 3 420 | ✅ propre |

**Conclusion** : le commit `7b0c2a9` n'est pas tronqué. L'anomalie de désynchronisation terminal/fichier documentée pendant RIDE-001 n'a pas affecté le contenu réellement committé.

---

## 4. Contexte vérifié (défaut confirmé)

Code avant correction (`src/lib/geo/geoUtils.ts`, fonction `ingestTrackPoint`) :

```ts
const deviceSpeedKmh = raw.speedKmh != null && Number.isFinite(raw.speedKmh) && raw.speedKmh >= 0
  ? raw.speedKmh
  : null;
```

Seules l'existence, la finitude et la positivité de `raw.speedKmh` étaient vérifiées — aucune borne supérieure. Une valeur telle que `120` km/h (physiquement implausible à vélo) était acceptée telle quelle comme `currentSpeedKmh`, y compris sur le premier point de la sortie où `maxSpeedKmh` n'a aucun autre garde-fou.

---

## 5. Périmètre de fichiers

**Autorisés et modifiés** :
- `src/lib/geo/geoUtils.ts`
- `src/lib/geo/geoUtils.test.ts`
- `docs/audits/biketrip-command-results.md` (§12 ajoutée)
- `docs/audits/biketrip-lot-P0-RIDE-002-report.md` (ce document, nouveau)

**Autorisé mais non modifié** : `src/hooks/useLocation.ts` — non nécessaire, la correction est entièrement contenue dans la fonction pure `ingestTrackPoint`.

**Interdits et non touchés** : `app/ride/active.tsx`, `src/stores/rideStore.ts`, `src/features/rides/rideService.ts`, `app/tabs/rides.tsx`, toute migration Supabase, `supabase/seed.sql`, toute route, notification, rapport, configuration CI, dépendance, tracking arrière-plan, permission native, configuration EAS, design system. Confirmé par `git diff --stat` (voir §12).

---

## 6. Description technique du correctif

Ajout d'une borne supérieure sur `raw.speedKmh`, réutilisant la constante déjà existante `GPS_MAX_PLAUSIBLE_SPEED_KMH` (80 km/h, précédemment utilisée uniquement pour la vitesse implicite) :

```ts
const deviceSpeedKmh = raw.speedKmh != null
  && Number.isFinite(raw.speedKmh)
  && raw.speedKmh >= 0
  && raw.speedKmh <= GPS_MAX_PLAUSIBLE_SPEED_KMH
  ? raw.speedKmh
  : null;
```

Comportement résultant :
- Une vitesse capteur invalide, négative, non finie (`NaN`/`Infinity`) ou strictement supérieure au seuil devient `null` (indisponible).
- Si un point précédent valide existe, le calcul retombe automatiquement sur la vitesse implicite (déplacement/temps) — logique déjà présente, inchangée.
- Si aucun point précédent n'existe (premier point de la sortie), `currentSpeedKmh` reste `null` et `maxSpeedKmh` n'est pas mis à jour — c'était le trou de sécurité initial, désormais comblé sans code additionnel nécessaire dans la branche « premier point », qui consomme simplement la valeur déjà bornée de `deviceSpeedKmh`.

Un seul point de vérité (`GPS_MAX_PLAUSIBLE_SPEED_KMH`) est utilisé pour les deux vitesses (capteur et implicite), conformément à la règle technique de la directive imposant une constante unique afin d'éviter deux règles concurrentes.

Aucun changement de signature, aucun nouveau champ, aucun changement de comportement pour les valeurs déjà plausibles (`speedKmh` valide et ≤ 80 km/h) : diff strictement additif au niveau du contrat.

---

## 7. Règles techniques respectées

- Aucun `any` introduit (vérifié par `grep -n "\bany\b"` sur les deux fichiers modifiés — 0 résultat).
- Aucun changement d'architecture ni de contrat public (`IngestResult`, `RideAccumulator`, `RideTrackPoint` inchangés).
- Aucun tracking arrière-plan, aucune nouvelle dépendance, aucun changement Supabase.
- Aucune position personnelle réelle dans les tests (coordonnées synthétiques autour de l'équateur/méridien d'origine, cohérent avec les tests RIDE-001 existants).
- Seuil unique (`GPS_MAX_PLAUSIBLE_SPEED_KMH`) partagé entre vitesse capteur et vitesse implicite — pas de duplication de constante.

---

## 8. Tests unitaires ajoutés (7 cas requis)

Nouveau bloc `describe('ingestTrackPoint - vitesse capteur bornée (BIKETRIP-P0-RIDE-002)')` dans `src/lib/geo/geoUtils.test.ts` :

1. **Premier point, vitesse capteur aberrante (120 km/h)** → point accepté (coordonnées valides), `currentSpeedKmh` = `null`, `maxSpeedKmh` reste à `0`.
2. **Second point, vitesse capteur aberrante (120 km/h) avec déplacement plausible** → vitesse capteur ignorée, repli sur la vitesse implicite (≈40,03 km/h, identique au test de repli existant), `maxSpeedKmh` mis à jour avec la vitesse implicite.
3. **Vitesse capteur exactement égale au seuil** (`GPS_MAX_PLAUSIBLE_SPEED_KMH`) → acceptée telle quelle.
4. **Vitesse capteur légèrement supérieure au seuil** (`+0.1`) → rejetée, `currentSpeedKmh` = `null`.
5. **Vitesse capteur infinie** (`Infinity`) → rejetée.
6. **Vitesse capteur `NaN`** → rejetée.
7. **Séquence mixte** (capteur aberrant en premier point, capteur valide proche du seuil, capteur négatif, capteur infini, capteur `NaN`) → `maxSpeedKmh` ne dépasse jamais `GPS_MAX_PLAUSIBLE_SPEED_KMH` à aucune étape, et reste toujours fini.

Tous les tests RIDE-001 existants (22 cas) ont été conservés sans modification.

---

## 9. Résultats des tests

```
npx jest --silent
PASS src/lib/geo/geoUtils.test.ts
PASS src/lib/constants/labels.test.ts

Test Suites: 2 passed, 2 total
Tests:       30 passed, 30 total
Snapshots:   0 total
Time:        3.895 s
```

30/30 tests passent (22 tests RIDE-001 inchangés + 7 nouveaux tests RIDE-002 + 1 test préexistant hors périmètre `labels.test.ts`). 0 échec, 0 test ignoré.

---

## 10. Lint

```
npx eslint . --ext .ts,.tsx
```
**Résultat** : code de sortie 0, aucune erreur, aucun avertissement, sur l'ensemble du dépôt (pas seulement les fichiers modifiés).

---

## 11. Typecheck

```
npx tsc --noEmit
```
**Résultat** : code de sortie 0, aucune erreur de type sur l'ensemble du projet.

---

## 12. Vérification du diff (scope et anti-troncature)

`git diff --stat` restreint au périmètre autorisé :
```
src/lib/geo/geoUtils.test.ts | 106 +++++++++++++++++++++++++++++++++++++++++++
src/lib/geo/geoUtils.ts      |  29 ++++++++++--
2 files changed, 130 insertions(+), 5 deletions(-)
```

`git status --short` confirme qu'aucun fichier interdit n'a été modifié par ce lot (la seule autre entrée modifiée, `supabase/seed.sql`, est une dérive préexistante non causée par ce lot — voir §14).

Vérification anti-troncature finale (`xxd src/lib/geo/geoUtils.ts | tail` et `xxd src/lib/geo/geoUtils.test.ts | tail`) : les deux fichiers se terminent proprement par une accolade fermante syntaxiquement valide (`};\n}\n` / `});\n});\n`), aucune coupure en milieu de mot détectée.

---

## 13. Anomalies d'environnement rencontrées et corrigées

**Désynchronisation persistante du montage bash** (déjà documentée pendant RIDE-001, reproduite ici) : après chaque modification via l'outil d'édition de fichiers, le terminal bash utilisé pour exécuter lint/typecheck/jest continuait de lire l'ancienne version du fichier (taille et contenu de fin de fichier identiques à l'état précédent). Reproduit sur `src/lib/geo/geoUtils.ts`, `src/lib/geo/geoUtils.test.ts` et `docs/audits/biketrip-command-results.md`. Corrigé systématiquement par relecture de la source de vérité puis réécriture complète côté terminal, avec vérification `wc -l -c` / `tail -c` / `xxd | tail` avant toute exécution de commande de validation — aucun résultat n'a été retenu comme valide avant cette vérification.

**Effet de bord détecté et corrigé** : la première réécriture manuelle de `src/lib/geo/geoUtils.ts` a involontairement dépouillé les accents français des commentaires existants, gonflant le diff à 124 lignes modifiées au lieu des ~29 réellement nécessaires. Détecté par relecture du diff avant validation finale, corrigé par reconstruction programmatique (script Python, UTF-8 explicite) à partir du contenu exact du commit `7b0c2a9`, en n'appliquant que les lignes strictement nécessaires à la correction. Le diff final (§12) reflète cette correction.

---

## 14. Anomalie constatée hors périmètre — `supabase/seed.sql`

`git status` signale `supabase/seed.sql` comme modifié, alors que ce fichier n'a jamais été ouvert ni édité pendant ce lot (fichier explicitement hors périmètre autorisé). Investigation :
- `git diff --stat supabase/seed.sql` → 380 insertions / 380 suppressions (réécriture apparente intégrale).
- `git show HEAD:supabase/seed.sql | tr -d '\r' | md5sum` et `cat supabase/seed.sql | tr -d '\r' | md5sum` → **hash identique** (`ab7c875689349aaaca6ebadfc22a5c64`).
- `file supabase/seed.sql` → terminaisons `CRLF` côté disque, contre `LF` dans la version committée.

**Conclusion** : dérive de fin de ligne uniquement (CRLF/LF), contenu strictement identique, préexistante à ce lot (déjà notée dans l'audit initial et dans le rapport RIDE-001, §9 et §11 de `biketrip-command-results.md`). Non introduite ni aggravée par ce lot. Non corrigée ici (hors périmètre autorisé) — signalée pour action séparée du PM.

---

## 15. Protocole de test sur appareil physique (non exécuté — aucun appareil disponible dans cet environnement)

Aucun appareil mobile physique n'étant accessible dans cet environnement d'exécution sandbox, le protocole suivant est documenté pour exécution ultérieure par une personne disposant d'un appareil, sans qu'aucune étape n'ait été réalisée ici.

**15.1 Prérequis matériels et logiciels**
- Un smartphone Android (≥ Android 10) ou iOS (≥ iOS 15), GPS matériel fonctionnel, testé en extérieur à ciel ouvert (éviter les zones urbaines denses/canyons pour la première validation).
- Application lancée via Expo Go (build de développement) ou un build de développement natif (`expo run:android` / `expo run:ios`), correspondant à ce commit local.
- Permissions de localisation accordées explicitement en mode « Lors de l'utilisation de l'app uniquement » (le projet est `FOREGROUND_TRACKING` exclusif — refuser toute demande de permission « toujours » si le système la propose).
- Un GPS de référence indépendant pour comparaison : une autre application de suivi GPS déjà validée (Strava, application native Plans/Maps en mode trace, ou une montre GPS), lancée en parallèle sur le même trajet.

**15.2 Parcours de test**
- Distance minimale : **≥ 1 km**, en extérieur, avec un minimum de variation d'altitude si possible (pour exercer aussi la logique de dénivelé, déjà validée en RIDE-001, non re-testée ici).
- Inclure si possible un court arrêt à un feu ou une intersection (vitesse proche de 0) et une portion à vitesse normale de vélo (15–30 km/h), afin d'observer que `maxSpeedKmh` reste dans une plage plausible et qu'aucun pic aberrant n'apparaît malgré d'éventuels sauts GPS réels (tunnels courts, sous-bois dense, proximité de bâtiments hauts).

**15.3 Séquence d'exécution**
1. Ouvrir l'application, démarrer une sortie (`app/ride/start.tsx` → `app/ride/active.tsx`).
2. Vérifier que le suivi démarre effectivement (indicateur de suivi actif, première position capturée).
3. Rouler pendant au moins 2 minutes en continu, en notant mentalement ou par capture d'écran les valeurs affichées de vitesse instantanée et de vitesse max à intervalles réguliers (ex. toutes les 30 secondes).
4. Mettre en pause la sortie, attendre **2 minutes** sans bouger (ou en marchant lentement avec le téléphone, pour simuler un léger bruit GPS pendant la pause).
5. Reprendre la sortie (« resume ») et continuer à rouler jusqu'à compléter le trajet ≥ 1 km.
6. Arrêter la sortie (« finish »).

**15.4 Valeurs à capturer**
- Distance totale affichée en fin de sortie.
- Vitesse moyenne (`averageSpeedKmh`) et vitesse maximale (`maxSpeedKmh`) affichées.
- Dénivelé positif/négatif affiché (contrôle de non-régression RIDE-001).
- Capture d'écran ou relevé manuel de la distance/vitesse rapportées par le GPS de référence indépendant, pour le même trajet.

**15.5 Vérification côté Supabase**
- Après la fin de la sortie, interroger la table des sorties (`rides` ou équivalent) via le dashboard Supabase ou une requête `SELECT` en lecture seule, pour confirmer que les valeurs persistées (`distance_km`, `average_speed_kmh`, `max_speed_kmh`, `elevation_gain_m`, `elevation_loss_m`) correspondent à celles affichées dans l'application à la fin de la sortie (pas de perte ni de troncature lors de la persistance).
- Recharger l'historique des sorties dans l'application (`app/tabs/rides.tsx` puis l'écran de résumé de la sortie) et confirmer que les mêmes valeurs sont affichées après rechargement complet (fermeture/réouverture de l'app), validant l'absence de régression de lecture après écriture.

**15.6 Critères de tolérance**
- Distance : tolérance de **± 10 %** par rapport au GPS de référence indépendant (tolérance usuelle pour un GPS de smartphone grand public sur un trajet ≥ 1 km).
- Vitesse maximale : doit rester **strictement ≤ 80 km/h** (`GPS_MAX_PLAUSIBLE_SPEED_KMH`) sauf trajet effectué à une vitesse réellement supérieure (non applicable à un test à vélo standard) — toute valeur affichée au-delà de ce seuil constitue un échec direct de ce lot.
- Aucune valeur `NaN`, `Infinity` ou négative ne doit jamais apparaître à l'écran, à aucun moment de la sortie (démarrage, pause, reprise, arrêt).

**15.7 Critères d'échec (FAIL)**
- `maxSpeedKmh` affiche une valeur supérieure à 80 km/h à un moment quelconque de la sortie.
- Une valeur `NaN`/`Infinity`/négative apparaît à l'écran.
- La distance persistée en base diffère de la distance affichée en fin de sortie de plus qu'un arrondi négligeable (< 0.01 km).
- L'application se bloque, plante, ou perd le suivi GPS de façon irrécupérable pendant le test.

**Statut de cette section** : protocole rédigé, **non exécuté** — aucun appareil physique disponible dans cet environnement. Le statut global de ce lot reste donc `PASS SOUS RÉSERVE APPAREIL`, cohérent avec le statut retenu pour RIDE-001.

---

## 16. Critères d'acceptation — statut détaillé

| # | Critère | Statut |
|---|---|---|
| 1 | Vitesse capteur bornée par `GPS_MAX_PLAUSIBLE_SPEED_KMH` | ✅ PASS |
| 2 | Seuil unique partagé entre vitesse capteur et vitesse implicite | ✅ PASS |
| 3 | Premier point de la sortie protégé (aucun déplacement de référence) | ✅ PASS |
| 4 | Repli sur vitesse implicite quand la vitesse capteur est rejetée et qu'un point précédent existe | ✅ PASS |
| 5 | `currentSpeedKmh`/`maxSpeedKmh` ne dépassent jamais le seuil, quelle que soit la séquence | ✅ PASS (test #7) |
| 6 | 7 tests unitaires requis ajoutés et passants | ✅ PASS |
| 7 | 22 tests RIDE-001 existants toujours passants (non-régression) | ✅ PASS |
| 8 | Aucun `any` introduit | ✅ PASS |
| 9 | Aucun changement de contrat public/architecture | ✅ PASS |
| 10 | Aucune position personnelle réelle dans les tests | ✅ PASS |
| 11 | Lint (dépôt entier) | ✅ PASS (0 erreur) |
| 12 | Typecheck (dépôt entier) | ✅ PASS (0 erreur) |
| 13 | Diff limité au périmètre autorisé | ✅ PASS |
| 14 | Vérification anti-troncature du commit précédent | ✅ PASS |
| 15 | Vérification anti-troncature des fichiers livrés | ✅ PASS |
| 16 | Protocole de test appareil physique rédigé | ✅ PASS (rédigé, non exécuté — aucun appareil) |

Aucun critère en échec. Statut global : **PASS SOUS RÉSERVE APPAREIL** (seule réserve : validation dynamique sur GPS réel non exécutable dans cet environnement).

---

## 17. Git — commit local

- **Commit effectué** : oui, localement uniquement.
- **Message** : `fix(rides): reject implausible sensor speeds`
- **Fichiers inclus** : `src/lib/geo/geoUtils.ts`, `src/lib/geo/geoUtils.test.ts`, `docs/audits/biketrip-command-results.md`, `docs/audits/biketrip-lot-P0-RIDE-002-report.md`.
- **Fichiers explicitement exclus** : `supabase/seed.sql` (dérive de fin de ligne préexistante, hors périmètre — non ajouté à l'index), tout autre fichier non listé dans le périmètre autorisé.
- **Push** : aucun — conformément à la règle git du lot, aucune commande `git push` n'a été exécutée.

---

## 18. Statut final et arrêt

**Statut final du lot BIKETRIP-P0-RIDE-002 : PASS SOUS RÉSERVE APPAREIL.**

Tous les critères techniques vérifiables dans cet environnement (tests unitaires, lint, typecheck, vérification de diff, vérification anti-troncature, intégrité du commit précédent) sont satisfaits. La seule réserve, identique en nature à celle du lot RIDE-001, est l'absence de validation dynamique sur un appareil physique avec GPS réel — le protocole correspondant est rédigé en détail (§15) mais non exécuté faute d'appareil disponible dans cet environnement sandbox.

Conformément à la directive, **aucun travail au-delà du périmètre BIKETRIP-P0-RIDE-002 n'a été engagé** : aucun test de terrain, aucune modification de CI, aucune route, aucune notification, aucun rapport additionnel, aucune intégration météo, aucune fonctionnalité d'administration, aucune structure monorepo. Ce rapport clôt le lot et attend une nouvelle directive PM avant toute poursuite.
