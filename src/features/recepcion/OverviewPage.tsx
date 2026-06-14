import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Users } from 'lucide-react';
import { listarPersonas } from '../../core/api/personas.service';
import { TipoPersona } from '../../core/models/persona';
import { useAuth } from '../../core/auth/auth.context';
import { RecepCard, RecepHeader, recepFade } from './RecepcionShared';

export const OverviewPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pacientes, setPacientes] = useState(0);

  useEffect(() => {
    listarPersonas()
      .then((ps) => setPacientes(ps.filter((p) => p.tipo === TipoPersona.PACIENTE).length))
      .catch(() => undefined);
  }, []);

  return (
    <div>
      <RecepHeader
        cu="Panel Central · Recepción"
        title="Buen día, recepción"
        description="Centro operativo del front desk de Óptica Dr. Semeraro. Gestione expedientes de pacientes y verifique la autenticidad de las recetas emitidas."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div {...recepFade} className="lg:col-span-1">
          <RecepCard className="flex h-full flex-col justify-between p-7">
            <Users className="h-5 w-5 text-lux-gold" strokeWidth={1.5} />
            <div className="mt-6">
              <span className="font-serif text-5xl font-light text-lux-dark dark:text-white">
                {pacientes.toString().padStart(2, '0')}
              </span>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-neutral-700 dark:text-neutral-200">
                Pacientes registrados
              </p>
              <p className="text-[10px] uppercase tracking-wider text-neutral-400">
                Base demográfica activa
              </p>
            </div>
          </RecepCard>
        </motion.div>

        <motion.div {...recepFade} className="lg:col-span-2">
          <RecepCard className="flex h-full flex-col justify-between p-7">
            <div>
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-lux-blue">
                Acciones rápidas
              </p>
              <h2 className="mt-2 font-serif text-2xl font-light text-lux-dark dark:text-white">
                ¿Qué desea gestionar?
              </h2>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => navigate('/recepcion/pacientes')}
                className="group flex items-center justify-between border border-neutral-200 px-4 py-4 text-left transition-all duration-300 hover:border-lux-gold hover:bg-lux-ice dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                <span className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-lux-dark dark:text-neutral-200">
                  <Users className="h-4 w-4 text-lux-gold" /> Expedientes
                </span>
                <ArrowRight className="h-4 w-4 text-neutral-300 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-lux-gold" />
              </button>
              <button
                onClick={() => navigate('/recepcion/recetas')}
                className="group flex items-center justify-between border border-neutral-200 px-4 py-4 text-left transition-all duration-300 hover:border-lux-gold hover:bg-lux-ice dark:border-neutral-700 dark:hover:bg-neutral-900"
              >
                <span className="flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-lux-dark dark:text-neutral-200">
                  <ShieldCheck className="h-4 w-4 text-lux-gold" /> Verificar receta
                </span>
                <ArrowRight className="h-4 w-4 text-neutral-300 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-lux-gold" />
              </button>
            </div>
          </RecepCard>
        </motion.div>
      </div>

      <motion.p
        {...recepFade}
        className="mt-8 font-mono text-[10px] uppercase tracking-widest text-neutral-400"
      >
        Operador: {user?.email} · Perfil de recepción · Acceso conforme a RBAC
      </motion.p>
    </div>
  );
};
