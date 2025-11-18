/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#4B6BFB',
        accent: '#F97316',
        midnight: '#0F172A',
        sky: '#38BDF8',
      },
      fontFamily: {
        display: ['Poppins', 'Inter', 'system-ui'],
        body: ['Inter', 'system-ui'],
      },
    },
  },
  plugins: [],
}

