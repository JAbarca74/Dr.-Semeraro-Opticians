import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, FileText, ShieldCheck, Stethoscope } from 'lucide-react';
import { listarPersonas } from '../../core/api/personas.service';
import {
  crearEvaluacion,
  emitirReceta,
  expedientePorPaciente,
} from '../../core/api/expedientes.service';
import { useAuth } from '../../core/auth/auth.context';
import { Rol } from '../../core/models/rol';
import { TipoPersona, type Persona } from '../../core/models/persona';
import {
  Ojo,
  type ExpedienteDetalle,
  type NuevaRefraccion,
} from '../../core/models/expediente';
import { mensajeDeError } from '../../shared/error';
import {
  Alert,
  Badge,
  LuxButton,
  LuxCard,
  SectionHeader,
  fadeUp,
  fieldInputClass,
  fieldLabelClass,
} from '../../shared/ui';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

interface RefraccionForm {
  esfera: string;
  cilindro: string;
  eje: string;
  adicion: string;
}

const REF_VACIA: RefraccionForm = { esfera: '', cilindro: '', eje: '', adicion: '' };
const CAMPOS_REF = ['esfera', 'cilindro', 'eje', 'adicion'] as const;

/** Avisos de rango óptico (CU-02, EX-03): esfera ±25, cilindro ±10, eje 0–180, adición 0–4. */
const fueraDeRango = (campo: keyof RefraccionForm, valor: string): boolean => {
  if (valor === '') return false;
  const n = Number(valor);
  if (Number.isNaN(n)) return true;
  if (campo === 'esfera') return n < -25 || n > 25;
  if (campo === 'cilindro') return n < -10 || n > 10;
  if (campo === 'eje') return n < 0 || n > 180;
  if (campo === 'adicion') return n < 0 || n > 4;
  return false;
};

const construirRefraccion = (
  ojo: Ojo,
  f: RefraccionForm,
): NuevaRefraccion | null => {
  if (f.esfera === '' && f.cilindro === '' && f.eje === '') return null;
  return {
    ojo,
    esfera: Number(f.esfera || 0),
    cilindro: Number(f.cilindro || 0),
    eje: Math.round(Number(f.eje || 0)),
    adicion: f.adicion ? Number(f.adicion) : undefined,
  };
};

