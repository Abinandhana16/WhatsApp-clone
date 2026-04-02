/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        'wa-green': '#25D366',
        'wa-teal': '#128C7E',
        'wa-dark-teal': '#075E54',
        'wa-light-green': '#DCF8C6',
        'wa-blue': '#34B7F1',
        // Light Mode
        'wa-bg-light': '#f0f2f5',
        'wa-sidebar-bg': '#ffffff',
        'wa-header-bg': '#f0f2f5',
        'wa-panel-bg': '#f0f2f5',
        'wa-bubble-me': '#dcf8c6',
        'wa-bubble-other': '#ffffff',
        // Dark Mode 
        'wa-bg-dark': '#0b141a',
        'wa-sidebar-dark': '#111b21',
        'wa-header-dark': '#202d33',
        'wa-panel-dark': '#0b141a',
        'wa-bubble-me-dark': '#005c4b',
        'wa-bubble-other-dark': '#202d33',
        'wa-text-primary-dark': '#e9edef',
        'wa-text-secondary-dark': '#8696a0',
        'wa-border-dark': '#222d34',
      },
      keyframes: {
        'badge-pop': {
          '0%':   { transform: 'scale(0)', opacity: '0' },
          '70%':  { transform: 'scale(1.25)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        }
      },
      animation: {
        'badge-pop': 'badge-pop 0.3s cubic-bezier(0.34,1.56,0.64,1) both'
      },
    },
  },
  plugins: [],
}
