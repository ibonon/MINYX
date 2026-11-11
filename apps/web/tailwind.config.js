/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-jakarta)', 'Inter', 'sans-serif'],
        cinzel: ['var(--font-cinzel)', 'serif'],
        mono: ['var(--font-share-tech)', 'monospace'],
        'share-tech': ['var(--font-share-tech)', 'monospace'],
      },
      colors: {
        minyx: {
          dark: '#020617', // slate-950
          cyan: '#22d3ee', // cyan-400
          accent: '#06b6d4',
          neon: '#00f0ff',
        },
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s infinite ease-in-out',
        'float-slow': 'floatSlow 4s infinite ease-in-out',
        'spin-slow': 'spin 12s linear infinite',
        'spin-reverse': 'spinReverse 16s linear infinite',
        'ripple': 'ripple 3s cubic-bezier(0, 0.2, 0.8, 1) infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        spinReverse: {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        ripple: {
          '0%': { transform: 'scale(0.8)', opacity: '1' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
