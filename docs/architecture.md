# Architecture BikeTrip

## Vue d'ensemble

BikeTrip est une application mobile React Native / Expo qui suit une architecture **feature-first** avec une séparation claire des responsabilités : les features encapsulent leur logique métier, les composants UI sont génériques et réutilisables, les stores Zustand gèrent l'état local, et TanStack Query gère l'état serveur.

```
BikeTrip
├── app/                    # Écrans Expo Router (file-based routing)
│   ├── _layout.tsx         # Root layout (QueryClient, GestureHandler)
│   ├── index.tsx           # Guard de navigation (onboarding / auth / home)
│   ├── onboarding/
│   ├── auth/               # login, register, forgot-password
│   ├── (tabs)/             # Navigation principale (5 onglets)
│   │   ├── home.tsx
│   │   ├── map.tsx
│   │   ├── discover.tsx
│   │   ├── rides.tsx
│   │   └── profile.tsx
│   ├── trails/             # [id].tsx, review.tsx
│   ├── ride/               # start.tsx, active.tsx, summary.tsx
│   ├── reports/            # new.tsx, [id].tsx
│   ├── favorites/
│   ├── collections/
│   └── settings/
│
├── src/
│   ├── components/         # Composants UI réutilisables
│   │   ├── ui/             # Atoms (AppButton, AppCard, AppInput…)
│   │   ├── trails/         # TrailCard
│   │   ├── weather/        # WeatherCard
│   │   ├── reports/        # ReportCard
│   │   └── rides/          # StatTile, RideTrackingPanel
│   │
│   ├── features/           # Logique métier par domaine
│   │   ├── auth/           # authService, profileService
│   │   ├── trails/         # trailService
│   │   ├── weather/        # weatherService
│   │   ├── advice/         # adviceEngine (moteur déterministe)
│   │   ├── reports/        # reportService
│   │   ├── rides/          # rideService
│   │   ├── favorites/      # favoriteService
│   │   ├── collections/    # collectionService
│   │   └── notifications/  # notificationService
│   │
│   ├── stores/             # État local Zustand
│   │   ├── authStore.ts    # user, session, profile
│   │   ├── rideStore.ts    # sortie active (GPS, distance, temps)
│   │   └── mapStore.ts     # localisation, filtres, sélections
│   │
│   ├── hooks/              # Hooks React personnalisés
│   │   ├── useAuth.ts      # Listener Supabase Auth
│   │   └── useLocation.ts  # Géolocalisation continue
│   │
│   ├── lib/
│   │   ├── supabase/       # Client Supabase (SecureStore adapter)
│   │   ├── constants/      # Labels français (enums → chaînes)
│   │   ├── geo/            # Calculs géographiques (haversine)
│   │   ├── storage/        # Upload d'images (compression + Supabase)
│   │   ├── permissions/    # Permissions (localisation, caméra…)
│   │   └── validations/    # Schémas Zod (auth, profil, report…)
│   │
│   ├── types/              # Types TypeScript globaux
│   │   ├── database.ts     # Enums, tables, joins, utilitaires
│   │   └── weather.ts      # WeatherData, RideAdvice, ChecklistItem
│   │
│   ├── config/
│   │   └── colors.ts       # Palette de couleurs et gradients
│   │
│   └── styles/
│       └── global.css      # Directives Tailwind / NativeWind
│
└── supabase/
    ├── migrations/         # SQL versionnés (001 → 006)
    └── seed.sql            # Données de démonstration
```

## Flux de données

```
Composant
   │
   ├─→ TanStack Query (useQuery / useMutation)
   │       │
   │       └─→ Service métier (src/features/*/*)
   │               │
   │               └─→ Supabase Client (Postgres + Auth + Storage)
   │
   └─→ Zustand Store (état local synchrone)
           ├── authStore   (user, session, profil)
           ├── rideStore   (GPS en temps réel)
           └── mapStore    (région, filtres, sélection)
```

## Moteur de conseils (adviceEngine)

Le moteur `generateRideAdvice` est **100% déterministe**, sans dépendance à une API d'IA. Il calcule un score de risque (0–100) en appliquant des règles pondérées :

| Facteur | Règles clés |
|---|---|
| Météo | Pluie ≥70% → +25, vent ≥40km/h → +30, temp <5°C → +15 |
| Dénivelé | Selon niveau cycliste (débutant + haute montagne → +20) |
| Vélo/Surface | Vélo route sur gravier → +15 |
| Signalements | Critique → +20, haut → +10 |
| Luminosité | Coucher du soleil < 1h → +10 |

Score → Niveau de risque : 0→LOW, 20→MODERATE, 45→HIGH, 70→EXTREME

## Authentification

1. `app/index.tsx` vérifie `SecureStore` pour `onboarding_done`
2. `useAuth` hook écoute `onAuthStateChange` de Supabase
3. Les tokens sont stockés dans `SecureStore` (jamais `AsyncStorage`)
4. RLS Supabase applique les règles d'accès côté serveur

## Navigation (Expo Router v4)

```
/                       → Redirect (index.tsx)
/onboarding             → 4 slides d'introduction
/auth/login
/auth/register
/auth/forgot-password
/(tabs)/home
/(tabs)/map
/(tabs)/discover
/(tabs)/rides
/(tabs)/profile
/trails/[id]            → Détail piste (onglets Infos/Météo/Signalements/Avis)
/ride/start             → Préparation
/ride/active            → Suivi GPS actif
/ride/summary           → Résumé post-sortie
/reports/new            → Nouveau signalement
/reports/[id]           → Détail signalement
/favorites              → Liste des favoris
/collections            → Liste des collections
/collections/[id]       → Détail collection
/settings               → Paramètres & profil
```

## Stratégie de cache

| Donnée | staleTime | Justification |
|---|---|---|
| Météo | 10 min | Données quasi-temps réel |
| Pistes proches | 5 min | Peu de changements fréquents |
| Pistes populaires | 10 min | Stable |
| Signalements | 5 min | Peuvent évoluer rapidement |
| Profil | 2 min | Données personnelles |
| Statistiques | 10 min | Agrégats lourds |
