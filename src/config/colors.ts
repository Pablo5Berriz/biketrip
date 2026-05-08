// ============================================================
// Palette couleurs BikeTrip — référence TypeScript
// ============================================================

export const colors = {
  // Velocity Green — actions, trajets actifs
  primary: {
    DEFAULT: '#16A34A',
    50:  '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0',
    500: '#22C55E',
    600: '#16A34A',
    700: '#15803D',
  },
  // Asphalt Navy — textes forts, navigation
  secondary: {
    DEFAULT: '#102A43',
    600: '#102A43',
    700: '#0C2035',
  },
  // Signal Orange — alertes, signalements
  accent: {
    DEFAULT: '#F97316',
    500: '#F97316',
  },
  // Sky Blue — météo
  sky: '#0EA5E9',
  // Elevation Purple — dénivelé, effort
  elevation: '#7C3AED',
  // Fonds
  background: '#F4F8F5',
  surface: '#FFFFFF',
  // États
  danger:  '#DC2626',
  warning: '#F59E0B',
  success: '#22C55E',
  // Texte
  carbon: '#111827',
  textPrimary:   '#111827',
  textSecondary: '#64748B',
  slate: '#64748B',
  placeholder: '#94A3B8',
  border: '#E2E8F0',
  // Dark mode
  dark: {
    background: '#07111F',
    surface:    '#0F172A',
    elevated:   '#1E293B',
    text:       '#F8FAFC',
    muted:      '#94A3B8',
    border:     '#334155',
  },
} as const;

// Gradients
export const gradients = {
  primary:   ['#16A34A', '#0EA5E9', '#102A43'] as const,
  report:    ['#F97316', '#DC2626'] as const,
  weather:   ['#0EA5E9', '#38BDF8'] as const,
  elevation: ['#7C3AED', '#16A34A'] as const,
};
