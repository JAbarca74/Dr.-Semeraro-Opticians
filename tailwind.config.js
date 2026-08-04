/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
        // Grotesca del membrete impreso (sustituta libre de Helvetica Neue).
        marca: ['Archivo', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        // Condensada de los rótulos del expediente en papel (Helvetica Neue
        // Condensed). Se usa en títulos y rótulos del entorno clínico; el texto
        // que escribe el doctor sigue en `sans` para que se lea en pantalla.
        clinico: [
          '"Archivo Narrow"',
          'Archivo',
          '"Helvetica Neue Condensed"',
          '"Arial Narrow"',
          'sans-serif',
        ],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Paleta maestra del sistema (azul profundo + dorado).
        lux: {
          blue: '#021a30',
          gold: '#c19f55',
          'gold-light': '#f7f4ea',
          dark: '#0b1a30',
          cream: '#fcfbf9',
          gray: '#f5f4ef',
          ice: '#f6f9fc',
        },
      },
      letterSpacing: {
        luxe: '0.24em',
        wider2: '0.18em',
      },
      transitionTimingFunction: {
        luxe: 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        revealFadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        'reveal-up': 'revealFadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        shimmer: 'shimmer 2.2s linear infinite',
      },
    },
  },
  plugins: [],
};
