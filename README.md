# 🚴 BikeTrip

**BikeTrip** est une application mobile premium pour les cyclistes. Elle combine itinéraires cyclables, météo intelligente, signalements communautaires, conseils contextuels et suivi de sorties dans une expérience moderne et fluide.

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

- Node.js >= 18
- npm ou yarn
- Expo CLI (`npm install -g @expo/cli`)
- Un projet Supabase (gratuit sur supabase.com)
- iOS : Xcode 15+ (macOS) ou Expo Go
- Android : Android Studio ou Expo Go

---

## Installation

```bash
# Cloner le projet
git clone https://github.com/ton-compte/bike-trip.git
cd bike-trip

# Installer les dépendances
npm install

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

```bash
# .env
EXPO_PUBLIC_SUPABASE_URL=https://ton-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=ta-cle-anon-publique
EXPO_PUBLIC_APP_ENV=development
```

Voir `.env.example` pour la liste complète.

---

## Migrations Supabase

```bash
# Installer Supabase CLI
npm install -g supabase

# Se connecter
supabase login

# Lier au projet
supabase link --project-ref ton-project-ref

# Appliquer les migrations
supabase db push

# Optionnel : charger les données de démo
supabase db reset --db-url "postgresql://..." < supabase/seed.sql
```

Ou via le dashboard Supabase → **SQL Editor** → coller le contenu de chaque fichier dans `supabase/migrations/`.

---

## Lancement local

```bash
# Démarrer avec Expo
npm start

# Ou directement iOS/Android
npm run ios
npm run android
```

---

## Lancement iOS

```bash
# Avec simulateur Xcode
npm run ios

# Ou sur appareil physique via Expo Go
# Scanner le QR code affiché dans le terminal
```

---

## Lancement Android

```bash
# Avec émulateur Android Studio
npm run android

# Ou sur appareil physique via Expo Go
```

---

## Structure du projet

```
bike-trip/
├── app/                        # Expo Router — navigation et écrans
│   ├── _layout.tsx             # Layout racine
│   ├── index.tsx               # Redirect vers tabs ou onboarding
│   ├── onboarding/             # 4 écrans d'onboarding
│   ├── auth/                   # Login, register, forgot-password
│   ├── tabs/                   # Navigation principale (5 onglets)
│   ├── trails/[id]/            # Détail piste, météo, signalements, avis
│   ├── ride/                   # Démarrer, sortie active, résumé
│   ├── reports/                # Nouveau signalement, détail
│   ├── favorites/              # Liste des favoris
│   ├── collections/            # Collections personnelles
│   ├── settings/               # Paramètres, confidentialité, notifs
│   └── admin/                  # Dashboard admin (ADMIN+ seulement)
│
├── src/
│   ├── components/             # Composants réutilisables
│   │   ├── ui/                 # Design system de base (AppButton, AppCard…)
│   │   ├── map/                # Composants carte
│   │   ├── trails/             # Cartes et détails de pistes
│   │   ├── reports/            # Signalements
│   │   ├── weather/            # Météo
│   │   ├── rides/              # Suivi de sortie
│   │   └── forms/              # Composants formulaire
│   │
│   ├── features/               # Logique métier par domaine
│   │   ├── auth/               # Authentication
│   │   ├── trails/             # Pistes cyclables
│   │   ├── reports/            # Signalements communautaires
│   │   ├── weather/            # Météo + conseils
│   │   ├── rides/              # Suivi de sorties
│   │   ├── favorites/          # Favoris
│   │   ├── collections/        # Collections
│   │   ├── advice/             # Moteur de conseils contextuels
│   │   └── notifications/      # Push notifications
│   │
│   ├── lib/
│   │   ├── supabase/           # Client Supabase + helpers
│   │   ├── validations/        # Schémas Zod
│   │   ├── permissions/        # Permissions iOS/Android
│   │   ├── security/           # Sécurité, sanitization
│   │   ├── storage/            # Cache local, SecureStore
│   │   ├── geo/                # Calculs géographiques
│   │   ├── utils/              # Utilitaires divers
│   │   └── constants/          # Constantes globales
│   │
│   ├── hooks/                  # Hooks React personnalisés
│   ├── stores/                 # Stores Zustand
│   ├── types/                  # Types TypeScript
│   ├── config/                 # Configuration de l'app
│   └── styles/                 # global.css (NativeWind)
│
├── supabase/
│   ├── migrations/             # Migrations SQL numérotées
│   ├── policies/               # Règles RLS documentées
│   └── seed.sql                # Données de démo
│
├── assets/                     # Images, icônes
└── docs/                       # Documentation technique
```

---

## Seed — Données de démo

```bash
# Via Supabase CLI
supabase db reset

# Ou manuellement
psql "postgresql://..." -f supabase/seed.sql
```

Inclut : 1 admin, 1 modérateur, 3 utilisateurs, 10 pistes, 15 signalements, 20 POI, 5 sorties, 3 collections.

---

## Règles de sécurité

- **RLS activé** sur toutes les tables sensibles
- **Aucune service_role key** côté mobile — jamais
- **SecureStore** pour les tokens, pas AsyncStorage
- **Validation Zod** côté client ET serveur (Edge Functions)
- **Permissions** localisation/caméra demandées explicitement
- **Images** compressées et limitées à 5 MB
- **Rate limiting** via Supabase RLS + Edge Functions
- Voir `docs/security.md` pour les détails complets

---

## Prochaines étapes (V2)

- [ ] Mode hors ligne complet avec synchronisation différée
- [ ] Intégration Mapbox pour les pistes vectorielles
- [ ] Moteur de recommandations IA (profil utilisateur)
- [ ] Import/export GPX
- [ ] Widget iOS / Android (météo + prochaine sortie)
- [ ] Apple Watch / WearOS companion
- [ ] Mode groupe / sorties collectives
- [ ] Gamification (badges, défis, classements)
- [ ] API publique pour partenaires
- [ ] Version SaaS B2B (communes, offices de tourisme)

---

## Licence

Propriétaire — BikeTrip © 2025. Tous droits réservés.
