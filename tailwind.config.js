/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      colors: {
        // Brand teal — refined toward a slightly cooler ocean tone.
        brand: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488', // primary
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
          950: '#042f2e',
        },
      },
      boxShadow: {
        // Soft multi-layer shadow for resting cards.
        card: '0 1px 2px rgba(15,23,42,0.04), 0 2px 6px rgba(15,23,42,0.04)',
        // Slightly stronger lift for hover / emphasis.
        'card-hover':
          '0 2px 6px rgba(15,23,42,0.06), 0 12px 28px rgba(15,23,42,0.08)',
        // Subtle bottom edge for sticky chrome (header, tab nav).
        chrome: '0 1px 0 rgba(15,23,42,0.06)',
      },
      backgroundImage: {
        // Soft gradient used behind the page body.
        'page-grad':
          'radial-gradient(1200px 600px at 50% -200px, rgba(13,148,136,0.06), transparent 60%), linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 240ms ease-out both',
        'typing-dot': 'typingDot 1.2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        typingDot: {
          '0%, 80%, 100%': { opacity: '0.25', transform: 'translateY(0)' },
          '40%':           { opacity: '1',    transform: 'translateY(-2px)' },
        },
      },
    },
  },
  plugins: [],
}
