# Securite BikeTrip

## Supabase RLS

Les migrations activent RLS sur les tables applicatives sensibles :
`profiles`, `reports`, `report_votes`, `report_comments`, `trail_reviews`, `favorites`, `collections`, `collection_trails`, `rides`, `ride_points`, `ride_photos`, `planned_rides`, `audit_logs`, `trails`, `trail_points`, `points_of_interest` et `weather_snapshots`.

Les donnees privees utilisateur restent filtrees par `auth.uid()` :
`rides`, `ride_points`, `favorites`, `collections`, `collection_trails`, `planned_rides` et `ride_photos`.

## Roles admin et moderator

Le role effectif est resolu cote base avec `current_user_role()`, qui lit `profiles.role` pour `auth.uid()`.

`profiles.role` est protege par le trigger `prevent_profile_role_escalation`. Un utilisateur standard ou moderator ne peut pas modifier son role ni celui d'un autre utilisateur. Seuls `ADMIN` et `SUPER_ADMIN` peuvent modifier les roles via la policy `profiles: admin modifie tout`.

Les droits de moderation des reports sont limites a `MODERATOR`, `ADMIN` et `SUPER_ADMIN`. Les suppressions sensibles restent reservees a `ADMIN` et `SUPER_ADMIN`.

## Audit logs

`audit_logs` est lisible et inserable uniquement par `ADMIN` ou `SUPER_ADMIN`. Une insertion libre par utilisateur standard est interdite.

## Reports

Les reports sont lisibles publiquement uniquement quand leur statut est `ACTIVE` ou `CONFIRMED`. L'auteur peut toujours lire et modifier son propre report. Les roles `MODERATOR`, `ADMIN` et `SUPER_ADMIN` peuvent moderer les reports.

## Weather snapshots

La lecture publique de `weather_snapshots` est acceptee en V1, car les donnees meteo ne contiennent pas de donnees utilisateur privees. L'insertion est restreinte a `ADMIN` et `SUPER_ADMIN` afin d'eviter qu'un utilisateur connecte injecte des donnees meteo arbitraires.

## Tests de regression RLS

Le fichier `supabase/tests/rls_security.sql` couvre les scenarios multi-utilisateurs critiques :
user A, user B, admin, moderator, profils publics/prives, protection de `profiles.role`, refus d'insertion libre dans `audit_logs`, isolation des rides, ride_points, favorites et collections, lecture controlee des reports, update par auteur et moderation par moderator/admin.
