import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowDown,
  ArrowRight,
  Award,
  Glasses,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Kicker, LuxCard, fadeUp, fadeUpItem, stagger } from '../../shared/ui';

const BRANDS = ['Ray-Ban®', 'Oakley®', 'Persol®', 'Varilux® XR', 'Transitions®'];

const SERVICIOS = [
  {
    icon: Glasses,
    title: 'Vitrina de modelos',
    desc: 'Colección curada de monturas y lentes de la óptica, con precios de referencia y disponibilidad.',
    to: '/catalogo',
    cta: 'Explorar colección',
  },
  {
    icon: User,
    title: 'El especialista',
    desc: 'Conozca la trayectoria clínica del Dr. Luigi Semeraro y el estándar de diagnóstico refractivo de la óptica.',
    to: '/especialista',
    cta: 'Ver perfil clínico',
  },
  {
    icon: ShieldCheck,
    title: 'Mi expediente / receta',
    desc: 'Consulte y valide su fórmula de dioptrías firmada digitalmente con hash SHA-256 inmutable y certificado QR.',
    to: '/portal',
    cta: 'Acceder a mi receta',
  },
];

export const HomePage = () => {
  const navigate = useNavigate();

  const scrollToSolutions = () => {
    document
      .getElementById('solutions-overview')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="-mx-4 space-y-24 md:-mx-6 md:space-y-32">
      {/* HERO */}
      <section className="relative flex h-[80vh] min-h-[460px] items-center justify-center overflow-hidden bg-slate-950">
        <div className="absolute inset-0">
          <div className="absolute inset-0 z-10 bg-black/60" />
          <img
            src="https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?q=80&w=2000&auto=format&fit=crop"
            alt="Colección de aros premium"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        </div>
        <div className="relative z-20 mx-auto w-full max-w-7xl px-6 text-center md:px-10 md:text-left">
          <motion.div {...fadeUp} className="max-w-3xl space-y-7">
            <span className="inline-flex items-center gap-2 border border-white/20 bg-white/10 px-3 py-1 blur-backdrop">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lux-gold" />
              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-white md:text-[10px]">
                Vanguardia ocular · Alta costura italiana
              </span>
            </span>
            <h1 className="font-serif text-5xl font-light leading-[1.05] tracking-tight text-white md:text-8xl">
              La estética de la <span className="italic text-lux-gold">precisión</span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-stone-300 md:text-lg">
              Bajo la dirección clínica del{' '}
              <strong className="font-medium text-white">Dr. Luigi Semeraro</strong>,
              fusionamos el diagnóstico refractivo de alto nivel con monturas
              artesanales de las mejores casas del mundo.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2 md:justify-start">
              <button
                onClick={() => navigate('/catalogo')}
                className="transition-luxe flex items-center gap-2 border border-white bg-white px-8 py-4 text-xs font-bold uppercase tracking-widest text-black hover:bg-transparent hover:text-white"
              >
                Explorar catálogo <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate('/portal')}
                className="transition-luxe flex items-center gap-2 border border-white/40 px-8 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-white hover:text-black"
              >
                <ShieldCheck className="h-4 w-4 text-lux-gold" /> Verificar mi receta
              </button>
            </div>
          </motion.div>
        </div>
        <button
          onClick={scrollToSolutions}
          title="Desplazar"
          className="transition-luxe absolute bottom-10 left-1/2 z-20 hidden h-10 w-10 -translate-x-1/2 items-center justify-center border border-white/20 text-white/60 hover:scale-110 hover:border-white hover:text-white sm:flex"
        >
          <ArrowDown className="h-4 w-4 animate-bounce" />
        </button>
      </section>

      {/* MARCAS */}
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
        <div className="flex flex-wrap items-center justify-center gap-8 border-y border-stone-200/60 py-8 dark:border-white/10 md:justify-between">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-neutral-400">
            Aliados oficiales:
          </span>
          {BRANDS.map((b) => (
            <span
              key={b}
              className="font-serif text-base font-bold italic tracking-widest text-lux-blue dark:text-white"
            >
              {b}
            </span>
          ))}
        </div>
      </div>

      {/* BENTO SERVICIOS */}
      <section id="solutions-overview" className="mx-auto w-full max-w-7xl space-y-12 px-6 md:px-10">
        <div className="mx-auto max-w-2xl space-y-3 text-center">
          <Kicker>Servicios premium</Kicker>
          <h2 className="font-serif text-3xl font-light tracking-tight text-lux-blue dark:text-white md:text-5xl">
            Ecosistema digital de{' '}
            <span className="italic text-lux-gold">salud visual</span>
          </h2>
          <p className="mx-auto max-w-lg text-xs leading-relaxed text-neutral-500 dark:text-neutral-400 md:text-sm">
            Conectamos la precisión oftalmológica con herramientas digitales
            disponibles en tiempo real.
          </p>
        </div>

        <motion.div
          variants={stagger}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="grid grid-cols-1 gap-8 md:grid-cols-3"
        >
          {SERVICIOS.map((s) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.title} variants={fadeUpItem}>
                <LuxCard hover className="flex h-full flex-col justify-between gap-6 p-8">
                  <div className="space-y-4">
                    <span className="flex h-10 w-10 items-center justify-center border border-neutral-200 text-lux-gold dark:border-white/10">
                      <Icon className="h-5 w-5" strokeWidth={1.5} />
                    </span>
                    <div className="space-y-1.5">
                      <h3 className="font-serif text-lg font-bold tracking-wide text-lux-blue dark:text-white">
                        {s.title}
                      </h3>
                      <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={s.to}
                    className="link-underline flex items-center gap-1.5 self-start font-mono text-[10px] font-bold uppercase tracking-widest text-lux-blue dark:text-lux-gold"
                  >
                    {s.cta} <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </LuxCard>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* CERTIFICACIÓN HASH */}
      <section className="mx-auto w-full max-w-7xl px-6 pb-8 md:px-10">
        <motion.div {...fadeUp}>
          <LuxCard className="grid grid-cols-1 items-center gap-12 bg-lux-gray p-8 dark:bg-[#0e0e0e] md:grid-cols-12 md:p-16">
            <div className="space-y-6 md:col-span-7">
              <Kicker>Protección sanitaria excepcional</Kicker>
              <h3 className="font-serif text-3xl font-light leading-tight tracking-tight text-lux-blue dark:text-white md:text-4xl">
                Firma hash y certificación del{' '}
                <span className="italic text-lux-gold">expediente clínico</span>
              </h3>
              <p className="max-w-xl text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 md:text-sm">
                Cada fórmula refractiva emitida por el Dr. Semeraro está sellada con
                un hash SHA-256 inmutable y un certificado QR único, garantizando la
                legitimidad del diagnóstico en cualquier laboratorio.
              </p>
              <div className="flex items-center gap-2 font-mono text-[10.5px] font-semibold text-lux-blue dark:text-lux-gold">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Conforme a la Ley de Protección de Datos N° 8968 de Costa Rica.</span>
              </div>
            </div>
            <div className="flex h-64 items-center justify-center border border-neutral-200 bg-white p-8 text-center dark:border-white/10 dark:bg-black md:col-span-5">
              <div className="space-y-4">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 text-lux-gold dark:border-white/15">
                  <Award className="h-6 w-6" />
                </span>
                <p className="font-serif text-2xl font-light uppercase tracking-wider text-lux-blue dark:text-white">
                  Est. <strong className="font-bold">2025</strong>
                </p>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                  Fidelidad estructural evaluada
                </p>
              </div>
            </div>
          </LuxCard>
        </motion.div>
      </section>
    </div>
  );
};
