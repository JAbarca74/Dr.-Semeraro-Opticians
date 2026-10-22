import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Award,
  BadgeCheck,
  ImageOff,
  MessageCircle,
  Stethoscope,
} from 'lucide-react';
import { listarEspecialistas } from '../../core/api/especialistas.service';
import { parametrosPublicos } from '../../core/api/catalogo.service';
import {
  construirMensajeEspecialista,
  type EspecialistaVitrina,
} from '../../core/models/especialista';
import { enlaceWhatsapp, numeroLegible } from '../../core/models/catalogo';
import { mensajeDeError } from '../../shared/error';
import { useIdioma } from '../../core/i18n/idioma.context';
import {
  Alert,
  Kicker,
  LuxCard,
  SectionHeader,
  fadeUp,
  fadeUpItem,
  stagger,
} from '../../shared/ui';

/**
 * Perfil del especialista (CU-13, `DSO-37`).
 *
 * ⚠️ **Hasta esta versión, esta página se inventaba las credenciales.** Llevaba
 * escrito a mano «Licencia médica COPT-4421» —un número que no existe— junto a
 * la fotografía real del doctor, más una frase entrecomillada que se le atribuía
 * y tres tarjetas de credenciales, todas redactadas por el proyecto. Era el
 * hallazgo `06-estado-y-hallazgos.md` §3.9, abierto desde el 2026-08-06.
 *
 * Ahora **todo lo que se afirma sobre él sale de la base** (`GET /especialistas`,
 * `DSO-38`), y lo que la base no tiene **no se pinta**: sin código profesional no
 * hay línea de colegiatura, y sin frase propia no hay cita entrecomillada. Es
 * deliberado. Si aquí vuelve a aparecer un dato escrito a mano sobre una persona
 * real, se está reabriendo §3.9.
 */
