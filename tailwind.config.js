/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: ['class'],
  safelist: ['dark'],
  theme: {
    fontFamily: {
      sans: ['Inter', 'sans-serif'],
    },
    extend: {
      spacing: {
        88: '22rem',
      },
      fontFamily: {
        display: 'DM Sans, sans-serif',
      },
      keyframes: {
        fadeInRight: {
          '0%': {
            opacity: '0',
            transform: 'translate(2rem)',
          },
          '100%': {
            opacity: '1',
            transform: 'translate(0)',
          },
        },
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(2rem)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        fadeInDown: {
          '0%': {
            opacity: '0',
            transform: 'translateY(-2rem)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        walletIslandContainerIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        walletIslandContainerOut: {
          '0%': { opacity: '1', transform: 'translateY(0)' },
          '100%': { opacity: '0', transform: 'translateY(-10px)' },
        },
        walletIslandContainerItemIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInFromLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideOutToLeft: {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(-20px)' },
        },
        slideInFromRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideOutToRight: {
          '0%': { opacity: '1', transform: 'translateX(0)' },
          '100%': { opacity: '0', transform: 'translateX(20px)' },
        },
      },
      animation: {
        enterRight: 'fadeInRight 500ms ease-out',
        enterUp: 'fadeInUp 500ms ease-out',
        enterDown: 'fadeInDown 500ms ease-out',
        fadeIn: 'fadeIn 100ms ease-out',
        fadeOut: 'fadeOut 100ms ease-in',
        walletIslandContainerIn: 'walletIslandContainerIn 300ms ease-out',
        walletIslandContainerOut: 'walletIslandContainerOut 300ms forwards',
        walletIslandContainerItem1:
          'walletIslandContainerItemIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1) 100ms forwards',
        walletIslandContainerItem2:
          'walletIslandContainerItemIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1) 130ms forwards',
        walletIslandContainerItem3:
          'walletIslandContainerItemIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1) 160ms forwards',
        walletIslandContainerItem4:
          'walletIslandContainerItemIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1) 190ms forwards',
        slideInFromLeft: 'slideInFromLeft 200ms ease-in forwards',
        slideOutToLeft: 'slideOutToLeft 200ms ease-out forwards',
        slideInFromRight: 'slideInFromRight 200ms ease-in forwards',
        slideOutToRight: 'slideOutToRight 200ms ease-out forwards',
      },
    },
  },
  plugins: [],
};
