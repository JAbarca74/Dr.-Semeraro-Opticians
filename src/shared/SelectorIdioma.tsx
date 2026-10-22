import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useIdioma } from '../core/i18n/idioma.context';
import { IDIOMAS, NOMBRE_IDIOMA } from '../core/i18n/idioma';
import { cx } from './ui';

/**
 * Selector de idioma (`DSO-53`).
 *
 * Sustituye al `ES / EN` que había en `LoginPage`, `AdminLayout` y
 * `ReceptionLayout`, que **era un `<span>` de adorno**: texto fijo, sin
 * `onClick` ni estado. Prometía un cambio de idioma que no existía, y por eso
 * en el proyecto se daba por hecho que la aplicación ya tenía inglés.
 *
 * Era un `<select>` nativo, pero **la lista desplegada la pinta el sistema
 * operativo y no admite estilos**: salía azul de Windows, con otra tipografía,
 * fuera de la identidad del sitio. Ahora es un menú propio siguiendo el patrón
 * WAI-ARIA «select-only combobox»: botón `combobox` + `listbox` de `option`,
 * con teclado (↑ ↓ Inicio Fin Enter Espacio Esc) y foco que vuelve al botón.
 */
export const SelectorIdioma = ({ className }: { className?: string }) => {
  const { idioma, setIdioma, t } = useIdioma();
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const idLista = useId();

  // Cerrar al hacer clic fuera.
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (!raiz.current?.contains(e.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', fuera);
    return () => document.removeEventListener('mousedown', fuera);
  }, [abierto]);

  const abrir = () => {
    setActivo(Math.max(0, IDIOMAS.indexOf(idioma)));
    setAbierto(true);
  };

  const elegir = (i: (typeof IDIOMAS)[number]) => {
    setIdioma(i);
    setAbierto(false);
    boton.current?.focus();
  };

  const alTeclear = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!abierto) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault();
        abrir();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActivo((a) => (a + 1) % IDIOMAS.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActivo((a) => (a - 1 + IDIOMAS.length) % IDIOMAS.length);
        break;
      case 'Home':
        e.preventDefault();
        setActivo(0);
        break;
      case 'End':
        e.preventDefault();
        setActivo(IDIOMAS.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        elegir(IDIOMAS[activo]);
        break;
      case 'Escape':
        e.preventDefault();
        setAbierto(false);
        break;
      case 'Tab':
        setAbierto(false);
        break;
    }
  };

  return (
    <div ref={raiz} className={cx('relative', className)}>
      <button
        ref={boton}
        type="button"
        role="combobox"
        aria-label={t('idioma.selector.etiqueta')}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-controls={idLista}
        aria-activedescendant={
          abierto ? `${idLista}-${IDIOMAS[activo]}` : undefined
        }
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        onKeyDown={alTeclear}
        className="transition-luxe flex cursor-pointer items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest opacity-70 outline-hidden hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-lux-tinta"
      >
        <Globe
          className="h-3.5 w-3.5 shrink-0"
          strokeWidth={1.6}
          aria-hidden="true"
        />
        <span>{NOMBRE_IDIOMA[idioma]}</span>
        <ChevronDown
          className={cx(
            'h-3 w-3 shrink-0 transition-transform',
            abierto && 'rotate-180',
          )}
          strokeWidth={1.8}
          aria-hidden="true"
        />
      </button>

      {abierto ? (
        <ul
          id={idLista}
          role="listbox"
          aria-label={t('idioma.selector.etiqueta')}
          className="absolute right-0 top-full z-50 mt-2 min-w-36 animate-desplegar border border-neutral-200 bg-white py-1 text-lux-blue shadow-xl dark:border-white/10 dark:bg-[#0f0f11] dark:text-white"
        >
          {IDIOMAS.map((i, n) => {
            const elegido = i === idioma;
            return (
              <li
                key={i}
                id={`${idLista}-${i}`}
                role="option"
                aria-selected={elegido}
                onMouseEnter={() => setActivo(n)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => elegir(i)}
                className={cx(
                  'transition-luxe flex cursor-pointer items-center justify-between gap-4 px-3.5 py-2 font-mono text-[10px] uppercase tracking-widest',
                  n === activo && 'bg-lux-tinta/10',
                  elegido && 'font-bold text-lux-tinta',
                )}
              >
                {/* Cada idioma se rotula en su propio idioma: quien busca italiano
                    busca «Italiano», no «Italiano» traducido a lo que esté activo. */}
                {NOMBRE_IDIOMA[i]}
                {elegido ? (
                  <Check
                    className="h-3 w-3"
                    strokeWidth={2.2}
                    aria-hidden="true"
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
};
