import { motion } from 'framer-motion';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

/** Primitivos visuales del entorno de recepción (editorial, serif Cormorant + navy). */

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');

export const recepFade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
};

interface RecepHeaderProps {
  cu?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export const RecepHeader = ({ cu, title, description, actions }: RecepHeaderProps) => (
  <motion.div
    {...recepFade}
    className="mb-8 flex flex-col gap-4 border-b border-neutral-200 pb-6 dark:border-neutral-800 md:flex-row md:items-center md:justify-between"
  >
    <div>
      {cu ? (
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-lux-gold">
          {cu}
        </p>
      ) : null}
      <h1 className="mt-1 font-serif text-4xl italic font-light tracking-tight text-lux-blue dark:text-white">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 max-w-xl text-xs font-light leading-relaxed text-neutral-500 dark:text-neutral-400">
          {description}
        </p>
      ) : null}
    </div>
    {actions ? <div className="flex shrink-0 items-center gap-3">{actions}</div> : null}
  </motion.div>
);

export const RecepCard = ({
  className,
  children,
  ...rest
}: ComponentPropsWithoutRef<'div'>) => (
  <div
    className={cx(
      'border border-neutral-150 bg-white shadow-sm dark:border-neutral-800 dark:bg-[#181c22]',
      className,
    )}
    {...rest}
  >
    {children}
  </div>
);

type BtnVariant = 'solid' | 'outline';

export const RecepButton = ({
  variant = 'solid',
  className,
  children,
  ...rest
}: ComponentPropsWithoutRef<'button'> & { variant?: BtnVariant }) => (
  <button
    className={cx(
      'inline-flex cursor-pointer items-center justify-center gap-2.5 px-6 py-3.5 text-[11px] font-bold uppercase tracking-widest transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50',
      variant === 'solid'
        ? 'bg-lux-dark text-white hover:-translate-y-0.5 hover:bg-lux-blue hover:shadow-md dark:bg-lux-gold dark:text-lux-dark dark:hover:bg-lux-gold/90'
        : 'border border-neutral-300 text-neutral-700 hover:border-lux-gold hover:text-lux-dark dark:border-neutral-700 dark:text-neutral-300',
      className,
    )}
    {...rest}
  >
    {children}
  </button>
);

export const recepInputClass =
  'w-full border border-neutral-250 bg-stone-50/50 px-3.5 py-3 text-xs outline-none transition-colors ' +
  'focus:border-neutral-900 focus:bg-white dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:border-neutral-500';

export const recepLabelClass =
  'mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-neutral-500';

export { cx };
