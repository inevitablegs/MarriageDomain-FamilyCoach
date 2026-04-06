/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"DM Serif Display"', 'serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(13,15,26,.06), 0 4px 12px rgba(13,15,26,.04)',
        'card-hover': '0 2px 8px rgba(13,15,26,.08), 0 8px 24px rgba(13,15,26,.07)',
        'card-dark': '0 1px 3px rgba(0,0,0,.4), 0 4px 12px rgba(0,0,0,.3)',
        'glow-indigo': '0 0 24px rgba(99,102,241,.35)',
        'glow-emerald': '0 0 24px rgba(16,185,129,.35)',
        'glow-rose': '0 0 24px rgba(244,63,94,.35)',
      },
      animation: {
        'rise-in': 'riseIn 0.65s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fadeIn 0.45s ease-out both',
        'slide-down': 'slideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 1.4s infinite linear',
      },
      keyframes: {
        riseIn: {
          from: { opacity: '0', transform: 'translateY(18px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.94)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      colors: {
        brand: {
          indigo: '#5b5ef4',
          emerald: '#12b76a',
          rose: '#f43f5e',
        },
      },
    },
  },
  plugins: [],
};