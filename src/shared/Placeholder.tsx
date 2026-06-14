import { motion } from 'framer-motion';
import { Sparkles, type LucideIcon } from 'lucide-react';
import { Kicker, LuxCard, fadeUp, fadeUpItem, stagger } from './ui';

interface PlaceholderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  features?: string[];
}

/**
 * Presentación premium de un módulo en preparación (estilo editorial
 * EssilorLuxottica). La lógica de backend correspondiente llega en un
 * sprint posterior; esta vista mantiene la identidad visual del panel.
 */
export const Placeholder = ({
  title,
  description,
  icon: Icon,
  features,
}: PlaceholderProps) => (
  <section className="space-y-10">
    <motion.header {...fadeUp} className="space-y-3">
      <Kicker>Módulo del panel clínico</Kicker>
      <div className="flex items-center gap-4">
        {Icon ? (
          <span className="flex h-12 w-12 items-center justify-center border border-lux-gold/40 text-lux-gold">
            <Icon className="h-5 w-5" strokeWidth={1.5} />
          </span>
        ) : null}
        <h1 className="font-serif text-3xl italic leading-none tracking-tight text-lux-blue dark:text-white md:text-4xl">
          {title}
        </h1>
      </div>
      {description ? (
        <p className="max-w-2xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          {description}
        </p>
      ) : null}
    </motion.header>

    {features?.length ? (
      <motion.div
        variants={stagger}
        initial="initial"
        animate="animate"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {features.map((f) => (
          <motion.div key={f} variants={fadeUpItem}>
            <LuxCard hover className="flex items-start gap-3 p-5">
              <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lux-gold" />
              <span className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                {f}
              </span>
            </LuxCard>
          </motion.div>
        ))}
      </motion.div>
    ) : null}

    <motion.div {...fadeUp}>
      <LuxCard className="flex items-center gap-3 border-dashed p-5">
        <Sparkles className="h-4 w-4 shrink-0 text-lux-gold" />
        <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
          Interfaz lista · integración de datos en sprint próximo
        </p>
      </LuxCard>
    </motion.div>
  </section>
);