export const ExpedientesPage = () => {
  const { hasRole } = useAuth();
  const esDoctor = hasRole([Rol.DOCTOR]);

  const [pacientes, setPacientes] = useState<Persona[]>([]);
  const [idPaciente, setIdPaciente] = useState(0);
  const [detalle, setDetalle] = useState<ExpedienteDetalle | null>(null);
  const [diagnosticos, setDiagnosticos] = useState('');
  const [notas, setNotas] = useState('');
  const [od, setOd] = useState<RefraccionForm>(REF_VACIA);
  const [oi, setOi] = useState<RefraccionForm>(REF_VACIA);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [guardando, setGuardando] = useState(false);

  const hayFueraDeRango = CAMPOS_REF.some(
    (c) => fueraDeRango(c, od[c]) || fueraDeRango(c, oi[c]),
  );

  useEffect(() => {
    listarPersonas()
      .then((ps) => setPacientes(ps.filter((p) => p.tipo === TipoPersona.PACIENTE)))
      .catch(() => undefined);
  }, []);

  const cargarDetalle = (id: number) => {
    if (!id) {
      setDetalle(null);
      return;
    }
    expedientePorPaciente(id)
      .then(setDetalle)
      .catch((e) => setError(mensajeDeError(e)));
  };

  useEffect(() => {
    setError('');
    setAviso('');
    cargarDetalle(idPaciente);
  }, [idPaciente]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setAviso('');
    if (!idPaciente) {
      setError('Seleccione un paciente');
      return;
    }
    if (hayFueraDeRango) {
      setError('Corrija los valores fuera de rango antes de guardar.');
      return;
    }
    setGuardando(true);
    try {
      const refracciones = [
        construirRefraccion(Ojo.DERECHO, od),
        construirRefraccion(Ojo.IZQUIERDO, oi),
      ].filter((r): r is NuevaRefraccion => r !== null);
      const evaluacion = await crearEvaluacion({
        idPaciente,
        diagnosticos: diagnosticos
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        notas: notas || undefined,
        refracciones: refracciones.length ? refracciones : undefined,
      });
      // CU-02 paso 7 / CU-16: persistir y generar la receta en la misma acción.
      try {
        await emitirReceta(evaluacion.idEvaluacionClinica);
        setAviso('Evaluación guardada y receta generada con sello digital.');
      } catch (e2) {
        setAviso(`Evaluación guardada, pero ${mensajeDeError(e2)}`);
      }
      setDiagnosticos('');
      setNotas('');
      setOd(REF_VACIA);
      setOi(REF_VACIA);
      cargarDetalle(idPaciente);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const emitir = async (idEvaluacion: number) => {
    setError('');
    try {
      await emitirReceta(idEvaluacion);
      cargarDetalle(idPaciente);
    } catch (e) {
      setError(mensajeDeError(e));
    }
  };

  const campoRefraccion = (
    etiqueta: string,
    valores: RefraccionForm,
    set: (v: RefraccionForm) => void,
  ) => (
    <fieldset className="border border-neutral-200 p-4 dark:border-white/10">
      <legend className="px-2 text-[10px] font-bold uppercase tracking-widest text-lux-gold">
        {etiqueta}
      </legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CAMPOS_REF.map((campo) => (
          <label key={campo} className="block">
            <span className="block text-[10px] font-bold uppercase tracking-widest capitalize text-neutral-500 dark:text-neutral-400">
              {campo}
            </span>
            <input
              type="number"
              step={campo === 'eje' ? '1' : '0.25'}
              className={[
                fieldInputClass,
                fueraDeRango(campo, valores[campo])
                  ? '!border-red-500 focus:!ring-red-400'
                  : '',
              ].join(' ')}
              value={valores[campo]}
              onChange={(e) => set({ ...valores, [campo]: e.target.value })}
            />
            {fueraDeRango(campo, valores[campo]) ? (
              <span className="mt-1 block text-[10px] font-semibold text-red-600">
                Fuera de rango
              </span>
            ) : null}
          </label>
        ))}
      </div>
    </fieldset>
  );

  return (
    <section className="space-y-10">
      <SectionHeader
        kicker="Historia clínica"
        title="Expedientes clínicos"
        description="Ficha médica, evolución optométrica y emisión de recetas con sello digital."
      />

      <motion.div {...fadeUp}>
        <LuxCard className="p-6">
          <label className="block max-w-md">
            <span className={fieldLabelClass}>Paciente</span>
            <select
              className={fieldInputClass}
              value={idPaciente}
              onChange={(e) => setIdPaciente(Number(e.target.value))}
            >
              <option value={0}>Seleccione un paciente…</option>
              {pacientes.map((p) => (
                <option key={p.idPersona} value={p.idPersona}>
                  {p.nombre} ({p.cedula})
                </option>
              ))}
            </select>
          </label>
        </LuxCard>
      </motion.div>

      {error ? <Alert>{error}</Alert> : null}
      {aviso ? (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 border border-emerald-500/30 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
        >
          <ShieldCheck className="h-4 w-4" /> {aviso}
        </motion.p>
      ) : null}

      {idPaciente && esDoctor ? (
        <motion.div {...fadeUp}>
          <LuxCard className="p-6">
            <div className="mb-5 flex items-center gap-2 border-b border-neutral-100 pb-4 dark:border-white/5">
              <Stethoscope className="h-4 w-4 text-lux-gold" strokeWidth={1.5} />
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-700 dark:text-neutral-200">
                Nueva evolución clínica
              </h2>
            </div>
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={fieldLabelClass}>Diagnósticos (uno por línea)</span>
                  <textarea
                    className={fieldInputClass}
                    rows={3}
                    value={diagnosticos}
                    onChange={(e) => setDiagnosticos(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className={fieldLabelClass}>Notas de evolución</span>
                  <textarea
                    className={fieldInputClass}
                    rows={3}
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                  />
                </label>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {campoRefraccion('Ojo derecho (OD)', od, setOd)}
                {campoRefraccion('Ojo izquierdo (OI)', oi, setOi)}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <LuxButton type="submit" variant="gold" disabled={guardando || hayFueraDeRango}>
                  <FileText className="h-3.5 w-3.5" /> Guardar y generar receta
                </LuxButton>
                {hayFueraDeRango ? (
                  <span className="text-xs font-semibold text-red-600">
                    Hay valores fuera de rango óptico.
                  </span>
                ) : null}
              </div>
            </form>
          </LuxCard>
        </motion.div>
      ) : null}

      {detalle ? (
        <div className="space-y-5">
          <h2 className="font-serif text-xl italic text-lux-blue dark:text-white">
            Evaluaciones de {detalle.expediente.paciente?.nombre}
          </h2>
          {detalle.evaluaciones.length === 0 ? (
            <p className="text-sm text-neutral-400">Sin evaluaciones registradas.</p>
          ) : null}
          {detalle.evaluaciones.map((ev) => (
            <motion.div key={ev.idEvaluacionClinica} {...fadeUp}>
              <LuxCard className="p-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-lux-blue dark:text-white">
                    {new Date(ev.fecha).toLocaleDateString()} ·{' '}
                    <span className="text-neutral-500">{ev.doctor?.nombre ?? 'Doctor'}</span>
                  </span>
                  {ev.receta ? <Badge tone="green">Receta sellada</Badge> : null}
                </div>
                {ev.diagnosticos?.length ? (
                  <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                    <span className="text-neutral-400">Diagnósticos: </span>
                    {ev.diagnosticos.join(', ')}
                  </p>
                ) : null}
                {ev.notas ? (
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                    {ev.notas}
                  </p>
                ) : null}

                {ev.refracciones?.length ? (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full max-w-lg text-left text-sm">
                      <thead>
                        <tr className="border-b border-neutral-100 dark:border-white/5">
                          {['Ojo', 'Esfera', 'Cilindro', 'Eje', 'Adición'].map((h) => (
                            <th
                              key={h}
                              className="py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {ev.refracciones.map((r) => (
                          <tr key={r.ojo} className="border-b border-neutral-50 last:border-0 dark:border-white/5">
                            <td className="py-2 font-semibold text-lux-gold">{r.ojo}</td>
                            <td className="py-2">{r.esfera}</td>
                            <td className="py-2">{r.cilindro}</td>
                            <td className="py-2">{r.eje}°</td>
                            <td className="py-2">{r.adicion ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                <div className="mt-4 border-t border-neutral-100 pt-4 dark:border-white/5">
                  {ev.receta ? (
                    <div className="flex flex-wrap items-start gap-4">
                      <img
                        src={ev.receta.codigoQr}
                        alt="QR de la receta"
                        className="h-28 w-28 border border-neutral-200 dark:border-white/10"
                      />
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="h-4 w-4" /> Receta emitida
                        </p>
                        <p className="break-all font-mono text-[10px] text-neutral-400">
                          SHA-256: {ev.receta.hashSha256}
                        </p>
                        <div className="flex flex-wrap gap-3 pt-1">
                          <Link
                            to={`/verificar/${ev.receta.hashSha256}`}
                            className="link-underline text-[11px] font-semibold uppercase tracking-wider text-lux-blue dark:text-lux-gold"
                          >
                            Verificar
                          </Link>
                          <a
                            href={`${API_BASE}/recetas/${ev.receta.hashSha256}/pdf`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-lux-blue hover:text-lux-gold dark:text-lux-gold"
                          >
                            <Download className="h-3 w-3" /> Descargar PDF
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : esDoctor ? (
                    <LuxButton type="button" variant="ghost" onClick={() => emitir(ev.idEvaluacionClinica)}>
                      Emitir receta con QR
                    </LuxButton>
                  ) : (
                    <span className="text-sm text-neutral-400">Sin receta.</span>
                  )}
                </div>
              </LuxCard>
            </motion.div>
          ))}
        </div>
      ) : null}
    </section>
  );
};
