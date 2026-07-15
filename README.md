# 🚴 BikeTrip

BikeTrip est une application mobile pour cyclistes, construite avec React Native (Expo) et Supabase. Elle vise à faciliter la préparation des sorties à vélo, la découverte de pistes, la géolocalisation, les signalements communautaires, les conseils de sécurité et l'historique des sorties — pour les cyclistes occasionnels, sportifs, urbains ou récréatifs.

Cette section décrit l'état réel du projet ; voir « État actuel du projet » ci-dessous pour savoir ce qui est effectivement livré.

---

## État actuel du projet

**Disponible / implémenté**
- Authentification et profils
- Découverte et consultation de pistes
- Favoris et collections
- Signalements communautaires de base
- Suivi de sortie au premier plan (distance, vitesse, dénivelé)
- Historique des sorties
- Backend Supabase avec RLS (Row Level Security)
- Tests unitaires (Jest)
- Workflow CI GitHub Actions (lint, typecheck, tests)

**Partiel / en validation**
- Statistiques GPS : calculs implémentés et couverts par tests automatisés, mais non encore validés sur appareil physique réel
- Météo : intégration présente (Open-Meteo), non encore considérée comme une fondation de production validée
- Planification de sorties : affichage et données partiels selon l'état actuel du code

**Non livré**
- Application web d'administration
- Fonctionnement hors ligne
- Suivi GPS en arrière-plan
- EAS Build et publication sur les stores
- Architecture monorepo
- Système complet de notifications
- Modération administrative complète

Cette liste n'est pas nécessairement exhaustive ; elle reflète l'état constaté au moment de la rédaction.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Mobile | React Native + Expo SDK 52 |
| Routing | Expo Router v4 |
| Langage | TypeScript strict |
| UI | NativeWind (Tailwind pour RN) |
| État serveur | TanStack Query v5 |
| État local | Zustand v5 |
| Formulaires | React Hook Form + Zod |
| Animations | React Native Reanimated |
| Carte | react-native-maps |
| Backend | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| Météo | Open-Meteo API (gratuit, sans clé) |
| Icônes | lucide-react-native |

---

## Prérequis

- Node.js >= 18 (voir `.nvmrc` pour la version exacte utilisée en CI)
- npm
- Expo CLI (`npm install -g @expo/cli`)
- Un projet Supabase (gratuit sur supabase.com)
- iOS : Xcode 15+ (macOS) ou Expo Go
- Android : Android Studio ou Expo Go

---

## Installation

```bash
# Cloner le projet
git clone https://github.com/Pablo5Berriz/biketrip.git
cd biketrip

# Installer les dépendances
npm ci

# Copier le fichier d'environnement
cp .env.example .env
```

---

## Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Aller dans **Settings → API** et copier :
   - `Project URL` → `EXPO_PUBLIC_SUPABASE_URL`
   - `anon public key` → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
3. Remplir ces valeurs dans le fichier `.env`

---

## Variables d'environnement

Voir `.env.example` pour la liste complète et à jour. Ne jamais committer de valeurs réelles ni la `service_role` key côté mobile.

---

## Supabase — migrations, seed et tests RLS

```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter
supabase login

# Lier au projet
supabase link --project-ref ton-project-ref

# Appliquer les migrations
supabase db push
```

Ou via le dashboard Supabase → **SQL Editor** → coller le contenu de chaque fichier dans `supabase/migrations/` (schéma, index, fonctions et politiques RLS sont tous définis dans ces migrations numérotées).

Les tests RLS se trouvent dans `supabase/tests/rls_security.sql` — exécutés localement à ce stade, avec une limite méthodologique documentée dans les rapports d'audit (`docs/audits/`). Non encore intégrés au workflow GitHub Actions.

---

## Lancement local

```bash
npm run start
```

## Lancement iOS

```bash
npm run ios
# ou via Expo Go en scannant le QR code affiché dans le terminal
```

## Lancement Android

```bash
npm run android
# ou via Expo Go
```

## Lancement Web

```bash
npm run web
```

---

## Qualité et CI

```bash
npm run lint         # eslint . --ext .ts,.tsx
npm run type-check   # tsc --noEmit
npm test -- --ci     # jest --ci
```

