/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#f3f5f9',
        topnav: '#4b566b',
        'topnav-dark': '#3a4456',
        primary: '#f77c61',
        'primary-dark': '#f66a4d',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};