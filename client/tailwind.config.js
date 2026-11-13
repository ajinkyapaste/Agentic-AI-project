/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        darkBg: '#0a0d1a',
        panelBg: 'rgba(20, 26, 46, 0.65)',
        panelBorder: 'rgba(255, 255, 255, 0.08)',
        accentBlue: '#3b82f6',
        accentTeal: '#10b981',
        accentOrange: '#f97316',
        accentRed: '#ef4444',
        accentPurple: '#8b5cf6',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 10px 30px rgba(0, 0, 0, 0.35)',
        glowBlue: '0 0 20px rgba(59, 130, 246, 0.35)',
        glowTeal: '0 0 20px rgba(16, 185, 129, 0.35)',
      },
    },
  },
  plugins: [],
}

