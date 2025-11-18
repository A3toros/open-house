/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "!./node_modules/**",
  ],
  theme: {
    extend: {
      colors: {
        // Primary colors from global.css
        primary: {
          50: '#eff6ff',
          100: '#dbeafe', 
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#6366f1', // --primary-color
          600: '#4f46e5', // --primary-dark
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          light: '#a5b4fc', // --primary-light
        },
        // Secondary colors
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b', // --secondary-color
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Success colors
        success: {
          50: '#ecfdf5',
          100: '#d1fae5', // --success-light
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // --success-color
          600: '#059669', // --success-dark
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // Warning colors
        warning: {
          50: '#fffbeb',
          100: '#fef3c7', // --warning-light
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // --warning-color
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        // Error colors
        error: {
          50: '#fef2f2',
          100: '#fee2e2', // --error-light
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444', // --error-color
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        // Neutral colors
        neutral: {
          50: '#f8fafc', // --neutral-50
          100: '#f1f5f9', // --neutral-100
          200: '#e2e8f0', // --neutral-200
          300: '#cbd5e1', // --neutral-300
          400: '#94a3b8', // --neutral-400
          500: '#64748b', // --neutral-500
          600: '#475569', // --neutral-600
          700: '#334155', // --neutral-700
          800: '#1e293b', // --neutral-800
          900: '#0f172a', // --neutral-900
          light: '#f8f9fa', // --neutral-light
          dark: '#6c757d', // --neutral-dark
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Open Sans', 'Helvetica Neue', 'sans-serif'],
      },
      fontSize: {
        'xs': '0.75rem', // --text-xs
        'sm': '0.875rem', // --text-sm
        'base': '1rem', // --text-base
        'lg': '1.125rem', // --text-lg
        'xl': '1.25rem', // --text-xl
        '2xl': '1.5rem', // --text-2xl
        '3xl': '1.875rem', // --text-3xl
        '4xl': '2.25rem', // --text-4xl
      },
      spacing: {
        'xs': '0.5rem', // --space-xs
        'sm': '0.75rem', // --space-sm
        'md': '1rem', // --space-md
        'lg': '1.5rem', // --space-lg
        'xl': '2rem', // --space-xl
        '2xl': '3rem', // --space-2xl
      },
      borderRadius: {
        'sm': '8px', // --border-radius-sm
        'DEFAULT': '12px', // --border-radius
        'lg': '16px', // --border-radius-lg
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)', // --shadow-sm
        'DEFAULT': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // --shadow
        'md': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)', // --shadow-md
        'lg': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', // --shadow-lg
        'xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)', // --shadow-xl
      },
      transitionDuration: {
        'fast': '150ms', // --transition-fast
        'DEFAULT': '300ms', // --transition
        'slow': '500ms', // --transition-slow
      },
      transitionTimingFunction: {
        'DEFAULT': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
