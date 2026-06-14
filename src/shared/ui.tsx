import { motion } from 'framer-motion';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/**
 * Kit de componentes UI con el lenguaje visual EssilorLuxottica
 * (editorial, sobrio, con acentos dorados y microinteracciones).
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

// ── Kicker (rótulo dorado en mayúsculas) ─────────────────────────────────────
export const Kicker = ({ children }: { children: ReactNode }) => (
  <span className="block text-[10px] font-bold uppercase tracking-[0.25em] text-lux-gold">
    {children}
  </span>
);

// ── Encabezado de sección editorial ──────────────────────────────────────────
interface SectionHeaderProps {
  kicker?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export const SectionHeader = ({
  kicker,
  title,
  description,
  actions,
}: SectionHeaderProps) => (
  <motion.header
    {...fadeUp}
    className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
  >
    <div className="space-y-2">
      {kicker ? <Kicker>{kicker}</Kicker> : null}
      <h1 className="font-serif text-3xl italic leading-none tracking-tight text-lux-blue dark:text-white md:text-4xl">
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
      hover && 'hover:-translate-y-1 hover:border-lux-gold hover:shadow-xl',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
);

// ── Botón ────────────────────────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'gold' | 'ghost' | 'danger';

interface LuxButtonProps extends ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-lux-blue text-white hover:bg-lux-gold hover:text-white dark:bg-lux-gold dark:text-black dark:hover:bg-white dark:hover:text-black',
  gold: 'bg-lux-gold text-black hover:bg-lux-blue hover:text-white',
  ghost:
    'border border-lux-blue text-lux-blue hover:bg-lux-blue hover:text-white dark:border-lux-gold dark:text-lux-gold dark:hover:bg-lux-gold dark:hover:text-black',
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
  'border-neutral-200 placeholder-neutral-400 focus:border-lux-blue focus:outline-none focus:ring-1 focus:ring-lux-gold ' +
  'dark:bg-[#18181a] dark:text-white dark:border-white/10 dark:placeholder-neutral-600 dark:focus:border-lux-gold';

// ── Etiqueta de estado (badge) ───────────────────────────────────────────────
interface BadgeProps {
  children: ReactNode;
  tone?: 'gold' | 'green' | 'red' | 'blue' | 'neutral';
}

const BADGE_TONES: Record<NonNullable<BadgeProps['tone']>, string> = {
  gold: 'bg-lux-gold/15 text-lux-gold border-lux-gold/30',
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
  <motion.p
    initial={{ opacity: 0, scale: 0.98 }}
    animate={{ opacity: 1, scale: 1 }}
    className="border border-amber-300/40 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-300"
  >
    {children}
  </motion.p>
);

export { cx };
