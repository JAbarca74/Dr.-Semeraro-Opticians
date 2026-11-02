import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Baby,
  Eye,
  Focus,
  Glasses,
  MapPin,
  Navigation,
  ScanEye,
  MessageCircle,
  Mail,
  Globe,
  Camera,
} from 'lucide-react';
import { LogoBuho } from '../../shared/LogoBuho';
import { enlaceWhatsapp } from '../../core/models/catalogo';
import { Kicker, LuxCard, fadeUp } from '../../shared/ui';
import { useIdioma } from '../../core/i18n/idioma.context';
import {
  DESCRIPCION_FACHADA,
  FOTO_FACHADA,
  FOTO_MONTURAS,
  FOTOS_CONSULTORIO,
  UBICACION_OPTICA,
  CONTACTO_OPTICA,
} from './inicio.config';

const SERVICIOS = [
  { clave: 'primario', Icono: Eye },
  { clave: 'lentes', Icono: ScanEye },
  { clave: 'terapia', Icono: Focus },
  { clave: 'pediatria', Icono: Baby },
] as const;
const TITULO =
  'font-serif text-3xl font-light tracking-tight text-lux-blue dark:text-white md:text-4xl';
const CONTENIDO = 'mx-auto w-full max-w-7xl px-6 md:px-10';