Le workflow `.github/workflows/ci.yml` exécute `npm ci`, lint, typecheck et tests sur `ubuntu-latest` (Node fixé via `.nvmrc`) à chaque pull request et push sur `master`/`main`. Validation locale complète confirmée ; la première exécution réelle sur GitHub Actions reste à confirmer après publication de la branche.

---

## Structure du projet

```
biketrip/
├── app/                         # Expo Router — navigation et écrans
│   ├── _layout.tsx              # Layout racine
│   ├── index.tsx                # Redirect vers tabs ou onboarding
│   ├── onboarding/               # Écrans d'onboarding
│   ├── auth/                     # Login, register, forgot-password
│   ├── tabs/                     # Navigation principale
│   ├── trails/[id]/               # Détail piste, météo, signalements, avis
│   ├── ride/                     # Démarrer, sortie active, résumé
│   ├── reports/                  # Nouveau signalement, détail
│   ├── favorites/                 # Liste des favoris
│   ├── collections/               # Collections personnelles
│   └── settings/                  # Paramètres, confidentialité, notifs
│
├── src/
│   ├── components/               # Composants réutilisables
│   │   ├── ui/                    # Design system de base (AppButton, AppCard…)
│   │   ├── trails/                 # Cartes et détails de pistes
│   │   ├── reports/                # Signalements
│   │   ├── weather/                # Météo
│   │   └── rides/                  # Suivi de sortie
│   │
│   ├── features/                 # Logique métier par domaine
│   │   ├── auth/                   # Authentication
│   │   ├── trails/                  # Pistes cyclables
│   │   ├── reports/                 # Signalements communautaires
│   │   ├── weather/                  # Météo
│   │   ├── rides/                    # Suivi de sorties
│   │   ├── favorites/                # Favoris
│   │   ├── collections/              # Collections
│   │   ├── advice/                    # Moteur de conseils contextuels
│   │   └── notifications/             # Notifications
│   │
│   ├── lib/
│   │   ├── supabase/               # Client Supabase + helpers
│   │   ├── validations/            # Schémas Zod
│   │   ├── permissions/            # Permissions iOS/Android
│   │   ├── storage/                 # Cache local
│   │   ├── geo/                      # Calculs géographiques (distance, vitesse, dénivelé)
│   │   └── constants/                # Constantes globales
│   │
│   ├── hooks/                     # Hooks React personnalisés
│   ├── stores/                    # Stores Zustand
│   ├── types/                     # Types TypeScript
│   ├── config/                    # Configuration de l'app
│   └── styles/                    # global.css (NativeWind)
│
├── supabase/
│   ├── migrations/                # Migrations SQL numérotées (schéma + RLS)
│   ├── tests/                     # Tests SQL (dont rls_security.sql)
│   └── seed.sql                   # Données de démo
│
└── docs/                          # Documentation technique et rapports d'audit
```

Aucune application d'administration n'est livrée dans l'état actuel du dépôt.

---

## Seed — Données de démo

```bash
# Via Supabase CLI
supabase db reset

# Ou manuellement
psql "postgresql://..." -f supabase/seed.sql
```

Inclut : 1 admin, 1 modérateur, 3 utilisateurs, 10 pistes, 15 signalements, 12 POI, 5 sorties, 3 collections.

---

## Règles de sécurité

- **RLS activé** sur toutes les tables sensibles (définies dans `supabase/migrations/`)
- **Aucune service_role key** côté mobile — jamais
- **SecureStore** pour les tokens, pas AsyncStorage
- **Validation Zod** côté client
- **Permissions** localisation/caméra demandées explicitement
- **Images** compressées et limitées à 5 MB
- Voir `docs/security.md` pour les détails complets

---

## Roadmap

- [ ] Validation du suivi GPS sur appareil physique réel
- [ ] Application d'administration
- [ ] Mode hors ligne avec synchronisation différée
- [ ] Suivi GPS en arrière-plan
- [ ] EAS Build et publication sur les stores
- [ ] Système complet de notifications
- [ ] Modération administrative avancée
- [ ] Intégration Mapbox pour les pistes vectorielles
- [ ] Import/export GPX
- [ ] Mode groupe / sorties collectives

---

## Topics GitHub

cycling, bike-app, route-planner, mobile-app, geolocation, maps, weather, react-native, supabase, fitness

---

## Licence

Propriétaire — BikeTrip © 2025–2026. Tous droits réservés.
