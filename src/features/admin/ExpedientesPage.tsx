import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  FileText,
  FolderOpen,
  History,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRound,
  X,
} from 'lucide-react';
import { listarPersonas } from '../../core/api/personas.service';
import {
  crearEvaluacion,
  emitirReceta,
  expedientePorPaciente,
  listarExpedientes,
} from '../../core/api/expedientes.service';
import { useAuth } from '../../core/auth/auth.context';
import { Rol } from '../../core/models/rol';
import { TipoPersona, type Persona } from '../../core/models/persona';
import {
  Ojo,
  type ExpedienteDetalle,
  type NuevaRefraccion,
  type Refraccion,
} from '../../core/models/expediente';
import { mensajeDeError } from '../../shared/error';
import {
  Alert,
  Badge,
  Kicker,
  LuxButton,
  LuxCard,
  SectionHeader,
  cx,
  fadeUp,
  fadeUpItem,
  fieldInputClass,
  fieldLabelClass,
  stagger,
} from '../../shared/ui';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

interface RefraccionForm {
  esfera: string;
  cilindro: string;
  eje: string;
  adicion: string;
}

const REF_VACIA: RefraccionForm = {
  esfera: '',
  cilindro: '',
  eje: '',
  adicion: '',
};
const CAMPOS_REF = ['esfera', 'cilindro', 'eje', 'adicion'] as const;

/** Etiquetas visibles de cada parámetro (en español, con tildes). */
const ETIQUETA_REF: Record<keyof RefraccionForm, string> = {
  esfera: 'Esfera',
  cilindro: 'Cilindro',
  eje: 'Eje',
  adicion: 'Adición',
};

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

/** Vuelca una refracción guardada al formulario (CU-02 paso 4: precarga de la última consulta). */
const aFormulario = (r?: Refraccion): RefraccionForm =>
  r
    ? {
        esfera: r.esfera != null ? String(r.esfera) : '',
        cilindro: r.cilindro != null ? String(r.cilindro) : '',
        eje: r.eje != null ? String(r.eje) : '',
        adicion: r.adicion != null ? String(r.adicion) : '',
      }
    : REF_VACIA;

const formularioVacio = (f: RefraccionForm): boolean =>
  CAMPOS_REF.every((c) => f[c] === '');

const fechaCorta = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

