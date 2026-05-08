# Design System BikeTrip

## Philosophie

BikeTrip applique un design **Premium Outdoor** : lisible en plein soleil, contrastes élevés, touches de couleurs vives pour les statuts critiques. Chaque décision de design répond à un usage en mouvement, souvent en extérieur avec des mains parfois gantées.

---

## Palette de couleurs

### Primaires

| Token | Valeur | Usage |
|---|---|---|
| `primary.DEFAULT` | `#16A34A` (Velocity Green) | CTA principal, actif, validé |
| `primary.light` | `#4ADE80` | Variante claire, gradients |
| `primary.dark` | `#15803D` | Hover, pressed |
| `secondary.DEFAULT` | `#102A43` (Asphalt Navy) | Textes, fonds sombres |
| `accent.DEFAULT` | `#F97316` (Signal Orange) | Alertes, actions urgentes |

### Fonctionnelles

| Token | Valeur | Usage |
|---|---|---|
| `sky` | `#0EA5E9` | Météo, informationnel |
| `elevation` | `#7C3AED` | Dénivelé, altitude |
| `danger` | `#DC2626` | Erreurs, suppression |
| `warning` | `#F59E0B` | Avertissements |
| `success` | `#22C55E` | Confirmation, succès |

### Neutres

| Token | Valeur | Usage |
|---|---|---|
| `carbon` | `#0F172A` | Titres, textes principaux |
| `slate` | `#64748B` | Textes secondaires |
| `border` | `#E2E8F0` | Bordures, séparateurs |
| `background` | `#F4F8F5` | Fond global (légèrement teinté vert) |

---

## Typographie

BikeTrip utilise la police système par défaut (San Francisco sur iOS, Roboto sur Android) avec une échelle soigneusement définie via NativeWind.

| Classe | Taille | Graisse | Usage |
|---|---|---|---|
| `text-2xl font-black` | 24px / 900 | Titres d'écran |
| `text-xl font-bold` | 20px / 700 | Sous-titres, noms de pistes |
| `text-base font-semibold` | 16px / 600 | Labels importants |
| `text-sm font-medium` | 14px / 500 | Textes courants |
| `text-xs` | 12px / 400 | Métadonnées, badges |

---

## Composants

### AppButton

6 variants adaptés à chaque contexte :

| Variant | Usage | Couleur de fond |
|---|---|---|
| `primary` | Action principale | `#16A34A` |
| `secondary` | Action secondaire | `#102A43` |
| `accent` | Urgence, signalement | `#F97316` |
| `ghost` | Action tertiaire | Transparent + bordure |
| `danger` | Suppression | `#DC2626` |
| `gradient` | CTA premium | Dégradé vert → vert clair |

3 tailles : `sm` (40px), `md` (48px), `lg` (56px)

### AppCard

- `elevated` : ombre portée (`shadowColor: #000`, elevation: 4)
- `bordered` : bordure `border-border` sans ombre
- Padding : `xs`, `sm`, `md`, `lg`
- `pressable` : feedback tactile via `TouchableOpacity`

### AppInput

- Hauteur minimum : 52px (zone de toucher confortable)
- Icône gauche optionnelle
- État erreur : bordure rouge + message sous le champ
- Hint : texte d'aide en dessous
- `isPassword` : toggle visibilité avec Eye/EyeOff

### DifficultyBadge

| Niveau | Couleur | Hex |
|---|---|---|
| EASY | Vert | `#16A34A` |
| MODERATE | Bleu | `#2563EB` |
| HARD | Orange | `#EA580C` |
| EXPERT | Rouge | `#DC2626` |

---

## Iconographie

BikeTrip utilise exclusivement **lucide-react-native** (v0.460.0).

Tailles standards :
- 14px : badges, labels compacts
- 16px : boutons, listes
- 18px : inputs, navigation
- 20–22px : boutons d'action flottants
- 32–44px : états vides, succès

---

## Gradients

| Nom | Couleurs | Usage |
|---|---|---|
| Primary | `#16A34A` → `#4ADE80` | Header auth, bouton gradient |
| Weather Clear | `#FDE68A` → `#F59E0B` | Carte météo ensoleillée |
| Weather Rain | `#93C5FD` → `#3B82F6` | Carte météo pluvieuse |
| Risk LOW | `#22C55E` → `#16A34A` | Bannière risque faible |
| Risk HIGH | `#F97316` → `#DC2626` | Bannière risque élevé |

---

## Espacement & Layout

BikeTrip suit la grille de 4px de Tailwind :
- Padding écran : `px-4` (16px) ou `px-5` (20px)
- Gap entre éléments : `gap-3` (12px) ou `gap-4` (16px)
- Border radius : `rounded-xl` (12px) pour inputs, `rounded-2xl` (16px) pour cartes, `rounded-full` pour badges/boutons circulaires

---

## Ombres

| Classe | Valeur CSS | Usage |
|---|---|---|
| `shadow-card` | `0 2px 8px rgba(0,0,0,0.08)` | Cartes en liste |
| `shadow-float` | `0 4px 16px rgba(0,0,0,0.12)` | Boutons flottants, bottom sheet |
| `shadow-bottom` | `0 -4px 20px rgba(0,0,0,0.1)` | Navigation bas |

---

## SafetyAdviceCard

Ce composant composite affiche le résultat du moteur de conseils :

1. **RiskLevelBanner** : bandeau dégradé avec niveau et icône
2. **Liste d'avis** : chaque conseil avec sévérité colorée et texte explicatif
3. **Checklist** : items obligatoires (rouge) et facultatifs (gris) avec checkbox
4. **Heure de départ suggérée** : bandeau orange si applicable

---

## Principes d'accessibilité

- Contraste minimum WCAG AA sur toutes les combinaisons texte/fond
- Zones de toucher minimum 44×44pt (Apple HIG)
- Messages d'erreur toujours en texte (pas uniquement par couleur)
- `accessible={true}` et `accessibilityLabel` sur les icônes seules
