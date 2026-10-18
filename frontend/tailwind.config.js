/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#07070B',
          900: '#0C0C12',
          850: '#101018',
          800: '#14141E',
          700: '#1C1C28',
          600: '#272736',
          500: '#35354A',
        },
        vibe: {
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
        },
        pulse: {
          300: '#F9A8D4',
          400: '#F472B6',
          500: '#EC4899',
        },
        acid: '#D7FF4F',
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Unbounded', 'Manrope', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'vibe-gradient': 'linear-gradient(120deg, #8B5CF6 0%, #EC4899 100%)',
        'vibe-glow':
          'radial-gradient(60% 60% at 50% 0%, rgba(139,92,246,0.35) 0%, rgba(236,72,153,0.15) 45%, transparent 100%)',
      },
      boxShadow: {
        glow: '0 0 60px -15px rgba(139,92,246,0.55)',
        card: '0 24px 60px -30px rgba(0,0,0,0.9)',
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease-out both',
        'pulse-slow': 'pulse 5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
