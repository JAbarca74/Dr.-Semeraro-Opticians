import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Baby,
  Eye,
  Focus,
  ImageOff,
  MapPin,
  MessageCircle,
  ScanEye,
} from 'lucide-react';
import { listarEspecialistas } from '../../core/api/especialistas.service';
import { parametrosPublicos } from '../../core/api/catalogo.service';
import type { EspecialistaVitrina } from '../../core/models/especialista';
import { enlaceWhatsapp, numeroLegible } from '../../core/models/catalogo';
import { mensajeDeError } from '../../shared/error';
import { useIdioma } from '../../core/i18n/idioma.context';
import { Alert, Kicker, LuxCard, SectionHeader, fadeUp } from '../../shared/ui';

const SERVICIOS = [
  { clave: 'primario', Icono: Eye },
  { clave: 'lentes', Icono: ScanEye },
  { clave: 'terapia', Icono: Focus },
  { clave: 'pediatria', Icono: Baby },
] as const;

const BOTON_CONTACTO =
  'transition-luxe inline-flex items-center justify-center gap-2 bg-lux-tinta px-7 py-3.5 text-[11px] font-semibold uppercase tracking-wider2 text-white hover:bg-lux-blue focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-lux-tinta dark:hover:bg-lux-tinta-claro dark:hover:text-black';
const TITULO_SECCION =
  'font-serif text-2xl font-light leading-snug tracking-tight text-lux-blue dark:text-white md:text-3xl';

