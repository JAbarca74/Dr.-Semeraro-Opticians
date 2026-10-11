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
import { IlustracionLentes } from '../../shared/ilustraciones';
import { Kicker, LuxCard, fadeUp, fadeUpItem, stagger } from '../../shared/ui';
import { useIdioma } from '../../core/i18n/idioma.context';
import type { ClaveTexto } from '../../core/i18n/catalogos/es';

const BRANDS = ['Ray-Ban®', 'Oakley®', 'Persol®', 'Varilux® XR', 'Transitions®'];

/** Guardan claves, no textos: el rótulo se resuelve al pintar (`DSO-54`). */
const SERVICIOS: {
  icon: typeof Glasses;
  title: ClaveTexto;
  desc: ClaveTexto;
  to: string;
  cta: ClaveTexto;
}[] = [
  {
    icon: Glasses,
    title: 'home.servicio.vitrina.titulo',
    desc: 'home.servicio.vitrina.desc',
    to: '/catalogo',
    cta: 'home.servicio.vitrina.cta',
  },
  {
    icon: User,
    title: 'home.servicio.especialista.titulo',
    desc: 'home.servicio.especialista.desc',
    to: '/especialista',
    cta: 'home.servicio.especialista.cta',
  },
  {
    icon: ShieldCheck,
    title: 'home.servicio.receta.titulo',
    desc: 'home.servicio.receta.desc',
    to: '/portal',
    cta: 'home.servicio.receta.cta',
  },
];

export const HomePage = () => {
  const navigate = useNavigate();
  const { t } = useIdioma();

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
            src="https://images.unsplash.com/photo-1486250944723-86bca2b15b06?q=80&w=2000&auto=format&fit=crop"
            alt={t('home.hero.alt')}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover"
          />
        </div>
        {/* Anteojos que se trazan al cargar; solo escritorio, de fondo y sin texto. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-16 right-10 z-10 hidden text-lux-tinta-claro/50 lg:block"
        >
          <IlustracionLentes className="h-40 w-72" />
        </div>
        <div className="relative z-20 mx-auto w-full max-w-7xl px-6 text-center md:px-10 md:text-left">
          <motion.div {...fadeUp} className="max-w-3xl space-y-7">
            <h1 className="font-serif text-5xl font-light leading-[1.05] tracking-tight text-white md:text-8xl">
              {t('home.lema.antes')}{' '}
              <span className="italic text-lux-tinta-claro">
                {t('home.lema.destacado')}
              </span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-stone-300 md:text-lg">
              {t('home.intro.antes')}{' '}
              <strong className="font-medium text-white">Dr. Luigi Semeraro</strong>
              {t('home.intro.despues')}
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-2 md:justify-start">
              <button
                onClick={() => navigate('/catalogo')}
                className="transition-luxe flex items-center gap-2 border border-white bg-white px-8 py-4 text-xs font-bold uppercase tracking-widest text-black hover:bg-transparent hover:text-white"
              >
                {t('home.cta.catalogo')} <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate('/portal')}
                className="transition-luxe flex items-center gap-2 border border-white/40 px-8 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-white hover:text-black"
              >
                <ShieldCheck className="h-4 w-4 text-lux-tinta-claro" />{' '}
                {t('home.cta.receta')}
              </button>
            </div>
          </motion.div>
        </div>
        <button
          onClick={scrollToSolutions}
          title={t('home.desplazar')}
          className="transition-luxe absolute bottom-10 left-1/2 z-20 hidden h-10 w-10 -translate-x-1/2 items-center justify-center border border-white/20 text-white/60 hover:scale-110 hover:border-white hover:text-white sm:flex"
        >
          <ArrowDown className="h-4 w-4 animate-bounce" />
        </button>
      </section>

      {/* MARCAS */}
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
        <div className="flex flex-wrap items-center justify-center gap-8 border-y border-stone-200/60 py-8 dark:border-white/10 md:justify-between">
          <span className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-neutral-400">
            {t('home.aliados')}
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
          <Kicker>{t('home.servicios.kicker')}</Kicker>
          <h2 className="font-serif text-3xl font-light tracking-tight text-lux-blue dark:text-white md:text-5xl">
            {t('home.servicios.titulo.antes')}{' '}
            <span className="italic text-lux-tinta">
              {t('home.servicios.titulo.destacado')}
            </span>
          </h2>
          <p className="mx-auto max-w-lg text-xs leading-relaxed text-neutral-500 dark:text-neutral-400 md:text-sm">
            {t('home.servicios.descripcion')}
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
                    <span className="flex h-10 w-10 items-center justify-center border border-neutral-200 text-lux-tinta dark:border-white/10">
                      <Icon className="h-5 w-5" strokeWidth={1.5} />
                    </span>
                    <div className="space-y-1.5">
                      <h3 className="font-serif text-lg font-bold tracking-wide text-lux-blue dark:text-white">
                        {t(s.title)}
                      </h3>
                      <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                        {t(s.desc)}
                      </p>
                    </div>
                  </div>
                  <Link
                    to={s.to}
                    className="link-underline flex items-center gap-1.5 self-start font-mono text-[10px] font-bold uppercase tracking-widest text-lux-blue dark:text-lux-tinta-claro"
                  >
                    {t(s.cta)} <ArrowRight className="h-3.5 w-3.5" />
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
              <Kicker>{t('home.sello.kicker')}</Kicker>
              <h3 className="font-serif text-3xl font-light leading-tight tracking-tight text-lux-blue dark:text-white md:text-4xl">
                {t('home.sello.titulo.antes')}{' '}
                <span className="italic text-lux-tinta">
                  {t('home.sello.titulo.destacado')}
                </span>
              </h3>
              <p className="max-w-xl text-xs leading-relaxed text-neutral-600 dark:text-neutral-400 md:text-sm">
                {t('home.sello.descripcion')}
              </p>
              <div className="flex items-center gap-2 font-mono text-[10.5px] font-semibold text-lux-blue dark:text-lux-tinta-claro">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>{t('home.sello.ley')}</span>
              </div>
            </div>
            <div className="flex h-64 items-center justify-center border border-neutral-200 bg-white p-8 text-center dark:border-white/10 dark:bg-black md:col-span-5">
              <div className="space-y-4">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-neutral-200 text-lux-tinta dark:border-white/15">
                  <Award className="h-6 w-6" />
                </span>
                <p className="font-serif text-2xl font-light uppercase tracking-wider text-lux-blue dark:text-white">
                  Est. <strong className="font-bold">2025</strong>
                </p>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
                  {t('home.sello.fidelidad')}
                </p>
              </div>
            </div>
          </LuxCard>
        </motion.div>
      </section>
    </div>
  );
};
