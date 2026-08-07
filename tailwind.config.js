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
        // Paleta maestra del sistema (azul profundo + la tinta del impreso).
        lux: {
          blue: '#021a30',
          // Azul de marca de la óptica: **`#3c497d`**, fijado por el cliente el
          // 2026-08-06. Es el mismo tono de la tinta del expediente impreso
          // pero más saturado y luminoso: la medición sobre la fotografía daba
          // `#33405F` (hsl 222, 30 %, 29 %) y se leía casi negro en pantalla.
          // Ver `.contexto/Imagenes/IDENTIDAD-PAPELERIA.md` §3.1.
          //
          // Se resuelve por variable CSS (canales RGB, para que sigan
          // funcionando los modificadores de opacidad tipo `bg-lux-tinta/15`):
          // en tema claro vale el azul de marca y en oscuro se aclara solo. Es
          // el mismo recurso del isotipo, que se adapta vía `currentColor`, y
          // evita tener que duplicar cada uso con una variante `dark:`.
          tinta: 'rgb(var(--lux-tinta) / <alpha-value>)',
          // El mismo azul subido a 72 % de luminosidad, conservando hue (228°)
          // y saturación (35 %). Es el acento sobre fondos oscuros. Contraste
          // 8.6:1 sobre `#0a0a0a`. Es un valor **fijo**: se usa donde el fondo
          // es oscuro en los dos temas (el hero del panel), donde `lux.tinta`
          // no serviría porque en tema claro se resolvería al azul oscuro.
          'tinta-claro': '#9FA9D1',
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
