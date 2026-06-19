/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#FAF7F2',
          100: '#F2EDE4',
          200: '#E2D8C6',
          900: '#1A1B3A',
          950: '#0E0E22',
        },
        iris: {
          50: '#F3F0FF',
          100: '#E5DEFF',
          300: '#B8A6FF',
          500: '#7C5CFF',
          600: '#6747F0',
          700: '#5335D1',
        },
        rose: {
          300: '#FFB8C8',
          400: '#FF8FB1',
          500: '#FF6B96',
        },
        peach: {
          300: '#FFD3B6',
          400: '#FFB088',
          500: '#FF945A',
        },
        mint: {
          400: '#6FE7B8',
          500: '#3DD49A',
        },
        coral: {
          400: '#FF8585',
          500: '#FF6B6B',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', '"Source Han Serif SC"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', '"Source Han Sans SC"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft': '0 8px 30px -8px rgba(124, 92, 255, 0.15)',
        'glow': '0 0 40px -10px rgba(124, 92, 255, 0.4)',
        'card': '0 4px 20px -4px rgba(26, 27, 58, 0.08)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'breathe': 'breathe 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(3deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
};
