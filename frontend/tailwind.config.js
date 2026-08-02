/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        sovereign: {
          50: '#f0f5ff',
          100: '#e0ebff',
          200: '#b8d4ff',
          300: '#7ab3ff',
          400: '#3a8dff',
          500: '#0066ff',
          600: '#0052cc',
          700: '#003d99',
          800: '#002966',
          900: '#001433',
          950: '#000a1a',
        },
        nexus: {
          gold: '#ffd700',
          amber: '#ffbf00',
          dark: '#0a0a0f',
          darker: '#050508',
          panel: '#0d0d14',
          border: '#1a1a2e',
          glow: '#00ff88',
          void: '#7b2fff',
          celestial: '#00d4ff',
          forge: '#ff6b35',
        }
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 255, 136, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(0, 255, 136, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
