import { useIdioma } from '../../core/i18n/idioma.context';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarClock, ShieldCheck, Users } from 'lucide-react';
import { listarPersonas } from '../../core/api/personas.service';
import { listarCitas } from '../../core/api/agenda.service';
import { TipoPersona } from '../../core/models/persona';
import { EstadoCita } from '../../core/models/agenda';
import { useAuth } from '../../core/auth/auth.context';
import { RecepCard, RecepHeader, recepFade } from './RecepcionShared';

export const OverviewPage = () => {
  const { t } = useIdioma();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState(0);
  const [citasHoy, setCitasHoy] = useState(0);

  useEffect(() => {
    listarPersonas()
      .then((ps) => setPacientes(ps.filter((p) => p.tipo === TipoPersona.PACIENTE).length))
      .catch(() => undefined);
    // Las canceladas no cuentan: lo que el front desk necesita saber al abrir
    // es a cuánta gente atiende hoy.
    listarCitas({ fecha: new Date().toISOString().slice(0, 10) })
      .then((cs) => setCitasHoy(cs.filter((c) => c.estado !== EstadoCita.CANCELADA).length))
      .catch(() => undefined);
  }, []);

  return (
    <div>
      <RecepHeader
        cu={t('recepcion.kicker')}
        title={t('recepcion.saludo')}
        description={t('recepcion.descripcion')}
      />

      <div className="grid gap-6 lg:grid-cols-4">
        <motion.div {...recepFade} className="lg:col-span-1">
          <RecepCard className="flex h-full flex-col justify-between p-7">
            <Users className="h-5 w-5 text-lux-tinta" strokeWidth={1.5} />
            <div className="mt-6">
              <span className="font-serif text-5xl font-light text-lux-dark dark:text-white">
                {pacientes.toString().padStart(2, '0')}
              </span>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-neutral-700 dark:text-neutral-200">
                {t('recepcion.pacientesRegistrados')}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-neutral-400">
                {t('recepcion.baseActiva')}
              </p>
            </div>
          </RecepCard>
        </motion.div>

        <motion.div {...recepFade} className="lg:col-span-1">
          <RecepCard className="flex h-full flex-col justify-between p-7">
            <CalendarClock className="h-5 w-5 text-lux-tinta" strokeWidth={1.5} />
            <div className="mt-6">
              <span className="font-serif text-5xl font-light text-lux-dark dark:text-white">
                {citasHoy.toString().padStart(2, '0')}
              </span>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-neutral-700 dark:text-neutral-200">
                {t('recepcion.citasHoy')}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-neutral-400">
                {t('recepcion.sinCanceladas')}
              </p>
            </div>
          </RecepCard>
        </motion.div>

        <motion.div {...recepFade} className="lg:col-span-2">
          <RecepCard className="flex h-full flex-col justify-between p-7">
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-lux-blue">
                {t('recepcion.accionesRapidas')}
              </p>
              <h2 className="mt-2 font-serif text-2xl font-light text-lux-dark dark:text-white">
                {t('recepcion.queGestionar')}
              </h2>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => navigate('/recepcion/agenda')}
                className="group flex items-center justify-between border border-neutral-200 px-4 py-4 text-left transition-all duration-300 hover:border-lux-tinta hover:bg-lux-ice dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                <span className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-lux-dark dark:text-neutral-200">
                  <CalendarClock className="h-4 w-4 text-lux-tinta" /> {t('nav.recepcion.citas')}
                </span>
                <ArrowRight className="h-4 w-4 text-neutral-300 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-lux-tinta" />
              </button>
              <button
                onClick={() => navigate('/recepcion/pacientes')}
                className="group flex items-center justify-between border border-neutral-200 px-4 py-4 text-left transition-all duration-300 hover:border-lux-tinta hover:bg-lux-ice dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                <span className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-lux-dark dark:text-neutral-200">
                  <Users className="h-4 w-4 text-lux-tinta" /> {t('nav.recepcion.pacientes')}
                </span>
                <ArrowRight className="h-4 w-4 text-neutral-300 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-lux-tinta" />
              </button>
              <button
                onClick={() => navigate('/recepcion/recetas')}
                className="group flex items-center justify-between border border-neutral-200 px-4 py-4 text-left transition-all duration-300 hover:border-lux-tinta hover:bg-lux-ice dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                <span className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-lux-dark dark:text-neutral-200">
                  <ShieldCheck className="h-4 w-4 text-lux-tinta" /> {t('recepcion.verificarReceta')}
                </span>
                <ArrowRight className="h-4 w-4 text-neutral-300 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-lux-tinta" />
              </button>
            </div>
          </RecepCard>
        </motion.div>
      </div>

      <motion.p
        {...recepFade}
        className="mt-8 font-mono text-[10px] uppercase tracking-widest text-neutral-400"
      >
        {t('recepcion.operador')}: {user?.email} · {t('recepcion.perfilRbac')}
      </motion.p>
    </div>
  );
};
