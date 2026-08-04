import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Award, GraduationCap, Microscope, ShieldCheck } from 'lucide-react';
import { Kicker, LuxCard, SectionHeader, fadeUp, fadeUpItem, stagger } from '../../shared/ui';

const CREDENCIALES = [
  {
    icon: GraduationCap,
    title: 'Formación clínica',
    desc: 'Especialización en optometría y diagnóstico refractivo de alto nivel.',
  },
  {
    icon: Microscope,
    title: 'Diagnóstico de precisión',
    desc: 'Evaluación optométrica completa con parámetros OD/OI y agudeza visual.',
  },
  {
    icon: ShieldCheck,
    title: 'Recetas certificadas',
    desc: 'Cada fórmula se emite con sello digital SHA-256 y certificado QR verificable.',
  },
];

export const PerfilEspecialistaPage = () => (
  <section className="space-y-12">
    <SectionHeader
      kicker="Dirección clínica"
      title="Dr. Luigi Semeraro"
      description="Optometrista a cargo de la dirección clínica de Óptica Dr. Luigi Semeraro. Une el diagnóstico refractivo de alto nivel con una cartera de marcas de prestigio."
    />

    <div className="grid items-center gap-10 lg:grid-cols-12">
      <motion.div
        {...fadeUp}
        className="relative aspect-[4/5] overflow-hidden border border-lux-blue/10 dark:border-white/10 lg:col-span-5"
      >
        <img
          src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=900&auto=format&fit=crop"
          alt="Dr. Luigi Semeraro"
          referrerPolicy="no-referrer"
          className="transition-luxe h-full w-full object-cover grayscale hover:grayscale-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <span className="absolute bottom-5 left-5 font-mono text-[9px] uppercase tracking-widest text-white/80">
          Licencia médica COPT-4421
        </span>
      </motion.div>

      <motion.div {...fadeUp} className="space-y-6 lg:col-span-7">
        <Kicker>Filosofía de atención</Kicker>
        <p className="font-serif text-2xl font-light leading-relaxed tracking-tight text-lux-blue dark:text-white md:text-3xl">
          “La salud visual merece la misma precisión que la alta relojería: cada
          dioptría medida, cada montura ajustada a la fisonomía del paciente.”
        </p>
        <p className="max-w-xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
          Desde Pérez Zeledón, la óptica integra evaluación clínica rigurosa con un
          catálogo de monturas y lentes de las casas Ray-Ban, Oakley, Persol y
          Varilux, garantizando legitimidad documental en cada receta emitida.
        </p>
      </motion.div>
    </div>

    <motion.div
      variants={stagger}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true }}
      className="grid gap-6 md:grid-cols-3"
    >
      {CREDENCIALES.map((c) => {
        const Icon = c.icon;
        return (
          <motion.div key={c.title} variants={fadeUpItem}>
            <LuxCard hover className="flex h-full flex-col gap-4 p-7">
              <span className="flex h-10 w-10 items-center justify-center border border-neutral-200 text-lux-gold dark:border-white/10">
                <Icon className="h-5 w-5" strokeWidth={1.5} />
              </span>
              <div className="space-y-1.5">
                <h3 className="font-serif text-lg font-bold text-lux-blue dark:text-white">
                  {c.title}
                </h3>
                <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                  {c.desc}
                </p>
              </div>
            </LuxCard>
          </motion.div>
        );
      })}
    </motion.div>

    <motion.div {...fadeUp}>
      <LuxCard className="flex flex-col items-center justify-between gap-4 bg-lux-gray p-8 text-center dark:bg-[#0e0e0e] sm:flex-row sm:text-left">
        <div className="flex items-center gap-3">
          <Award className="h-6 w-6 text-lux-gold" strokeWidth={1.2} />
          <p className="font-serif text-xl font-light text-lux-blue dark:text-white">
            Atención por cita en Pérez Zeledón, Costa Rica
          </p>
        </div>
        <Link
          to="/catalogo"
          className="transition-luxe inline-flex items-center gap-2 border border-lux-blue px-6 py-3 text-[11px] font-semibold uppercase tracking-wider2 text-lux-blue hover:bg-lux-blue hover:text-white dark:border-lux-gold dark:text-lux-gold dark:hover:bg-lux-gold dark:hover:text-black"
        >
          Ver la colección
        </Link>
      </LuxCard>
    </motion.div>
  </section>
);
