import { motion } from 'framer-motion';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Kit de componentes UI de Óptica Dr. Luigi Semeraro
 * (editorial, sobrio, con acentos en la tinta del impreso y microinteracciones).
 */

const cx = (...classes: Array<string | false | null | undefined>): string =>
  classes.filter(Boolean).join(' ');

// ── Animaciones reutilizables ────────────────────────────────────────────────
export const fadeUp = {
  initial: { opacity: 0, y: 16, filter: 'blur(3px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
};

export const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

export const fadeUpItem = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] as const },
};

// ── Kicker (rótulo de acento en mayúsculas) ──────────────────────────────────
export const Kicker = ({ children }: { children: ReactNode }) => (
  <span className="block text-[10px] font-bold uppercase tracking-[0.25em] text-lux-tinta">
    {children}
  </span>
);

// ── Encabezado de sección editorial ──────────────────────────────────────────
interface SectionHeaderProps {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  /**
   * Clases del `<h1>`. Solo para el entorno clínico, que usa la grotesca
   * condensada del expediente impreso en vez de la serif del resto del sistema.
   */
  titleClassName?: string;
}

export const SectionHeader = ({
  kicker,
  title,
  description,
  actions,
  titleClassName,
}: SectionHeaderProps) => (
  <motion.header
    {...fadeUp}
    className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
  >
    <div className="space-y-2">
      {kicker ? <Kicker>{kicker}</Kicker> : null}
      <h1
        className={cx(
          'text-3xl leading-none tracking-tight text-lux-blue dark:text-white md:text-4xl',
          titleClassName ?? 'font-serif italic',
        )}
      >
        {title}
      </h1>
      {description ? (
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          {description}
        </p>
      ) : null}
    </div>
    {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
  </motion.header>
);

// ── Tarjeta base ─────────────────────────────────────────────────────────────
interface LuxCardProps extends ComponentPropsWithoutRef<'div'> {
  hover?: boolean;
}

export const LuxCard = ({
  hover = false,
  className,
  children,
  ...rest
}: LuxCardProps) => (
  <div
    className={cx(
      'transition-luxe border bg-white dark:bg-[#0f0f11]',
      'border-neutral-200/80 dark:border-white/10',
      hover && 'hover:-translate-y-1 hover:border-lux-tinta hover:shadow-xl',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
);

// ── Botón ────────────────────────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'tinta' | 'ghost' | 'danger';

interface LuxButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-lux-blue text-white hover:bg-lux-tinta hover:text-white dark:bg-lux-tinta-claro dark:text-black dark:hover:bg-white dark:hover:text-black',
  // El relleno pasó de dorado a la tinta del impreso, así que el rótulo va en
  // blanco: sobre `lux.tinta` el texto negro se quedaba en 1.6:1.
  tinta: 'bg-lux-tinta text-white hover:bg-lux-blue hover:text-white',
  ghost:
    'border border-lux-blue text-lux-blue hover:bg-lux-blue hover:text-white dark:border-lux-tinta-claro dark:text-lux-tinta-claro dark:hover:bg-lux-tinta-claro dark:hover:text-black',
  danger:
    'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40',
};

export const LuxButton = ({
  variant = 'primary',
  className,
  children,
  ...rest
}: LuxButtonProps) => (
  <button
    className={cx(
      'transition-luxe inline-flex cursor-pointer items-center justify-center gap-2',
      'px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em]',
      'disabled:cursor-not-allowed disabled:opacity-50',
      VARIANTS[variant],
      className,
    )}
    {...rest}
  >
    {children}
  </button>
);

// ── Campo de formulario ──────────────────────────────────────────────────────
export const fieldLabelClass =
  'block text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400';

export const fieldInputClass =
  'transition-luxe mt-1.5 w-full border bg-[#fdfdfc] px-3.5 py-2.5 text-sm text-neutral-900 ' +
  'border-neutral-200 placeholder-neutral-400 focus:border-lux-blue focus:outline-none focus:ring-1 focus:ring-lux-tinta ' +
  'dark:bg-[#18181a] dark:text-white dark:border-white/10 dark:placeholder-neutral-600 dark:focus:border-lux-tinta-claro';

// ── Etiqueta de estado (badge) ───────────────────────────────────────────────
interface BadgeProps {
  children: ReactNode;
  tone?: 'tinta' | 'green' | 'red' | 'blue' | 'neutral';
}

const BADGE_TONES: Record<NonNullable<BadgeProps['tone']>, string> = {
  // Sin variante `dark:`: `lux.tinta` ya se aclara solo en tema oscuro.
  tinta: 'bg-lux-tinta/15 text-lux-tinta border-lux-tinta/30',
  green:
    'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400',
  red: 'bg-red-500/10 text-red-600 border-red-500/30 dark:text-red-400',
  blue: 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400',
  neutral:
    'bg-neutral-500/10 text-neutral-600 border-neutral-400/30 dark:text-neutral-300',
};

export const Badge = ({ children, tone = 'neutral' }: BadgeProps) => (
  <span
    className={cx(
      'inline-flex items-center gap-1 border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider',
      BADGE_TONES[tone],
    )}
  >
    {children}
  </span>
);

// ── Mensaje de error/aviso ───────────────────────────────────────────────────
export const Alert = ({ children }: { children: ReactNode }) => (
  // `role="alert"` para que un lector de pantalla anuncie el fallo en vez de
  // dejarlo pasar en silencio: es un banner de error, y quien no ve la pantalla
  // tiene que enterarse igual.
  <motion.p
    role="alert"
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    className="border border-amber-300/40 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-300"
  >
    {children}
  </motion.p>
);

export { cx };