export const HomePage = () => {
  const { t, idioma } = useIdioma();

  return (
    <div className="-mx-4 space-y-10 md:-mx-6 md:space-y-14">
      <section
        aria-labelledby="inicio-presentacion"
        className={`${CONTENIDO} space-y-7`}
      >
        <motion.div
          {...fadeUp}
          className="mx-auto max-w-4xl space-y-5 text-center"
        >
          <Kicker>{t('home.vista.bienvenida')}</Kicker>
          <LogoBuho className="mx-auto h-14 w-auto text-lux-tinta dark:text-lux-tinta-claro sm:h-16" />
          <h1
            id="inicio-presentacion"
            className="font-serif text-4xl font-light leading-tight tracking-tight text-lux-blue dark:text-white sm:text-5xl md:text-6xl"
          >
            Óptica Dr. Luigi Semeraro
          </h1>
          <p className="flex items-center justify-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
            <MapPin size={16} className="shrink-0" aria-hidden="true" />
            {t('especialista.vista.ubicacion')}
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-1">
            <Link
              to="/agendar"
              className="transition-luxe inline-flex items-center justify-center gap-2 bg-lux-blue px-7 py-3.5 text-[11px] font-semibold uppercase tracking-wider2 text-white hover:bg-lux-tinta focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lux-tinta dark:bg-lux-tinta-claro dark:text-black dark:hover:bg-white"
            >
              {t('nav.publico.agendar')}
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <a
              href={UBICACION_OPTICA.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-luxe inline-flex items-center justify-center gap-2 border border-lux-blue px-7 py-3.5 text-[11px] font-semibold uppercase tracking-wider2 text-lux-blue hover:bg-lux-blue hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lux-tinta dark:border-lux-tinta-claro dark:text-lux-tinta-claro dark:hover:bg-lux-tinta-claro dark:hover:text-black"
            >
              {t('home.vista.llegar')}
            </a>
            <a
              href="#contactanos"
              className="transition-luxe inline-flex items-center justify-center gap-2 border border-lux-blue px-7 py-3.5 text-[11px] font-semibold uppercase tracking-wider2 text-lux-blue hover:bg-lux-blue hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lux-tinta dark:border-lux-tinta-claro dark:text-lux-tinta-claro dark:hover:bg-lux-tinta-claro dark:hover:text-black"
            >
              {t('home.contacto.boton')}
            </a>
          </div>
        </motion.div>
        <img
          src={FOTO_MONTURAS}
          alt={t('home.hero.alt')}
          width={1672}
          height={941}
          fetchPriority="high"
          decoding="async"
          className="mx-auto block h-auto w-full max-w-4xl border border-neutral-200/80 dark:border-white/10"
        />
      </section>

      <section
        aria-labelledby="inicio-servicios"
        className={`${CONTENIDO} space-y-6`}
      >
        <div className="space-y-2">
          <Kicker>{t('home.vista.servicios.kicker')}</Kicker>
          <h2 id="inicio-servicios" className={TITULO}>
            {t('home.vista.servicios.titulo')}
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            {t('home.vista.servicios.descripcion')}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {SERVICIOS.map(({ clave, Icono }) => (
            <LuxCard key={clave} className="space-y-4 p-5 sm:p-6">
              <span className="flex h-10 w-10 items-center justify-center border border-neutral-200 text-lux-tinta dark:border-white/10">
                <Icono size={20} strokeWidth={1.5} aria-hidden="true" />
              </span>
              <h3 className="font-serif text-lg font-bold text-lux-blue dark:text-white">
                {t(`especialista.vista.servicios.${clave}.titulo`)}
              </h3>
              <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                {t(`home.vista.servicios.${clave}`)}
              </p>
            </LuxCard>
          ))}
        </div>
        <div className="flex flex-col gap-4 border border-neutral-200/80 bg-lux-gray p-5 dark:border-white/10 dark:bg-[#0e0e0e] sm:flex-row sm:items-center sm:p-6">
          <Glasses
            size={30}
            strokeWidth={1.5}
            className="shrink-0 text-lux-tinta"
            aria-hidden="true"
          />
          <div className="space-y-2">
            <h3 className="font-serif text-xl text-lux-blue dark:text-white">
              {t('home.vista.variedad.titulo')}
            </h3>
            <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
              {t('home.vista.variedad.descripcion')}
            </p>
          </div>
        </div>
      </section>

      <section
        aria-labelledby="inicio-consultorio"
        className={`${CONTENIDO} space-y-6`}
      >
        <div className="space-y-2">
          <Kicker>{t('home.vista.consultorio.kicker')}</Kicker>
          <h2 id="inicio-consultorio" className={TITULO}>
            {t('home.vista.consultorio.titulo')}
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            {t('home.vista.consultorio.descripcion')}
          </p>
        </div>
        {FOTOS_CONSULTORIO.length > 0 ? (
          <div className="mx-auto grid max-w-4xl items-center gap-4 md:grid-cols-[7fr_4fr]">
            {FOTOS_CONSULTORIO.map((foto, indice) => (
              <img
                key={foto.src}
                src={foto.src}
                alt={foto.descripcion[idioma]}
                width={foto.width}
                height={foto.height}
                loading="lazy"
                decoding="async"
                className={`block h-auto w-full border border-neutral-200/80 dark:border-white/10 ${indice === 0 ? 'md:row-span-2' : ''}`}
              />
            ))}
          </div>
        ) : null}
      </section>

      <section
        aria-labelledby="inicio-ubicacion"
        className={`${CONTENIDO} space-y-6`}
      >
        <div className="space-y-2">
          <Kicker>{t('home.vista.ubicacion.kicker')}</Kicker>
          <h2 id="inicio-ubicacion" className={TITULO}>
            {t('home.vista.ubicacion.titulo')}
          </h2>
          <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            {t('home.vista.ubicacion.descripcion')}
          </p>
        </div>
        <div className="grid items-center gap-4 md:grid-cols-2">
          <img
            src={FOTO_FACHADA}
            alt={DESCRIPCION_FACHADA[idioma]}
            width={1672}
            height={941}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full border border-neutral-200/80 dark:border-white/10"
          />
          <iframe
            title={t('home.vista.mapa.titulo')}
            src={UBICACION_OPTICA.embedUrl}
            width="600"
            height="450"
            loading="lazy"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="aspect-video h-auto min-h-[240px] w-full border border-neutral-200/80 dark:border-white/10"
          />
        </div>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <address className="space-y-2 text-sm not-italic leading-relaxed text-neutral-500 dark:text-neutral-400">
            <p className="font-medium text-lux-blue dark:text-white">
              {UBICACION_OPTICA.referencia}
            </p>
            <p>{UBICACION_OPTICA.direccion}</p>
          </address>
          <a
            href={UBICACION_OPTICA.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-luxe inline-flex items-center justify-center gap-2 bg-lux-tinta px-6 py-3.5 text-[11px] font-semibold uppercase tracking-wider2 text-white hover:bg-lux-blue focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lux-tinta dark:hover:bg-lux-tinta-claro dark:hover:text-black"
          >
            <Navigation size={16} className="shrink-0" aria-hidden="true" />
            {t('home.vista.mapa.boton')}
          </a>
        </div>
      </section>
      <section
        id="contactanos"
        aria-labelledby="inicio-contacto"
        className={`${CONTENIDO} scroll-mt-24 space-y-6`}
      >
        <div className="space-y-2">
          <Kicker>{t('home.contacto.kicker')}</Kicker>
          <h2 id="inicio-contacto" className={TITULO}>
            {t('home.contacto.titulo')}
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            {t('home.contacto.descripcion')}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              nombre: 'WhatsApp',
              valor: CONTACTO_OPTICA.telefonoVisible,
              href: enlaceWhatsapp(CONTACTO_OPTICA.whatsapp, ''),
              Icono: MessageCircle,
              externo: true,
            },
            {
              nombre: t('home.contacto.correo'),
              valor: CONTACTO_OPTICA.correo,
              href: `mailto:${CONTACTO_OPTICA.correo}`,
              Icono: Mail,
              externo: false,
            },
            {
              nombre: 'Facebook',
              valor: 'Facebook',
              href: CONTACTO_OPTICA.facebook,
              Icono: Globe,
              externo: true,
            },
            {
              nombre: 'Instagram',
              valor: 'Instagram',
              href: CONTACTO_OPTICA.instagram,
              Icono: Camera,
              externo: true,
            },
          ].map(({ nombre, valor, href, Icono, externo }) => (
            <a
              key={nombre}
              href={href}
              aria-label={valor === nombre ? nombre : `${nombre} ${valor}`}
              target={externo ? '_blank' : undefined}
              rel={externo ? 'noopener noreferrer' : undefined}
              className="transition-luxe flex min-w-0 items-center gap-4 border border-neutral-200/80 bg-white p-5 hover:border-lux-tinta focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lux-tinta dark:border-white/10 dark:bg-[#0f0f11] dark:hover:border-lux-tinta-claro"
            >
              <Icono
                size={22}
                strokeWidth={1.5}
                className="shrink-0 text-lux-tinta dark:text-lux-tinta-claro"
                aria-hidden="true"
              />
              <span className="min-w-0 space-y-1">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                  {nombre}
                </span>
                {valor !== nombre ? (
                  <span className="block break-words text-sm font-medium text-lux-blue dark:text-white">
                    {valor}
                  </span>
                ) : null}
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
};
