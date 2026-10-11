import type { ReactNode } from 'react';
import { cx } from './ui';

/**
 * Ilustraciones SVG animadas del sistema.
 *
 * Todas dibujan con `currentColor`, igual que el búho: heredan la tinta de marca
 * y se aclaran solas en tema oscuro. Son decorativas (`aria-hidden`); el texto
 * que las acompaña es lo que lee un lector de pantalla.
 *
 * El movimiento lo recorta `MotionConfig reducedMotion="user"` (App.tsx) para las
 * de framer-motion y `prefers-reduced-motion` en `index.css` para las de CSS.
 */

/** Trazo que se dibuja con CSS (`animate-trazar`): sin framer-motion, así no pesa ni depende de él. */
const Trazo = ({
  d,
  delay = 0,
  duracion,
  ...rest
}: {
  d: string;
  delay?: number;
  duracion?: number;
} & React.SVGProps<SVGPathElement>) => (
  <path
    d={d}
    pathLength={1}
    strokeDasharray={1}
    className="animate-trazar"
    style={{
      animationDelay: `${delay}s`,
      animationDuration: duracion ? `${duracion}s` : undefined,
    }}
    {...rest}
  />
);

const Aro = ({ cx: x, delay }: { cx: number; delay: number }) => (
  <circle
    cx={x}
    cy="30"
    r="15"
    pathLength={1}
    strokeDasharray={1}
    className="animate-trazar"
    style={{ animationDelay: `${delay}s`, animationDuration: '0.9s' }}
  />
);

// ── Spinner de lentes ────────────────────────────────────────────────────────
/** Dos aros de anteojos; un arco gira sobre cada uno. Sustituye a los spinners genéricos. */
export const SpinnerLentes = ({
  className = 'h-5 w-9',
}: {
  className?: string;
}) => (
  <svg
    viewBox="0 0 44 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden="true"
    data-testid="spinner-lentes"
  >
    {[11, 33].map((cx0) => (
      <g key={cx0}>
        <circle cx={cx0} cy="12" r="8.5" opacity="0.25" />
        <circle
          cx={cx0}
          cy="12"
          r="8.5"
          strokeLinecap="round"
          strokeDasharray="14 40"
          className="origin-center animate-spin [transform-box:fill-box]"
          style={{ animationDuration: '1.1s' }}
        />
      </g>
    ))}
    <path
      d="M19.5 11 C21.5 9.5 22.5 9.5 24.5 11"
      strokeLinecap="round"
      opacity="0.5"
    />
  </svg>
);

/** Spinner con su rótulo, para los estados "Cargando…" que antes eran solo texto. */
export const Cargando = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <span
    role="status"
    className={cx('inline-flex items-center gap-3 text-lux-tinta', className)}
  >
    <SpinnerLentes />
    <span className="text-sm text-neutral-500 dark:text-neutral-400">
      {children}
    </span>
  </span>
);

// ── Estado vacío ─────────────────────────────────────────────────────────────
/** Anteojos que se dibujan al aparecer y flotan apenas. Para listas sin datos. */
export const IlustracionLentes = ({
  className = 'h-14 w-24',
}: {
  className?: string;
}) => (
  <svg
    viewBox="0 0 96 56"
    className={cx('animate-flotar', className)}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    aria-hidden="true"
    data-testid="ilustracion-lentes"
  >
    {['M4 20 L10 18', 'M92 20 L86 18', 'M40 22 C45 18 51 18 56 22'].map((d) => (
      <Trazo key={d} d={d} delay={0.5} />
    ))}
    <Aro cx={26} delay={0} />
    <Aro cx={70} delay={0.15} />
    {/* Brillo que cruza los cristales. */}
    {[26, 70].map((x) => (
      <path key={x} d={`M${x - 7} 26 L${x - 2} 21`} opacity="0.45" />
    ))}
  </svg>
);

/** Bloque de "no hay nada que mostrar": ilustración + el texto que ya existía. */
export const EstadoVacio = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={cx('flex flex-col items-center gap-4 text-lux-tinta', className)}
    data-testid="estado-vacio"
  >
    <IlustracionLentes />
    <p className="text-sm text-neutral-500 dark:text-neutral-400">{children}</p>
  </div>
);

// ── Sello de verificación ────────────────────────────────────────────────────
/**
 * Círculo que se traza y luego la marca (✓ o ✗). Se usa al validar una receta:
 * el movimiento acompaña al resultado, no lo sustituye (el texto sigue ahí).
 */
export const SelloVerificacion = ({
  valido,
  className = 'h-9 w-9',
}: {
  valido: boolean;
  className?: string;
}) => (
  <svg
    viewBox="0 0 36 36"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    data-testid={valido ? 'sello-valido' : 'sello-invalido'}
  >
    <circle
      cx="18"
      cy="18"
      r="15"
      pathLength={1}
      strokeDasharray={1}
      className="animate-trazar"
      style={{ animationDuration: '0.6s' }}
    />
    {(valido
      ? ['M10.5 18.5 L16 24 L26 12.5']
      : ['M12 12 L24 24', 'M24 12 L12 24']
    ).map((d, i) => (
      <Trazo key={d} d={d} delay={0.5 + i * 0.12} duracion={0.4} />
    ))}
  </svg>
);

// ── Etapa de una línea de tiempo ─────────────────────────────────────────────
/** Barra de una etapa: se rellena de izquierda a derecha, escalonada por `indice`. */
export const BarraEtapa = ({
  alcanzada,
  indice,
}: {
  alcanzada: boolean;
  indice: number;
}) => (
  <span
    className="relative block h-1 overflow-hidden bg-neutral-200 dark:bg-neutral-800"
    data-testid="barra-etapa"
    data-alcanzada={alcanzada}
  >
    {alcanzada ? (
      <span
        className="absolute inset-0 origin-left animate-llenar bg-lux-tinta"
        style={{ animationDelay: `${0.15 * indice}s` }}
      />
    ) : null}
  </span>
);

// ── Confirmación de una acción ───────────────────────────────────────────────
/** Banner de éxito (venta cobrada, orden actualizada…): el ✓ se traza al aparecer. */
export const Exito = ({ children }: { children: ReactNode }) => (
  <p
    role="status"
    className="flex items-center gap-2.5 border border-emerald-300/40 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-300"
  >
    <SelloVerificacion valido className="h-5 w-5 shrink-0" />
    <span>{children}</span>
  </p>
);
