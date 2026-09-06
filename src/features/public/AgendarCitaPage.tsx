import { useState, type FormEvent } from 'react';
import { CalendarCheck, Info, MessageCircle } from 'lucide-react';
import { useCanalContacto } from '../../core/api/contacto';
import { construirMensajeCita } from '../../core/models/cita-whatsapp';
import { useIdioma } from '../../core/i18n/idioma.context';
import {
  LuxButton,
  LuxCard,
  SectionHeader,
  fieldInputClass,
  fieldLabelClass,
} from '../../shared/ui';

/**
 * Solicitud de cita guiada hacia WhatsApp (CU-11, `DSO-41`).
 *
 * ⚠️ **Esta pantalla no agenda nada, y es deliberado.** El caso de uso es
 * explícito: *«El sistema NO realiza modificaciones ni bloqueos en la base de
 * datos de la agenda»* y *«el estado de la agenda permanece intacto hasta que
 * recepción intervenga»*. Aquí se recoge nombre y motivo, se arma un texto y se
 * abre WhatsApp. Punto.
 *
 * Quien reciba el mensaje lo registra en la agenda real con CU-05 —que ya está
 * construida—, y ahí sí se valida el cupo con EX-06. Si algún día esta página
 * empieza a llamar a `POST /citas`, se rompió esa separación: dos personas
 * podrían "reservar" el mismo hueco sin que nadie lo validara.
 */
export const AgendarCitaPage = () => {
  const { nombreOptica, aviso, abrirWhatsapp, limpiarAviso } = useCanalContacto();
  const { t } = useIdioma();
  const [nombre, setNombre] = useState('');
  const [motivo, setMotivo] = useState('');
  const [enviada, setEnviada] = useState(false);

  const completo = nombre.trim().length > 0 && motivo.trim().length > 0;

  const solicitar = (e: FormEvent) => {
    e.preventDefault();
    if (!completo) return;
    limpiarAviso();
    const abrio = abrirWhatsapp(
      construirMensajeCita({ nombre, motivo }, nombreOptica),
    );
    setEnviada(abrio);
  };

  return (
    <section className="space-y-10">
      <SectionHeader
        kicker={t('agendar.kicker')}
        title={t('agendar.titulo')}
        description={t('agendar.descripcion')}
      />

      {/* EX-13 con el literal del caso de uso. */}
      {aviso ? (
        <p
          role="alert"
          className="border border-amber-300/40 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-300"
        >
          {aviso}
        </p>
      ) : null}

      {enviada ? (
        <LuxCard className="flex flex-col items-center gap-4 p-10 text-center">
          <CalendarCheck className="h-9 w-9 text-emerald-600" strokeWidth={1.4} />
          <p className="max-w-md text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            {t('agendar.exito.aviso')}{' '}
            <strong>{t('agendar.exito.enfasis')}</strong>{' '}
            {t('agendar.exito.resto')}
          </p>
          <LuxButton type="button" variant="ghost" onClick={() => setEnviada(false)}>
            {t('agendar.exito.otra')}
          </LuxButton>
        </LuxCard>
      ) : (
        <LuxCard className="p-8">
          <form onSubmit={solicitar} className="space-y-5">
            <div>
              <label className={fieldLabelClass} htmlFor="nombre">
                {t('agendar.campo.nombre')}
              </label>
              <input
                id="nombre"
                required
                maxLength={150}
                autoComplete="name"
                className={fieldInputClass}
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            <div>
              <label className={fieldLabelClass} htmlFor="motivo">
                {t('agendar.campo.motivo')}
              </label>
              <textarea
                id="motivo"
                required
                rows={4}
                maxLength={500}
                className={fieldInputClass}
                placeholder={t('agendar.campo.motivoEjemplo')}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
              />
            </div>

            <LuxButton
              type="submit"
              variant="tinta"
              className="w-full"
              disabled={!completo}
            >
              <MessageCircle size={14} />
              {t('agendar.enviar')}
            </LuxButton>
          </form>
        </LuxCard>
      )}

      {/*
        Que quede claro para quien use la página: esto no reserva. El CU insiste
        tanto en ello que callarlo sería dejar que la persona asuma otra cosa.
      */}
      <LuxCard className="flex items-start gap-3 bg-lux-gray p-6 dark:bg-[#0e0e0e]">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-lux-tinta" strokeWidth={1.5} />
        <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
          {t('agendar.aviso.inicio')}{' '}
          <strong>{t('agendar.aviso.enfasis')}</strong>
          {t('agendar.aviso.resto')}
        </p>
      </LuxCard>
    </section>
  );
};
