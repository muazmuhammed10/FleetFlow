/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        navy: {
          50: '#f0f4ff',
          100: '#e0e8ff',
          200: '#c7d7fe',
          300: '#a4bbfd',
          400: '#7d96fb',
          500: '#5c6ef5',
          600: '#3e4eea',
          700: '#2f3cd8',
          800: '#2732ae',
          900: '#1c2470',
          950: '#111540',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
