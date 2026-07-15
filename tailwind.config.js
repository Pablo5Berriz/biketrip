/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // --- Palette principale BikeTrip ---
        primary: {
          DEFAULT: '#16A34A',  // Velocity Green
          50:  '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },
        secondary: {
          DEFAULT: '#102A43',  // Asphalt Navy
          50:  '#E8F0F7',
          100: '#C5D7E8',
          200: '#8EB3D0',
          300: '#5A8EB8',
          400: '#2D6FA5',
          500: '#1A4F82',
          600: '#102A43',
          700: '#0C2035',
          800: '#081628',
          900: '#040C1A',
        },
        accent: {
          DEFAULT: '#F97316',  // Signal Orange
          50:  '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
          700: '#C2410C',
          800: '#9A3412',
          900: '#7C2D12',
        },
        sky: {
          DEFAULT: '#0EA5E9',  // Sky Blue (météo)
          500: '#0EA5E9',
          600: '#0284C7',
        },
        elevation: {
          DEFAULT: '#7C3AED',  // Elevation Purple (dénivelé)
          500: '#7C3AED',
          600: '#6D28D9',
        },
        // --- Fonds ---
        trail: {
          mist: '#F4F8F5',    // fond principal clair
        },
        // --- États ---
        danger: {
          DEFAULT: '#DC2626',
          light: '#FEF2F2',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FFFBEB',
        },
        success: {
          DEFAULT: '#22C55E',
          light: '#F0FDF4',
        },
        // --- Texte ---
        carbon: '#111827',     // Carbon Black
        slate: '#64748B',      // Slate Gray
        border: '#E2E8F0',     // Soft Line
        // --- Dark mode ---
        dark: {
          bg:       '#07111F',
          surface:  '#0F172A',
          elevated: '#1E293B',
          text:     '#F8FAFC',
          muted:    '#94A3B8',
          border:   '#334155',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'System'],
        display: ['Inter', 'System'],
      },
      fontSize: {
        'display': ['32px', { lineHeight: '40px', fontWeight: '700' }],
        'title':   ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'card':    ['18px', { lineHeight: '26px', fontWeight: '600' }],
        'body':    ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'small':   ['13px', { lineHeight: '18px', fontWeight: '400' }],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
        'full': '9999px',
      },
      boxShadow: {
        'card': '0 2px 12px rgba(16, 42, 67, 0.08)',
        'float': '0 8px 32px rgba(16, 42, 67, 0.12)',
        'bottom': '0 -4px 16px rgba(16, 42, 67, 0.06)',
      },
    },
  },
  plugins: [],
};