export const PerfilEspecialistaPage = () => {
  const { t } = useIdioma();
  const [especialista, setEspecialista] = useState<EspecialistaVitrina | null>(
    null,
  );
  const [whatsapp, setWhatsapp] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState('');
  const [avisoCanal, setAvisoCanal] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    listarEspecialistas()
      .then((lista) => {
        setEspecialista(lista[0] ?? null);
        setError('');
      })
      .catch((e) => setError(mensajeDeError(e, t('especialista.error'))))
      .finally(() => setCargando(false));
    parametrosPublicos()
      .then((p) => {
        setWhatsapp(p['optica.whatsapp'] ?? '');
        setTelefono(p['optica.telefono'] ?? '');
      })
      .catch(() => {
        /* El contacto informa si no hay un canal disponible. */
      });
    // Cambiar de idioma no debe volver a solicitar el perfil.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contactar = () => {
    if (!especialista) return;
    setAvisoCanal('');
    const respaldo = telefono
      ? `Llámenos al ${telefono}.`
      : t('contacto.llamePorTelefono');
    if (!whatsapp) {
      setAvisoCanal(`Canal no disponible. ${respaldo}`);
      return;
    }
    const ventana = window.open(
      enlaceWhatsapp(whatsapp, t('especialista.vista.mensaje')),
      '_blank',
    );
    if (!ventana)
      setAvisoCanal(
        `Canal no disponible. ${telefono ? respaldo : `Llámenos al ${numeroLegible(whatsapp)}.`}`,
      );
  };

  return (
    <div className="space-y-10 md:space-y-12">
      {error ? <Alert>{error}</Alert> : null}
      {avisoCanal ? <Alert>{avisoCanal}</Alert> : null}
      <section
        aria-labelledby="especialista-presentacion"
        className="space-y-7"
      >
        <div id="especialista-presentacion">
          <SectionHeader
            kicker={t('especialista.kicker')}
            title={
              especialista ? especialista.nombre : t('especialista.titulo')
            }
            description={t('especialista.vista.subtitulo')}
          />
        </div>
        {!especialista ? (
          <LuxCard className="p-8 text-center">
            <p className="text-sm text-neutral-500">
              {cargando
                ? t('especialista.cargando')
                : t('especialista.noPublicado')}
            </p>
          </LuxCard>
        ) : (
          <div className="grid items-center gap-7 md:grid-cols-12 lg:gap-10">
            <motion.div
              {...fadeUp}
              className="min-w-0 overflow-hidden border border-lux-blue/10 dark:border-white/10 md:col-span-5"
            >
              {especialista.fotoUrl ? (
                <img
                  src={
                    especialista.fotoUrl === '/dr-luigi-semeraro.jpg'
                      ? '/dr-luigi-semeraro-retrato.png'
                      : especialista.fotoUrl
                  }
                  alt={especialista.nombre}
                  className="block h-auto w-full"
                />
              ) : (
                <span className="flex aspect-4/3 flex-col items-center justify-center gap-2 bg-stone-100 text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
                  <ImageOff size={28} aria-hidden="true" />
                  <span className="text-[10px] uppercase tracking-wider">
                    {t('especialista.sinFoto')}
                  </span>
                </span>
              )}
            </motion.div>
            <motion.div {...fadeUp} className="min-w-0 space-y-5 md:col-span-7">
              <h2 className={TITULO_SECCION}>
                {t('especialista.vista.presentacion.titulo')}
              </h2>
              <p className="max-w-xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                {t('especialista.vista.presentacion.descripcion')}
              </p>
              <button
                type="button"
                onClick={contactar}
                className={BOTON_CONTACTO}
              >
                <MessageCircle
                  size={14}
                  className="shrink-0"
                  aria-hidden="true"
                />
                {t('especialista.vista.agendar')}
              </button>
            </motion.div>
          </div>
        )}
      </section>
      {especialista ? (
        <>
          <section
            aria-labelledby="especialista-servicios"
            className="space-y-6"
          >
            <div className="space-y-2">
              <Kicker>{t('especialista.vista.servicios.kicker')}</Kicker>
              <h2 id="especialista-servicios" className={TITULO_SECCION}>
                {t('especialista.vista.servicios.titulo')}
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                {t('especialista.vista.servicios.descripcion')}
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {SERVICIOS.map(({ clave, Icono }) => (
                <LuxCard
                  key={clave}
                  className="flex items-start gap-4 p-5 sm:p-6"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-neutral-200 text-lux-tinta dark:border-white/10">
                    <Icono size={20} strokeWidth={1.5} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 space-y-2">
                    <h3 className="font-serif text-lg font-bold text-lux-blue dark:text-white">
                      {t(`especialista.vista.servicios.${clave}.titulo`)}
                    </h3>
                    <p className="text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                      {t(`especialista.vista.servicios.${clave}.descripcion`)}
                    </p>
                  </div>
                </LuxCard>
              ))}
            </div>
          </section>
          <section
            aria-labelledby="especialista-enfoque"
            className="space-y-4 border-t border-neutral-200/80 pt-8 dark:border-white/10"
          >
            <Kicker>{t('especialista.vista.enfoque.kicker')}</Kicker>
            <h2
              id="especialista-enfoque"
              className={`${TITULO_SECCION} max-w-2xl`}
            >
              {t('especialista.vista.enfoque.titulo')}
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
              {t('especialista.vista.enfoque.descripcion')}
            </p>
            <p className="text-sm font-medium text-lux-blue dark:text-white">
              {t('especialista.vista.enfoque.complemento')}
            </p>
          </section>
          <section aria-labelledby="especialista-contacto">
            <LuxCard className="space-y-4 bg-lux-gray p-6 dark:bg-[#0e0e0e] sm:p-8">
              <Kicker>{t('especialista.vista.contacto.kicker')}</Kicker>
              <h2 id="especialista-contacto" className={TITULO_SECCION}>
                {t('especialista.vista.contacto.titulo')}
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                {t('especialista.vista.contacto.descripcion')}
              </p>
              <button
                type="button"
                onClick={contactar}
                className={BOTON_CONTACTO}
              >
                <MessageCircle
                  size={14}
                  className="shrink-0"
                  aria-hidden="true"
                />
                {t('especialista.contactar')}
              </button>
              <p className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <MapPin size={14} className="shrink-0" aria-hidden="true" />
                {t('especialista.vista.ubicacion')}
              </p>
            </LuxCard>
          </section>
        </>
      ) : null}
    </div>
  );
};
