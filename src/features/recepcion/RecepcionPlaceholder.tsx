import { motion } from 'framer-motion';
import { Sparkles, type LucideIcon } from 'lucide-react';
import { RecepCard, RecepHeader, recepFade } from './RecepcionShared';

interface Props {
  cu?: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  features?: string[];
}

/** Módulo de recepción en preparación (sprint futuro), con identidad editorial. */
export const RecepcionPlaceholder = ({ cu, title, description, icon: Icon, features }: Props) => (
  <div>
    <RecepHeader cu={cu} title={title} description={description} />
    {features?.length ? (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={f}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
          >
            <RecepCard className="flex items-start gap-3 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-lux-gold">
              {Icon ? <Icon className="mt-0.5 h-4 w-4 shrink-0 text-lux-gold" strokeWidth={1.5} /> : null}
              <span className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">{f}</span>
            </RecepCard>
          </motion.div>
        ))}
      </div>
    ) : null}
    <motion.div {...recepFade} className="mt-8">
      <RecepCard className="flex items-center gap-3 border-dashed p-5">
        <Sparkles className="h-4 w-4 shrink-0 text-lux-gold" />
        <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
          Interfaz lista · integración de datos en sprint próximo
        </p>
      </RecepCard>
    </motion.div>
  </div>
);
