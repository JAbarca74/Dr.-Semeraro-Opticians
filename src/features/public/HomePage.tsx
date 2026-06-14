import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Kicker, fadeUp } from '../../shared/ui';

export const HomePage = () => (
  <section className="grid items-center gap-10 lg:grid-cols-2">
    <motion.div {...fadeUp} className="space-y-6">
      <Kicker>Salud visual de precisión · Pérez Zeledón</Kicker>
      <h1 className="font-serif text-4xl italic leading-tight tracking-tight text-lux-blue dark:text-white md:text-6xl">
        La belleza de la
        <br />
        precisión visual
      </h1>
      <p className="max-w-lg text-sm leading-relaxed text-neutral-500 dark:text-neutral-400 md:text-base">
        Cuidado ocular primario, optometría pediátrica y adaptación de lentes de
        contacto con seguimiento clínico personalizado, respaldado por la cartera
        de marcas EssilorLuxottica.
      </p>
      <div className="flex flex-wrap gap-4 pt-2">
        <Link
          to="/catalogo"
          className="transition-luxe inline-flex items-center gap-2 bg-lux-blue px-6 py-3 text-[11px] font-semibold uppercase tracking-wider2 text-white hover:bg-lux-gold dark:bg-lux-gold dark:text-black dark:hover:bg-white"
        >
          Ver catálogo <ArrowRight className="h-3.5 w-3.5" />
        </Link>
        <Link
          to="/especialista"
          className="transition-luxe inline-flex items-center gap-2 border border-lux-blue px-6 py-3 text-[11px] font-semibold uppercase tracking-wider2 text-lux-blue hover:bg-lux-blue hover:text-white dark:border-lux-gold dark:text-lux-gold dark:hover:bg-lux-gold dark:hover:text-black"
        >
          Conocer al especialista
        </Link>
      </div>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="relative aspect-[4/5] overflow-hidden border border-lux-blue/10 dark:border-white/10"
    >
      <img
        src="https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&q=80&w=900"
        alt="Óptica Dr. Semeraro"
        referrerPolicy="no-referrer"
        className="transition-luxe h-full w-full object-cover grayscale hover:scale-105 hover:grayscale-0"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
      <span className="absolute bottom-5 left-5 font-mono text-[9px] uppercase tracking-widest text-white/80">
        EssilorLuxottica Prestige Network
      </span>
    </motion.div>
  </section>
);