export const PerfilEspecialistaPage = () => {
  const { t } = useIdioma();
  const [especialista, setEspecialista] = useState<EspecialistaVitrina | null>(
    null,
  );
  const [nombreOptica, setNombreOptica] = useState('la óptica');
  const [whatsapp, setWhatsapp] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState('');
  const [avisoCanal, setAvisoCanal] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    listarEspecialistas()
      .then((lista) => {
        // CU-13 describe la página de «Nuestro Especialista» en singular. Si
        // algún día hay más de uno publicado, esta vista muestra el primero y
        // habrá que decidir cómo se listan: no es un caso que el CU contemple.
        setEspecialista(lista[0] ?? null);
        setError('');
      })
      .catch((e) =>
        setError(mensajeDeError(e, t('especialista.error'))),
      )
      .finally(() => setCargando(false));

    parametrosPublicos()
      .then((p) => {
        setWhatsapp(p['optica.whatsapp'] ?? '');
        setTelefono(p['optica.telefono'] ?? '');
        setNombreOptica(p['optica.nombre'] ?? 'la óptica');
      })
      .catch(() => {
        // Sin parámetros no se puede redirigir; el botón lo dirá con EX-15.
      });
    // `t` solo se usa para el texto de respaldo del error. Meterlo en las
    // dependencias haría que cambiar de idioma volviera a pedir el perfil.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * CU-13 pasos 5–6: abre WhatsApp con el mensaje predefinido.
   *
   * **EX-15** cubre los dos modos de fallo: que no haya canal configurado y que
   * el navegador bloquee la ventana emergente (`window.open` devuelve `null`).
   * En ambos el comportamiento que pide el caso de uso es el mismo — mostrar el
   * teléfono del consultorio— así que se resuelve en un solo sitio.
   */
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

    const mensaje = construirMensajeEspecialista(especialista, nombreOptica);
    const ventana = window.open(enlaceWhatsapp(whatsapp, mensaje), '_blank');
    if (!ventana) {
      setAvisoCanal(
        `Canal no disponible. ${
          telefono ? respaldo : `Llámenos al ${numeroLegible(whatsapp)}.`
        }`,
      );
    }
  };

  /**
   * ⚠️ **El plural se resuelve aquí, no en el modelo.** `experienciaLegible()`
   * devolvía el texto ya armado en español; con tres idiomas el número y su
   * sustantivo tienen que juntarse en la pantalla, que es la que sabe el
   * idioma. Se distingue el singular para no escribir «1 años».
   */
  const anios = especialista?.aniosExperiencia ?? null;
  const experiencia =
    anios === null || anios <= 0
      ? null
      : anios === 1
        ? t('especialista.experiencia.uno')
        : `${anios} ${t('especialista.experiencia.varios')}`;

  return (
    <section className="space-y-12">
      <SectionHeader
        kicker={t('especialista.kicker')}
        title={especialista ? especialista.nombre : t('especialista.titulo')}
        /*
          Descripción fija y genérica **a propósito**: la biografía se pinta en
          el cuerpo, y ponerla también aquí la mostraba dos veces seguidas.
        */
        description={t('especialista.descripcion')}
      />

      {error ? <Alert>{error}</Alert> : null}

      {avisoCanal ? (
        <p
          role="alert"
          className="border border-amber-300/40 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-300"
        >
          {avisoCanal}
        </p>
      ) : null}

      {!especialista ? (
        <LuxCard className="p-12 text-center">
          <p className="text-sm text-neutral-500">
            {cargando
              ? t('especialista.cargando')
              : t('especialista.noPublicado')}
          </p>
        </LuxCard>
      ) : (
        <>
          <div className="grid items-center gap-10 lg:grid-cols-12">
            <motion.div
              {...fadeUp}
              className="relative aspect-4/5 overflow-hidden border border-lux-blue/10 dark:border-white/10 lg:col-span-5"
            >
              {especialista.fotoUrl ? (
                <img
                  src={especialista.fotoUrl}
                  alt={especialista.nombre}
                  className="transition-luxe h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full flex-col items-center justify-center gap-2 bg-stone-100 text-neutral-300 dark:bg-neutral-900 dark:text-neutral-700">
                  <ImageOff size={28} />
                  <span className="text-[10px] uppercase tracking-wider">
                    {t('especialista.sinFoto')}
                  </span>
                </span>
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/50 via-transparent to-transparent" />
              {/*
                La línea de colegiatura solo existe si la base tiene el código.
                Antes estaba escrita a mano y era falsa: ver §3.9.
              */}
              {especialista.codigoProfesional ? (
                <span className="absolute bottom-5 left-5 font-mono text-[9px] uppercase tracking-widest text-white/80">
                  {t('especialista.codigo')} {especialista.codigoProfesional}
                </span>
              ) : null}
            </motion.div>

            <motion.div {...fadeUp} className="space-y-6 lg:col-span-7">
              <Kicker>{especialista.titulo}</Kicker>

              {/*
                CU-13 paso 2 pide «años de experiencia». Si nadie lo ha aportado,
                la línea no se pinta: un «0 años» sería un dato inventado más.
              */}
              {experiencia ? (
                <p className="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
                  <Stethoscope className="h-4 w-4 text-lux-tinta" strokeWidth={1.5} />
                  {experiencia}
                </p>
              ) : null}

              {especialista.filosofia ? (
                <p className="font-serif text-2xl font-light leading-relaxed tracking-tight text-lux-blue dark:text-white md:text-3xl">
                  “{especialista.filosofia}”
                </p>
              ) : null}

              {especialista.biografia ? (
                <p className="max-w-xl text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
                  {especialista.biografia}
                </p>
              ) : null}

              {/* CU-13 paso 4: el botón, «de forma visible». */}
              <button
                type="button"
                onClick={contactar}
                className="transition-luxe inline-flex items-center gap-2 bg-lux-tinta px-7 py-3.5 text-[11px] font-semibold uppercase tracking-wider2 text-white hover:bg-lux-blue dark:hover:bg-lux-tinta-claro dark:hover:text-black"
              >
                <MessageCircle size={14} />
                {t('especialista.contactar')}
              </button>

              {/*
                Flujos alternos de CU-13: quien ya tiene cuenta entra a su panel
                y quien no la tiene va al registro del CU-10.
              */}
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('especialista.yaPaciente')}{' '}
                <Link to="/login" className="underline hover:text-lux-tinta">
                  {t('especialista.entrar')}
                </Link>{' '}
                {t('especialista.paraVer')}{' '}
                <Link to="/registro" className="underline hover:text-lux-tinta">
                  {t('especialista.crearCuenta')}
                </Link>
                .
              </p>
            </motion.div>
          </div>

          {/*
            CU-13 paso 2 · especialidades. Antes eran tres tarjetas con texto
            redactado por el proyecto; ahora salen del catálogo `especializacion`.
          */}
          {especialista.especialidades.length > 0 ? (
            <motion.div
              variants={stagger}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="grid gap-6 md:grid-cols-3"
            >
              {especialista.especialidades.map((especialidad) => (
                <motion.div key={especialidad} variants={fadeUpItem}>
                  <LuxCard hover className="flex h-full flex-col gap-4 p-7">
                    <span className="flex h-10 w-10 items-center justify-center border border-neutral-200 text-lux-tinta dark:border-white/10">
                      <BadgeCheck className="h-5 w-5" strokeWidth={1.5} />
                    </span>
                    <h3 className="font-serif text-lg font-bold text-lux-blue dark:text-white">
                      {especialidad}
                    </h3>
                  </LuxCard>
                </motion.div>
              ))}
            </motion.div>
          ) : null}
        </>
      )}

      <motion.div {...fadeUp}>
        <LuxCard className="flex flex-col items-center justify-between gap-4 bg-lux-gray p-8 text-center dark:bg-[#0e0e0e] sm:flex-row sm:text-left">
          <div className="flex items-center gap-3">
            <Award className="h-6 w-6 text-lux-tinta" strokeWidth={1.2} />
            <p className="font-serif text-xl font-light text-lux-blue dark:text-white">
              {t('especialista.atencion')}
            </p>
          </div>
          <Link
            to="/catalogo"
            className="transition-luxe inline-flex items-center gap-2 border border-lux-blue px-6 py-3 text-[11px] font-semibold uppercase tracking-wider2 text-lux-blue hover:bg-lux-blue hover:text-white dark:border-lux-tinta-claro dark:text-lux-tinta-claro dark:hover:bg-lux-tinta-claro dark:hover:text-black"
          >
            {t('especialista.verColeccion')}
          </Link>
        </LuxCard>
      </motion.div>
    </section>
  );
};
