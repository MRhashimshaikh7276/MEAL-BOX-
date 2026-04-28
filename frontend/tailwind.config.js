/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B00',
          50: '#FFF3E8',
          100: '#FFE0C2',
          200: '#FFBF85',
          300: '#FF9E48',
          400: '#FF8020',
          500: '#FF6B00',
          600: '#CC5500',
          700: '#994000',
          800: '#662B00',
          900: '#331500',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'pulse-slow': 'pulse 2s infinite',
        'bounce-once': 'bounce 0.5s ease-out',
      },
      keyframes: {
        slideUp: { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        slideDown: { from: { transform: 'translateY(-100%)' }, to: { transform: 'translateY(0)' } },
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
      }
    }
  },
  plugins: []
}
