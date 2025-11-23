/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#d6e0ff',
          300: '#b3c5ff',
          400: '#8099ff',
          500: '#667eea',
          600: '#4d5fd1',
          700: '#3b4ab8',
          800: '#2d3a9f',
          900: '#1f2a7a',
        },
      },
    },
  },
  plugins: [],
}

