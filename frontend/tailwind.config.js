/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          DEFAULT: '#FF9933',
          light: '#FFB366',
          dark: '#CC7000',
        },
        maroon: {
          DEFAULT: '#800000',
          light: '#A52A2A',
          dark: '#500000',
        },
        gold: {
          DEFAULT: '#FFD700',
          light: '#FFE44D',
          dark: '#B8860B',
        },
        cream: '#FFFDD0',
        parchment: '#FFFAF0',
        cosmic: {
          bg: '#0F172A',
          surface: '#1E293B',
          text: '#F8FAFC',
          accent: '#818CF8',
        }
      },
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        manrope: ['Manrope', 'sans-serif'],
        rozha: ['Rozha One', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mandala-pattern': "url('/mandala-pattern.svg')",
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #FF9933, 0 0 10px #FF9933' },
          '100%': { boxShadow: '0 0 20px #FF9933, 0 0 30px #FFD700' },
        },
      },
    },
  },
  plugins: [],
}
