/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#E0F7FF',
          100: '#B3ECFF',
          200: '#80DEFF',
          300: '#4DD0F5',
          400: '#26C4EE',
          500: '#29B6F6',
          600: '#039BE5',
          700: '#0288D1',
          800: '#0277BD',
          900: '#01579B',
        },
        teal: { 400: '#26C6DA', 500: '#00BCD4', 600: '#00ACC1' },
        surface: { bg: '#F0F4F8', card: '#FFFFFF', nav: '#FFFFFF' },
        ink: { primary: '#1A2340', secondary: '#5A6A85', muted: '#9AA5B8', light: '#C4CDD9' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: {
        card:         '0 2px 12px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 20px rgba(0,0,0,0.10)',
        nav:          '0 -1px 0 rgba(0,0,0,0.06), 0 -2px 8px rgba(0,0,0,0.04)',
        top:          '0 1px 0 rgba(0,0,0,0.06), 0 2px 8px rgba(0,0,0,0.04)',
        topnav:       '0 2px 16px rgba(0,0,0,0.08)',
      },
      borderRadius: { card: '16px', pill: '50px', badge: '8px' },
      spacing: { sidebar: '0px' }, // not used — desktop uses top nav
      animation: {
        'fade-up':  'fadeUp 0.3s ease-out',
        'fade-in':  'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.25s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeUp:  { '0%': { opacity:'0', transform:'translateY(10px)' }, '100%': { opacity:'1', transform:'translateY(0)' } },
        fadeIn:  { '0%': { opacity:'0' }, '100%': { opacity:'1' } },
        slideIn: { '0%': { opacity:'0', transform:'translateX(-10px)' }, '100%': { opacity:'1', transform:'translateX(0)' } },
        scaleIn: { '0%': { opacity:'0', transform:'scale(0.95)' }, '100%': { opacity:'1', transform:'scale(1)' } },
      },
      maxWidth: { mobile: "480px" , app: '1280px' },
    },
  },
  safelist: ['grid-cols-3','grid-cols-4','grid-cols-5'],
  plugins: [],
};