export const ExpedientesPage = () => {
  const { hasRole } = useAuth();

  // Separación de responsabilidades por rol (RS-10 / RS-13):
  //  · Doctor        → documenta evoluciones y emite recetas.
  //  · Administrador → supervisa el historial en modo lectura; el backend
  //                    rechaza con 403 cualquier escritura clínica de su parte.
  const esDoctor = hasRole([Rol.DOCTOR]);
  const puedeDocumentar = esDoctor;

  const [pacientes, setPacientes] = useState<Persona[]>([]);
  const [conExpediente, setConExpediente] = useState<Set<number>>(new Set());
  const [busqueda, setBusqueda] = useState('');
  const [idPaciente, setIdPaciente] = useState(0);
  const [detalle, setDetalle] = useState<ExpedienteDetalle | null>(null);
  const [diagnosticos, setDiagnosticos] = useState('');
  const [notas, setNotas] = useState('');
  const [od, setOd] = useState<RefraccionForm>(REF_VACIA);
  const [oi, setOi] = useState<RefraccionForm>(REF_VACIA);
  const [precargadoDe, setPrecargadoDe] = useState('');
  const [confirmarCancelar, setConfirmarCancelar] = useState(false);
  const dialogoRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [guardando, setGuardando] = useState(false);

  const hayFueraDeRango = CAMPOS_REF.some(
    (c) => fueraDeRango(c, od[c]) || fueraDeRango(c, oi[c]),
  );

  const pacienteActivo =
    pacientes.find((p) => p.idPersona === idPaciente) ?? null;

  useEffect(() => {
    listarPersonas()
      .then((ps) =>
        setPacientes(ps.filter((p) => p.tipo === TipoPersona.PACIENTE)),
      )
      .catch((e) =>
        setError(mensajeDeError(e, 'No se pudieron cargar los pacientes')),
      );
    // Marca qué pacientes ya tienen expediente abierto en el dashboard.
    listarExpedientes()
      .then((es) => setConExpediente(new Set(es.map((e) => e.idPaciente))))
      .catch(() => undefined);
  }, []);

  // SRS §2.1.1.3: al abrir la ventana emergente el foco entra en ella, de modo
  // que la tecla Escape la cierra y el lector de pantalla la anuncia.
  useEffect(() => {
    if (confirmarCancelar) {
      dialogoRef.current?.focus();
    }
  }, [confirmarCancelar]);

  /** CU-02 §4.2.2: filtrado en tiempo real por número de cédula (y por nombre). */
  const filtrados = useMemo(() => {
    const t = busqueda.trim().toLowerCase();
    if (!t) return pacientes;
    return pacientes.filter(
      (p) =>
        p.cedula.toLowerCase().includes(t) ||
        p.nombre.toLowerCase().includes(t),
    );
  }, [pacientes, busqueda]);

  const limpiarFormulario = () => {
    setDiagnosticos('');
    setNotas('');
    setOd(REF_VACIA);
    setOi(REF_VACIA);
    setPrecargadoDe('');
  };

  /**
   * CU-02 paso 4: al abrir el expediente se cargan los parámetros de la última
   * consulta como punto de partida de la nueva evolución.
   */
  const precargarUltima = (d: ExpedienteDetalle) => {
    const ultima = d.evaluaciones[0];
    if (!ultima?.refracciones?.length) {
      setPrecargadoDe('');
      return;
    }
    setOd(aFormulario(ultima.refracciones.find((r) => r.ojo === Ojo.DERECHO)));
    setOi(
      aFormulario(ultima.refracciones.find((r) => r.ojo === Ojo.IZQUIERDO)),
    );
    setPrecargadoDe(fechaCorta(ultima.fecha));
  };

  const cargarDetalle = (id: number, precargar = false) => {
    if (!id) {
      setDetalle(null);
      return;
    }
    expedientePorPaciente(id)
      .then((d) => {
        setDetalle(d);
        if (precargar && puedeDocumentar) {
          precargarUltima(d);
        }
        setConExpediente((prev) => new Set(prev).add(id));
      })
      .catch((e) => setError(mensajeDeError(e)));
  };

  const abrirExpediente = (p: Persona) => {
    setError('');
    setAviso('');
    limpiarFormulario();
    setIdPaciente(p.idPersona);
    cargarDetalle(p.idPersona, true);
  };

  const volverAlBuscador = () => {
    setIdPaciente(0);
    setDetalle(null);
    setError('');
    setAviso('');
    limpiarFormulario();
  };

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
      limpiarFormulario();
      cargarDetalle(idPaciente);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  };

  /** CU-02 flujo alterno: cancelar exige confirmación y no guarda nada. */
  const pedirCancelar = () => {
    if (formularioVacio(od) && formularioVacio(oi) && !diagnosticos && !notas) {
      limpiarFormulario();
      return;
    }
    setConfirmarCancelar(true);
  };

  const confirmarDescarte = () => {
    limpiarFormulario();
    setConfirmarCancelar(false);
    setAviso('Se descartó la evolución en curso. No se guardó nada.');
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
            <span className="block text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              {ETIQUETA_REF[campo]}
            </span>
            <input
              type="number"
              step={campo === 'eje' ? '1' : '0.25'}
              className={cx(
                fieldInputClass,
                fueraDeRango(campo, valores[campo]) &&
                  '!border-red-500 focus:!ring-red-400',
              )}
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
        description={
          puedeDocumentar
            ? 'Localice al paciente por cédula, revise su evolución optométrica y emita recetas con sello digital.'
            : 'Consulta de historiales clínicos y recetas emitidas. La documentación de evoluciones corresponde al especialista.'
        }
        actions={
          <Badge tone={puedeDocumentar ? 'gold' : 'blue'}>
            {puedeDocumentar
              ? 'Modo clínico · Doctor'
              : 'Modo supervisión · solo lectura'}
          </Badge>
        }
      />

      {error ? <Alert>{error}</Alert> : null}
      {aviso ? (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 border border-emerald-500/30 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
        >
          <ShieldCheck className="h-4 w-4 shrink-0" /> {aviso}
        </motion.p>
      ) : null}

      {!pacienteActivo ? (
        <>
          {/* ── Indicadores del dashboard médico ─────────────────────────── */}
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="grid gap-4 sm:grid-cols-3"
          >
            {[
              {
                label: 'Pacientes registrados',
                valor: pacientes.length,
                icono: UserRound,
              },
              {
                label: 'Expedientes abiertos',
                valor: conExpediente.size,
                icono: FolderOpen,
              },
              {
                label: 'Coincidencias del filtro',
                valor: filtrados.length,
                icono: Search,
              },
            ].map((k) => (
              <motion.div key={k.label} variants={fadeUpItem}>
                <LuxCard hover className="flex items-center gap-4 p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-lux-gold/40 text-lux-gold">
                    <k.icono className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                  <div>
                    <span className="block font-serif text-2xl italic leading-none text-lux-blue dark:text-white">
                      {k.valor.toString().padStart(2, '0')}
                    </span>
                    <span className="mt-1 block text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                      {k.label}
                    </span>
                  </div>
                </LuxCard>
              </motion.div>
            ))}
          </motion.div>

          {/* ── Buscador por cédula (CU-02 paso 1) ───────────────────────── */}
          <motion.div {...fadeUp}>
            <LuxCard className="p-6">
              <div className="space-y-3">
                <Kicker>Buscador de pacientes</Kicker>
                <label className="block max-w-xl">
                  <span className={fieldLabelClass}>
                    Número de cédula o nombre
                  </span>
                  <span className="relative mt-1.5 block">
                    <Search
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                      strokeWidth={1.5}
                    />
                    <input
                      autoFocus
                      className={cx(fieldInputClass, 'mt-0 pl-10')}
                      placeholder="p. ej. 1-1234-5678 o Marta Jiménez"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                    />
                  </span>
                </label>
              </div>
            </LuxCard>
          </motion.div>

          {/* ── Tabla dinámica de historiales ────────────────────────────── */}
          <motion.div {...fadeUp}>
            <LuxCard className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/60 text-left dark:border-white/5 dark:bg-white/5">
                    {['Cédula', 'Paciente', 'Contacto', 'Expediente', ''].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((p) => (
                    <tr
                      key={p.idPersona}
                      onClick={() => abrirExpediente(p)}
                      className="transition-luxe cursor-pointer border-b border-neutral-50 last:border-0 hover:bg-lux-gold/5 dark:border-white/5"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-neutral-500 dark:text-neutral-400">
                        {p.cedula}
                      </td>
                      <td className="px-5 py-3 font-medium text-lux-blue dark:text-white">
                        {p.nombre}
                      </td>
                      <td className="px-5 py-3 text-neutral-500 dark:text-neutral-400">
                        {p.telefono || p.correo || '—'}
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          tone={
                            conExpediente.has(p.idPersona) ? 'green' : 'neutral'
                          }
                        >
                          {conExpediente.has(p.idPersona)
                            ? 'Abierto'
                            : 'Sin abrir'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="transition-luxe text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hover:text-lux-gold">
                          Abrir
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filtrados.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-10 text-center text-sm text-neutral-400"
                      >
                        {pacientes.length === 0
                          ? 'Aún no hay pacientes registrados.'
                          : 'Ningún paciente coincide con la búsqueda.'}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </LuxCard>
          </motion.div>
        </>
      ) : (
        <>
          {/* ── Ficha del paciente abierto ───────────────────────────────── */}
          <motion.div {...fadeUp}>
            <LuxCard className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-lux-gold/40 text-lux-gold">
                  <UserRound className="h-5 w-5" strokeWidth={1.5} />
                </span>
                <div className="space-y-1">
                  <Kicker>Expediente activo</Kicker>
                  <h2 className="font-serif text-2xl italic leading-none text-lux-blue dark:text-white">
                    {pacienteActivo.nombre}
                  </h2>
                  <p className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                    Cédula {pacienteActivo.cedula}
                    {pacienteActivo.telefono
                      ? ` · ${pacienteActivo.telefono}`
                      : ''}
                  </p>
                </div>
              </div>
              <LuxButton
                type="button"
                variant="ghost"
                onClick={volverAlBuscador}
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Cambiar de paciente
              </LuxButton>
            </LuxCard>
          </motion.div>

          {/* ── Nueva evolución: exclusiva del Doctor ────────────────────── */}
          {puedeDocumentar ? (
            <motion.div {...fadeUp}>
              <LuxCard className="p-6">
                <div className="mb-5 flex items-center gap-2 border-b border-neutral-100 pb-4 dark:border-white/5">
                  <Stethoscope
                    className="h-4 w-4 text-lux-gold"
                    strokeWidth={1.5}
                  />
                  <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-700 dark:text-neutral-200">
                    Nueva evolución clínica
                  </h2>
                </div>
                {precargadoDe ? (
                  <p className="mb-4 flex items-center gap-2 border border-lux-gold/30 bg-lux-gold/5 px-3 py-2 text-[11px] font-medium text-neutral-600 dark:text-neutral-300">
                    <History className="h-3.5 w-3.5 shrink-0 text-lux-gold" />
                    Se precargaron los parámetros de la consulta del{' '}
                    {precargadoDe}. Ajústelos según la evaluación de hoy.
                  </p>
                ) : null}
                <form onSubmit={onSubmit} className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className={fieldLabelClass}>
                        Diagnósticos (uno por línea)
                      </span>
                      <textarea
                        className={fieldInputClass}
                        rows={3}
                        value={diagnosticos}
                        onChange={(e) => setDiagnosticos(e.target.value)}
                      />
                    </label>
                    <label className="block">
                      <span className={fieldLabelClass}>
                        Notas de evolución
                      </span>
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
                    <LuxButton
                      type="submit"
                      variant="gold"
                      disabled={guardando || hayFueraDeRango}
                    >
                      <FileText className="h-3.5 w-3.5" /> Guardar y generar
                      receta
                    </LuxButton>
                    <LuxButton
                      type="button"
                      variant="ghost"
                      onClick={pedirCancelar}
                    >
                      Cancelar
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
          ) : (
            <motion.div {...fadeUp}>
              <LuxCard className="flex items-start gap-3 border-dashed p-5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-lux-gold" />
                <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
                  <span className="font-semibold">Modo supervisión.</span> Puede
                  consultar el historial clínico y las recetas emitidas, pero
                  registrar evoluciones y firmar recetas está reservado al
                  especialista.
                </p>
              </LuxCard>
            </motion.div>
          )}

          {/* ── Historial de evaluaciones ────────────────────────────────── */}
          {detalle ? (
            <div className="space-y-5">
              <h2 className="font-serif text-xl italic text-lux-blue dark:text-white">
                Evoluciones registradas
              </h2>
              {detalle.evaluaciones.length === 0 ? (
                <p className="text-sm text-neutral-400">
                  Sin evaluaciones registradas.
                </p>
              ) : null}
              {detalle.evaluaciones.map((ev) => (
                <motion.div key={ev.idEvaluacionClinica} {...fadeUp}>
                  <LuxCard className="p-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-lux-blue dark:text-white">
                        {new Date(ev.fecha).toLocaleDateString()} ·{' '}
                        <span className="text-neutral-500">
                          {ev.doctor?.nombre ?? 'Doctor'}
                        </span>
                      </span>
                      {ev.receta ? (
                        <Badge tone="green">Receta sellada</Badge>
                      ) : null}
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
                              {[
                                'Ojo',
                                'Esfera',
                                'Cilindro',
                                'Eje',
                                'Adición',
                              ].map((h) => (
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
                              <tr
                                key={r.ojo}
                                className="border-b border-neutral-50 last:border-0 dark:border-white/5"
                              >
                                <td className="py-2 font-semibold text-lux-gold">
                                  {r.ojo}
                                </td>
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
                      ) : puedeDocumentar ? (
                        <LuxButton
                          type="button"
                          variant="ghost"
                          onClick={() => emitir(ev.idEvaluacionClinica)}
                        >
                          Emitir receta con QR
                        </LuxButton>
                      ) : (
                        <span className="text-sm text-neutral-400">
                          Sin receta.
                        </span>
                      )}
                    </div>
                  </LuxCard>
                </motion.div>
              ))}
            </div>
          ) : null}
        </>
      )}

      {/* ── Confirmación de descarte (CU-02 flujo alterno) ───────────────── */}
      <AnimatePresence>
        {confirmarCancelar ? (
          <motion.div
            key="descartar-fondo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmarCancelar(false)}
            className="fixed inset-0 z-50 cursor-pointer bg-black"
          />
        ) : null}
        {confirmarCancelar ? (
          <motion.div
            key="descartar-dialogo"
            ref={dialogoRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-descartar"
            onKeyDown={(e) => {
              if (e.key === 'Escape') setConfirmarCancelar(false);
            }}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none"
          >
            <LuxCard className="w-full max-w-md p-6">
              <div className="mb-4 flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-white/5">
                <span id="titulo-descartar">
                  <Kicker>Descartar evolución</Kicker>
                </span>
                <button
                  type="button"
                  onClick={() => setConfirmarCancelar(false)}
                  className="transition-luxe cursor-pointer rounded-full border border-neutral-200 p-1.5 hover:bg-neutral-100 dark:border-white/10 dark:hover:bg-white/5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                Se limpiarán los datos de la consulta en curso y no se guardará
                nada en el expediente. ¿Desea continuar?
              </p>
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <LuxButton
                  type="button"
                  variant="ghost"
                  onClick={() => setConfirmarCancelar(false)}
                >
                  Volver
                </LuxButton>
                <LuxButton
                  type="button"
                  variant="danger"
                  onClick={confirmarDescarte}
                >
                  Descartar
                </LuxButton>
              </div>
            </LuxCard>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
};
