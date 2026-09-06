import { useIdioma } from '../../core/i18n/idioma.context';
import type { ClaveTexto } from '../../core/i18n/catalogos/es';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  FileText,
  ShieldCheck,
  Activity,
  ArrowRight,
  CalendarClock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listarPersonas } from '../../core/api/personas.service';
import { listarExpedientes } from '../../core/api/expedientes.service';
import { listarCitas } from '../../core/api/agenda.service';
import { TipoPersona } from '../../core/models/persona';
import { EstadoCita } from '../../core/models/agenda';
import { useAuth } from '../../core/auth/auth.context';
import { Rol } from '../../core/models/rol';
import {
  Kicker,
  LuxCard,
  fadeUp,
  fadeUpItem,
  stagger,
} from '../../shared/ui';

const BRANDS = [
  { name: 'Ray-Ban®', desc: 'marca.rayban' },
  { name: 'Oakley®', desc: 'marca.oakley' },
  { name: 'Persol®', desc: 'marca.persol' },
  { name: 'Varilux®', desc: 'marca.varilux' },
  { name: 'Transitions®', desc: 'marca.transitions' },
  { name: 'Eyezen™', desc: 'marca.eyezen' },
];

interface Kpi {
  label: ClaveTexto;
  value: string;
  caption: string;
  icon: typeof Users;
}

export const DashboardPage = () => {
  const { t } = useIdioma();
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState(0);
  const [empleados, setEmpleados] = useState(0);
  const [expedientes, setExpedientes] = useState(0);
  const [citasHoy, setCitasHoy] = useState(0);

  useEffect(() => {
    listarPersonas()
      .then((ps) => {
        setPacientes(ps.filter((p) => p.tipo === TipoPersona.PACIENTE).length);
        setEmpleados(ps.filter((p) => p.tipo === TipoPersona.EMPLEADO).length);
      })
      .catch(() => undefined);
    // Las canceladas no cuentan: el panel responde «a cuánta gente se atiende
    // hoy», no «cuántas filas hay en la tabla».
    listarCitas({ fecha: new Date().toISOString().slice(0, 10) })
      .then((cs) => setCitasHoy(cs.filter((c) => c.estado !== EstadoCita.CANCELADA).length))
      .catch(() => undefined);
    if (hasRole([Rol.DOCTOR, Rol.ADMINISTRADOR])) {
      listarExpedientes()
        .then((es) => setExpedientes(es.length))
        .catch(() => undefined);
    }
  }, [hasRole]);

  const kpis: Kpi[] = [
    {
      label: 'panel.pacientes',
      value: pacientes.toString().padStart(2, '0'),
      caption: 'panel.pacientesSub',
      icon: Users,
    },
    {
      label: 'panel.expedientes',
      value: expedientes.toString().padStart(2, '0'),
      caption: 'panel.expedientesSub',
      icon: FileText,
    },
    {
      label: 'panel.citasHoy',
      value: citasHoy.toString().padStart(2, '0'),
      caption: 'panel.citasHoySub',
      icon: CalendarClock,
    },
    {
      label: 'panel.personal',
      value: empleados.toString().padStart(2, '0'),
      caption: 'panel.personalSub',
      icon: Activity,
    },
    {
      label: 'panel.integridad',
      value: '100%',
      caption: 'panel.integridadSub',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="space-y-12">
      {/* HERO */}
      <motion.section
        {...fadeUp}
        className="relative flex h-[58vh] min-h-[380px] flex-col items-center justify-center overflow-hidden bg-black text-center"
      >
        <div className="absolute inset-0 bg-lux-blue" style={{ mixBlendMode: 'multiply' }}>
          <img
            src="https://images.unsplash.com/photo-1539036776273-021ec1d78bec?auto=format&fit=crop&q=80&w=1500"
            alt="Examen de refracción con foróptero"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover opacity-70"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/85" />
        <div className="relative z-10 max-w-4xl space-y-6 px-4">
          <span className="block text-[10px] font-bold uppercase tracking-[0.35em] text-lux-tinta-claro md:text-xs">
            Óptica Dr. Luigi Semeraro
          </span>
          <h1 className="font-serif text-4xl italic leading-none tracking-tight text-white md:text-6xl">
            {t('panel.lema')}
          </h1>
          <p className="mx-auto max-w-2xl text-xs font-light leading-relaxed text-zinc-300 md:text-sm">
            {t('panel.intro')}
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <button
              onClick={() => navigate('/admin/personas')}
              className="transition-luxe border border-white px-6 py-3 text-xs font-semibold uppercase tracking-widest text-white hover:bg-white hover:text-black"
            >
              {t('panel.gestionarPacientes')}
            </button>
            <button
              onClick={() => navigate('/admin/expedientes')}
              className="transition-luxe border border-lux-tinta-claro px-6 py-3 text-xs font-semibold uppercase tracking-widest text-lux-tinta-claro hover:bg-lux-tinta-claro hover:text-black"
            >
              {t('panel.abrirExpedientes')}
            </button>
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 opacity-60">
          <span className="font-mono text-[8px] uppercase tracking-widest text-white/50">{t('panel.verMetricas')}</span>
          <div className="h-6 w-px animate-bounce bg-lux-tinta-claro/60" />
        </div>
      </motion.section>

      {/* MARCAS */}
      <section>
        <Kicker>{t('panel.marcas')}</Kicker>
        <motion.div
          variants={stagger}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6"
        >
          {BRANDS.map((b) => (
            <motion.div key={b.name} variants={fadeUpItem}>
              <LuxCard hover className="flex flex-col items-center justify-center p-4 text-center">
                <span className="font-display text-sm font-bold uppercase tracking-widest text-lux-tinta">
                  {b.name}
                </span>
                <span className="mt-1.5 text-[9px] uppercase tracking-wider opacity-60">
                  {t(b.desc as ClaveTexto)}
                </span>
              </LuxCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* KPIs */}
      <section>
        <Kicker>{t('panel.indicadores')}</Kicker>
        <motion.div
          variants={stagger}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <motion.div key={t(k.label)} variants={fadeUpItem}>
                <LuxCard hover className="group flex flex-col gap-4 p-6">
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-lux-tinta" strokeWidth={1.5} />
                    <ArrowRight className="transition-luxe h-4 w-4 text-neutral-300 group-hover:translate-x-0.5 group-hover:text-lux-tinta dark:text-neutral-600" />
                  </div>
                  <div>
                    <span className="font-serif text-4xl italic tracking-tight text-lux-blue dark:text-white">
                      {k.value}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-200">
                      {t(k.label)}
                    </span>
                    <span className="mt-0.5 block text-[10px] uppercase tracking-wider text-neutral-400">
                      {k.caption}
                    </span>
                  </div>
                </LuxCard>
              </motion.div>
            );
          })}
        </motion.div>
      </section>
    </div>
  );
};
