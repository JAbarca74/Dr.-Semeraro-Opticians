import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, ShieldCheck, Activity, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listarPersonas } from '../../core/api/personas.service';
import { listarExpedientes } from '../../core/api/expedientes.service';
import { TipoPersona } from '../../core/models/persona';
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
  { name: 'Ray-Ban®', desc: 'Estilo clásico e inconfundible' },
  { name: 'Oakley®', desc: 'Rendimiento deportivo extremo' },
  { name: 'Persol®', desc: 'Artesanía italiana inigualable' },
  { name: 'Varilux®', desc: 'Lentes progresivas líderes' },
  { name: 'Transitions®', desc: 'Control adaptativo inteligente' },
  { name: 'Eyezen™', desc: 'Filtros de descanso digital' },
];

interface Kpi {
  label: string;
  value: string;
  caption: string;
  icon: typeof Users;
}

export const DashboardPage = () => {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState(0);
  const [empleados, setEmpleados] = useState(0);
  const [expedientes, setExpedientes] = useState(0);

  useEffect(() => {
    listarPersonas()
      .then((ps) => {
        setPacientes(ps.filter((p) => p.tipo === TipoPersona.PACIENTE).length);
        setEmpleados(ps.filter((p) => p.tipo === TipoPersona.EMPLEADO).length);
      })
      .catch(() => undefined);
    if (hasRole([Rol.DOCTOR, Rol.ADMINISTRADOR])) {
      listarExpedientes()
        .then((es) => setExpedientes(es.length))
        .catch(() => undefined);
    }
  }, [hasRole]);

  const kpis: Kpi[] = [
    {
      label: 'Pacientes registrados',
      value: pacientes.toString().padStart(2, '0'),
      caption: 'Fichas clínicas activas',
      icon: Users,
    },
    {
      label: 'Expedientes clínicos',
      value: expedientes.toString().padStart(2, '0'),
      caption: 'Con evaluaciones y refracción',
      icon: FileText,
    },
    {
      label: 'Personal de clínica',
      value: empleados.toString().padStart(2, '0'),
      caption: 'Empleados y especialistas',
      icon: Activity,
    },
    {
      label: 'Integridad documental',
      value: '100%',
      caption: 'Recetas selladas con SHA-256',
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
            src="https://images.unsplash.com/photo-1473186578172-c141e6798cf4?auto=format&fit=crop&q=80&w=1500"
            alt="Laboratorio óptico"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover opacity-45 mix-blend-luminosity grayscale"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/85" />
        <div className="relative z-10 max-w-4xl space-y-6 px-4">
          <span className="block text-[10px] font-bold uppercase tracking-[0.35em] text-lux-gold md:text-xs">
            Óptica Dr. Luigi Semeraro
          </span>
          <h1 className="font-serif text-4xl italic leading-none tracking-tight text-white md:text-6xl">
            La belleza de la precisión visual
          </h1>
          <p className="mx-auto max-w-2xl text-xs font-light leading-relaxed text-zinc-300 md:text-sm">
            Potenciamos la consulta del Dr. Luigi Semeraro con la cartera de aros de
            diseño y lentes computarizados más respetada del mundo.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <button
              onClick={() => navigate('/admin/personas')}
              className="transition-luxe border border-white px-6 py-3 text-xs font-semibold uppercase tracking-widest text-white hover:bg-white hover:text-black"
            >
              Gestionar pacientes
            </button>
            <button
              onClick={() => navigate('/admin/expedientes')}
              className="transition-luxe border border-lux-gold px-6 py-3 text-xs font-semibold uppercase tracking-widest text-lux-gold hover:bg-lux-gold hover:text-black"
            >
              Abrir expedientes
            </button>
          </div>
        </div>
        <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-1 opacity-60">
          <span className="font-mono text-[8px] uppercase tracking-widest text-white/50">
            Ver métricas
          </span>
          <div className="h-6 w-px animate-bounce bg-lux-gold/60" />
        </div>
      </motion.section>

      {/* MARCAS */}
      <section>
        <Kicker>Nuestras marcas emblemáticas en clínica</Kicker>
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
                <span className="font-display text-sm font-bold uppercase tracking-widest text-lux-gold">
                  {b.name}
                </span>
                <span className="mt-1.5 text-[9px] uppercase tracking-wider opacity-60">
                  {b.desc}
                </span>
              </LuxCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* KPIs */}
      <section>
        <Kicker>Indicadores en tiempo real</Kicker>
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
              <motion.div key={k.label} variants={fadeUpItem}>
                <LuxCard hover className="group flex flex-col gap-4 p-6">
                  <div className="flex items-center justify-between">
                    <Icon className="h-5 w-5 text-lux-gold" strokeWidth={1.5} />
                    <ArrowRight className="transition-luxe h-4 w-4 text-neutral-300 group-hover:translate-x-0.5 group-hover:text-lux-gold dark:text-neutral-600" />
                  </div>
                  <div>
                    <span className="font-serif text-4xl italic tracking-tight text-lux-blue dark:text-white">
                      {k.value}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-200">
                      {k.label}
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
