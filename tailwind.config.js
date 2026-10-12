// GlamQuote Design System v1.1 — values taken from design/…/react/src/screens/DesignSystem.tsx.
const tokens = require('./src/theme/tokens.json');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  // The app is light-only (design system v1.1 has no dark palette), so never follow the system scheme.
  darkMode: 'class',
  theme: {
    extend: {
      colors: tokens.colors,
      borderRadius: {
        sm: '12px',
        md: '18px',
        lg: '24px',
      },
      // Android needs one family name per weight, so weights are separate families
      // (never combine these with font-bold / italic utilities).
      fontFamily: {
        sans: ['Figtree_400Regular'],
        'sans-medium': ['Figtree_500Medium'],
        'sans-semibold': ['Figtree_600SemiBold'],
        'sans-bold': ['Figtree_700Bold'],
        serif: ['InstrumentSerif_400Regular'],
        'serif-italic': ['InstrumentSerif_400Regular_Italic'],
      },
      fontSize: {
        display: ['40px', { lineHeight: '42px', letterSpacing: '-0.6px' }],
        hero: ['38px', { lineHeight: '40px', letterSpacing: '-0.57px' }],
        'title-xl': ['34px', { lineHeight: '36px', letterSpacing: '-0.5px' }],
        'title-lg': ['30px', { lineHeight: '33px' }],
        headline: ['28px', { lineHeight: '31px' }],
        title: ['25px', { lineHeight: '27px' }],
        step: ['22px', { lineHeight: '24px' }],
        'body-l': ['16px', { lineHeight: '24px' }],
        'body-m': ['15px', { lineHeight: '22px' }],
        'body-s': ['14px', { lineHeight: '20px' }],
        caption: ['13px', { lineHeight: '17px' }],
        overline: ['13px', { lineHeight: '16px', letterSpacing: '1.56px' }],
        'label-l': ['17px', { lineHeight: '22px', letterSpacing: '0.17px' }],
        label: ['16px', { lineHeight: '20px' }],
        'label-s': ['15px', { lineHeight: '20px' }],
        nav: ['13px', { lineHeight: '16px', letterSpacing: '0.13px' }],
      },
    },
  },
  plugins: [],
};
