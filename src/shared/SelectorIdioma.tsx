import { Globe } from 'lucide-react';
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
 * Es un `<select>` nativo y no un menú a medida a propósito: con tres idiomas
 * —y más por venir— el desplegable del sistema ya trae teclado, foco y lectura
 * por accesibilidad resueltos, y en móvil abre la rueda nativa.
 */
export const SelectorIdioma = ({ className }: { className?: string }) => {
  const { idioma, setIdioma, t } = useIdioma();

  return (
    <label
      className={cx(
        'flex items-center gap-1.5 text-[10px] uppercase tracking-widest opacity-70 transition-luxe hover:opacity-100',
        className,
      )}
    >
      <Globe className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} aria-hidden="true" />
      <span className="sr-only">{t('idioma.selector.etiqueta')}</span>
      <select
        value={idioma}
        onChange={(e) => setIdioma(e.target.value as typeof idioma)}
        aria-label={t('idioma.selector.etiqueta')}
        className="cursor-pointer border-none bg-transparent font-mono text-[10px] uppercase tracking-widest text-current outline-none"
      >
        {IDIOMAS.map((i) => (
          <option key={i} value={i} className="text-black">
            {/* Cada idioma se rotula en su propio idioma: quien busca italiano
                busca «Italiano», no «Italiano» traducido a lo que esté activo. */}
            {NOMBRE_IDIOMA[i]}
          </option>
        ))}
      </select>
    </label>
  );
};
