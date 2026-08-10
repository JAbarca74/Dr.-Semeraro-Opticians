import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import {
  Bell,
  CalendarClock,
  CalendarPlus,
  Check,
  Clock,
  Pencil,
  X,
} from 'lucide-react';
import {
  actualizarDisponibilidad,
  cambiarEstadoCita,
  crearCita,
  crearDisponibilidad,
  desactivarDisponibilidad,
  listarCitas,
  listarDisponibilidad,
} from '../../core/api/agenda.service';
import { generarRecordatorios } from '../../core/api/whatsapp.service';
import { listarPersonas } from '../../core/api/personas.service';
import {
  DIAS_SEMANA,
  EstadoCita,
  TRANSICIONES_ESTADO,
  type Cita,
  type DisponibilidadInput,
  type DisponibilidadMedica,
} from '../../core/models/agenda';
import { TipoPersona, type Persona } from '../../core/models/persona';
import type { ComunicacionWhatsapp } from '../../core/models/whatsapp';
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

const hoyISO = () => new Date().toISOString().slice(0, 10);

const TONO_ESTADO: Record<EstadoCita, 'neutral' | 'green' | 'red' | 'blue'> = {
  [EstadoCita.SOLICITADA]: 'neutral',
  [EstadoCita.CONFIRMADA]: 'green',
  [EstadoCita.CANCELADA]: 'red',
  [EstadoCita.REPROGRAMADA]: 'blue',
};

const FORM_DISPONIBILIDAD_VACIO: DisponibilidadInput = {
  idEmpleado: 0,
  diaSemana: 1,
  horaInicio: '08:00',
  horaFin: '17:00',
  duracionMin: 30,
  activo: true,
};

interface FormCita {
  idPaciente: number;
  idDisponibilidad: number;
  fecha: string;
  hora: string;
  telefono: string;
  motivo: string;
}

const FORM_CITA_VACIO: FormCita = {
  idPaciente: 0,
  idDisponibilidad: 0,
  fecha: hoyISO(),
  hora: '09:00',
  telefono: '',
  motivo: '',
};

type Tab = 'citas' | 'disponibilidad';

export const AgendaPage = () => {
  const [tab, setTab] = useState<Tab>('citas');
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [disponibilidad, setDisponibilidad] = useState<DisponibilidadMedica[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [fechaFiltro, setFechaFiltro] = useState(hoyISO());
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  const empleados = useMemo(
    () => personas.filter((p) => p.tipo === TipoPersona.EMPLEADO),
    [personas],
  );
  const pacientes = useMemo(
    () => personas.filter((p) => p.tipo === TipoPersona.PACIENTE),
    [personas],
  );
  const nombrePersona = useMemo(() => {
    const mapa = new Map(personas.map((p) => [p.idPersona, p.nombre]));
    return (id: number) => mapa.get(id) ?? `#${id}`;
  }, [personas]);
  const disponibilidadPorId = useMemo(
    () => new Map(disponibilidad.map((d) => [d.idDisponibilidadMedica, d])),
    [disponibilidad],
  );
  const etiquetaBloque = (d: DisponibilidadMedica) =>
    `${DIAS_SEMANA[d.diaSemana]} ${d.horaInicio.slice(0, 5)}–${d.horaFin.slice(0, 5)} · ${nombrePersona(d.idEmpleado)}`;

  const cargarBase = () => {
    listarPersonas()
      .then(setPersonas)
      .catch((e) => setError(mensajeDeError(e, 'No se pudieron cargar las personas')));
    listarDisponibilidad()
      .then(setDisponibilidad)
      .catch((e) => setError(mensajeDeError(e, 'No se pudo cargar la disponibilidad')));
  };

  const cargarCitas = (fecha: string) => {
    listarCitas({ fecha })
      .then(setCitas)
      .catch((e) => setError(mensajeDeError(e, 'No se pudieron cargar las citas')));
  };

  useEffect(cargarBase, []);
  useEffect(() => cargarCitas(fechaFiltro), [fechaFiltro]);

  return (
    <section className="space-y-10">
      <SectionHeader
        kicker="CU-05 · CU-06"
        title="Agenda"
        description="Bloques de disponibilidad del especialista, coordinación de citas y sus recordatorios por WhatsApp."
        actions={
          <div className="flex gap-2">
            <LuxButton
              variant={tab === 'citas' ? 'primary' : 'ghost'}
              onClick={() => setTab('citas')}
            >
              <CalendarClock className="h-3.5 w-3.5" /> Citas
            </LuxButton>
            <LuxButton
              variant={tab === 'disponibilidad' ? 'primary' : 'ghost'}
              onClick={() => setTab('disponibilidad')}
            >
              <Clock className="h-3.5 w-3.5" /> Disponibilidad
            </LuxButton>
          </div>
        }
      />

      {error ? <Alert>{error}</Alert> : null}
      {aviso ? <Alert>{aviso}</Alert> : null}

      {tab === 'disponibilidad' ? (
        <PanelDisponibilidad
          empleados={empleados}
          disponibilidad={disponibilidad}
          nombrePersona={nombrePersona}
          onCambio={() => {
            setError('');
            listarDisponibilidad()
              .then(setDisponibilidad)
              .catch((e) => setError(mensajeDeError(e)));
          }}
          onError={setError}
        />
      ) : (
        <PanelCitas
          pacientes={pacientes}
          disponibilidad={disponibilidad}
          disponibilidadPorId={disponibilidadPorId}
          etiquetaBloque={etiquetaBloque}
          nombrePersona={nombrePersona}
          citas={citas}
          fechaFiltro={fechaFiltro}
          setFechaFiltro={setFechaFiltro}
          onCambio={() => {
            setError('');
            cargarCitas(fechaFiltro);
          }}
          onError={setError}
          onAviso={setAviso}
        />
      )}
    </section>
  );
};

// ── Panel: disponibilidad médica (DSO-32 / DSO-33) ──────────────────────────
const PanelDisponibilidad = ({
  empleados,
  disponibilidad,
  nombrePersona,
  onCambio,
  onError,
}: {
  empleados: Persona[];
  disponibilidad: DisponibilidadMedica[];
  nombrePersona: (id: number) => string;
  onCambio: () => void;
  onError: (m: string) => void;
}) => {
  const [form, setForm] = useState<DisponibilidadInput>(FORM_DISPONIBILIDAD_VACIO);
  const [editId, setEditId] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    onError('');
    setGuardando(true);
    try {
      if (editId) {
        await actualizarDisponibilidad(editId, form);
      } else {
        await crearDisponibilidad(form);
      }
      setForm(FORM_DISPONIBILIDAD_VACIO);
      setEditId(null);
      onCambio();
    } catch (e) {
      onError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const editar = (d: DisponibilidadMedica) => {
    setEditId(d.idDisponibilidadMedica);
    setForm({
      idEmpleado: d.idEmpleado,
      diaSemana: d.diaSemana,
      horaInicio: d.horaInicio.slice(0, 5),
      horaFin: d.horaFin.slice(0, 5),
      duracionMin: d.duracionMin,
      activo: d.activo,
    });
  };

  const cancelar = () => {
    setEditId(null);
    setForm(FORM_DISPONIBILIDAD_VACIO);
  };

  const desactivar = async (id: number) => {
    onError('');
    try {
      await desactivarDisponibilidad(id);
      onCambio();
    } catch (e) {
      onError(mensajeDeError(e));
    }
  };

  return (
    <>
      <motion.div {...fadeUp}>
        <LuxCard className="p-6">
          <h2 className="mb-5 border-b border-neutral-100 pb-4 text-[11px] font-bold uppercase tracking-widest text-neutral-700 dark:border-white/5 dark:text-neutral-200">
            {editId ? 'Editar bloque de disponibilidad' : 'Nuevo bloque de disponibilidad'}
          </h2>
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label>
              <span className={fieldLabelClass}>Doctor / especialista</span>
              <select
                className={fieldInputClass}
                value={form.idEmpleado || ''}
                onChange={(e) =>
                  setForm({ ...form, idEmpleado: Number(e.target.value) })
                }
                required
                disabled={!!editId}
              >
                <option value="" disabled>
                  Seleccionar…
                </option>
                {empleados.map((p) => (
                  <option key={p.idPersona} value={p.idPersona}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={fieldLabelClass}>Día</span>
              <select
                className={fieldInputClass}
                value={form.diaSemana}
                onChange={(e) =>
                  setForm({ ...form, diaSemana: Number(e.target.value) })
                }
              >
                {DIAS_SEMANA.map((dia, i) => (
                  <option key={dia} value={i}>
                    {dia}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={fieldLabelClass}>Hora inicio</span>
              <input
                type="time"
                className={fieldInputClass}
                value={form.horaInicio}
                onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
                required
              />
            </label>
            <label>
              <span className={fieldLabelClass}>Hora fin</span>
              <input
                type="time"
                className={fieldInputClass}
                value={form.horaFin}
                onChange={(e) => setForm({ ...form, horaFin: e.target.value })}
                required
              />
            </label>
            <label>
              <span className={fieldLabelClass}>Duración por cita (min)</span>
              <input
                type="number"
                min={5}
                className={fieldInputClass}
                value={form.duracionMin ?? 30}
                onChange={(e) =>
                  setForm({ ...form, duracionMin: Number(e.target.value) })
                }
              />
            </label>
            <label className="flex items-end gap-2 pb-2.5">
              <input
                type="checkbox"
                checked={form.activo ?? true}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              />
              <span className={fieldLabelClass}>Activo</span>
            </label>

            <div className="col-span-full flex items-center gap-3 pt-2">
              <LuxButton type="submit" disabled={guardando}>
                {editId ? 'Guardar cambios' : 'Crear bloque'}
              </LuxButton>
              {editId ? (
                <LuxButton type="button" variant="ghost" onClick={cancelar}>
                  <X className="h-3.5 w-3.5" /> Cancelar
                </LuxButton>
              ) : null}
            </div>
          </form>
        </LuxCard>
      </motion.div>

      <motion.div {...fadeUp}>
        <LuxCard className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/60 text-left dark:border-white/5 dark:bg-white/5">
                {['Doctor', 'Día', 'Horario', 'Duración', 'Estado', ''].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {disponibilidad.map((d) => (
                <tr
                  key={d.idDisponibilidadMedica}
                  className="transition-luxe border-b border-neutral-50 last:border-0 hover:bg-lux-tinta/5 dark:border-white/5"
                >
                  <td className="px-5 py-3 font-medium text-lux-blue dark:text-white">
                    {nombrePersona(d.idEmpleado)}
                  </td>
                  <td className="px-5 py-3 text-neutral-500">{DIAS_SEMANA[d.diaSemana]}</td>
                  <td className="px-5 py-3 font-mono text-xs text-neutral-500">
                    {d.horaInicio.slice(0, 5)}–{d.horaFin.slice(0, 5)}
                  </td>
                  <td className="px-5 py-3 text-neutral-500">{d.duracionMin} min</td>
                  <td className="px-5 py-3">
                    <Badge tone={d.activo ? 'green' : 'neutral'}>
                      {d.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => editar(d)}
                        className="transition-luxe inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hover:text-lux-tinta"
                      >
                        <Pencil className="h-3 w-3" /> Editar
                      </button>
                      {d.activo ? (
                        <button
                          type="button"
                          onClick={() => desactivar(d.idDisponibilidadMedica)}
                          className="transition-luxe text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hover:text-red-600"
                        >
                          Desactivar
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {disponibilidad.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-neutral-400">
                    Sin bloques de disponibilidad registrados.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </LuxCard>
      </motion.div>
    </>
  );
};

// ── Panel: citas (DSO-34 / DSO-35 / DSO-36) ─────────────────────────────────
const PanelCitas = ({
  pacientes,
  disponibilidad,
  disponibilidadPorId,
  etiquetaBloque,
  nombrePersona,
  citas,
  fechaFiltro,
  setFechaFiltro,
  onCambio,
  onError,
  onAviso,
}: {
  pacientes: Persona[];
  disponibilidad: DisponibilidadMedica[];
  disponibilidadPorId: Map<number, DisponibilidadMedica>;
  etiquetaBloque: (d: DisponibilidadMedica) => string;
  nombrePersona: (id: number) => string;
  citas: Cita[];
  fechaFiltro: string;
  setFechaFiltro: (f: string) => void;
  onCambio: () => void;
  onError: (m: string) => void;
  onAviso: (m: string) => void;
}) => {
  const [form, setForm] = useState<FormCita>(FORM_CITA_VACIO);
  const [guardando, setGuardando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [ultimosRecordatorios, setUltimosRecordatorios] = useState<
    ComunicacionWhatsapp[] | null
  >(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    onError('');
    setGuardando(true);
    try {
      await crearCita({
        idPaciente: form.idPaciente,
        idDisponibilidad: form.idDisponibilidad,
        fechaHora: `${form.fecha}T${form.hora}:00`,
        telefono: form.telefono,
        motivo: form.motivo || undefined,
      });
      setForm({ ...FORM_CITA_VACIO, fecha: fechaFiltro });
      onCambio();
    } catch (e) {
      onError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const cambiar = async (cita: Cita, estado: EstadoCita) => {
    onError('');
    try {
      await cambiarEstadoCita(cita.idCita, estado);
      onCambio();
    } catch (e) {
      onError(mensajeDeError(e));
    }
  };

  const onGenerarRecordatorios = async () => {
    onError('');
    setGenerando(true);
    try {
      const generados = await generarRecordatorios();
      setUltimosRecordatorios(generados);
      onAviso(
        generados.length > 0
          ? `${generados.length} recordatorio(s) generado(s) para citas confirmadas de las próximas 24 horas.`
          : 'No hay citas confirmadas en las próximas 24 horas sin recordatorio.',
      );
    } catch (e) {
      onError(mensajeDeError(e));
    } finally {
      setGenerando(false);
    }
  };

  return (
    <>
      <motion.div {...fadeUp}>
        <LuxCard className="p-6">
          <h2 className="mb-5 flex items-center gap-2 border-b border-neutral-100 pb-4 text-[11px] font-bold uppercase tracking-widest text-neutral-700 dark:border-white/5 dark:text-neutral-200">
            <CalendarPlus className="h-4 w-4 text-lux-tinta" strokeWidth={1.5} />
            Nueva cita
          </h2>
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label>
              <span className={fieldLabelClass}>Paciente</span>
              <select
                className={fieldInputClass}
                value={form.idPaciente || ''}
                onChange={(e) => setForm({ ...form, idPaciente: Number(e.target.value) })}
                required
              >
                <option value="" disabled>
                  Seleccionar…
                </option>
                {pacientes.map((p) => (
                  <option key={p.idPersona} value={p.idPersona}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="lg:col-span-2">
              <span className={fieldLabelClass}>Bloque de disponibilidad</span>
              <select
                className={fieldInputClass}
                value={form.idDisponibilidad || ''}
                onChange={(e) =>
                  setForm({ ...form, idDisponibilidad: Number(e.target.value) })
                }
                required
              >
                <option value="" disabled>
                  Seleccionar…
                </option>
                {disponibilidad
                  .filter((d) => d.activo)
                  .map((d) => (
                    <option key={d.idDisponibilidadMedica} value={d.idDisponibilidadMedica}>
                      {etiquetaBloque(d)}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              <span className={fieldLabelClass}>Fecha</span>
              <input
                type="date"
                className={fieldInputClass}
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                required
              />
            </label>
            <label>
              <span className={fieldLabelClass}>Hora</span>
              <input
                type="time"
                className={fieldInputClass}
                value={form.hora}
                onChange={(e) => setForm({ ...form, hora: e.target.value })}
                required
              />
            </label>
            <label>
              <span className={fieldLabelClass}>Teléfono de contacto</span>
              <input
                className={fieldInputClass}
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                required
              />
            </label>
            <label className="col-span-full">
              <span className={fieldLabelClass}>Motivo (opcional)</span>
              <input
                className={fieldInputClass}
                value={form.motivo}
                onChange={(e) => setForm({ ...form, motivo: e.target.value })}
              />
            </label>
            <div className="col-span-full pt-2">
              <LuxButton type="submit" disabled={guardando}>
                Agendar cita
              </LuxButton>
            </div>
          </form>
        </LuxCard>
      </motion.div>

      <motion.div {...fadeUp} className="flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-3">
          <span className={fieldLabelClass}>Ver citas del</span>
          <input
            type="date"
            className={fieldInputClass}
            value={fechaFiltro}
            onChange={(e) => setFechaFiltro(e.target.value)}
          />
        </label>
        <LuxButton variant="tinta" onClick={onGenerarRecordatorios} disabled={generando}>
          <Bell className="h-3.5 w-3.5" />
          Generar recordatorios (próximas 24 h)
        </LuxButton>
      </motion.div>

      {ultimosRecordatorios && ultimosRecordatorios.length > 0 ? (
        <motion.div {...fadeUp}>
          <LuxCard className="p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-lux-tinta">
              Recordatorios generados en esta corrida
            </p>
            <ul className="space-y-1 text-xs text-neutral-500">
              {ultimosRecordatorios.map((c) => (
                <li key={c.idComunicacionWhatsapp}>
                  {nombrePersona(c.idPaciente)} — {c.mensaje}
                </li>
              ))}
            </ul>
          </LuxCard>
        </motion.div>
      ) : null}

      <motion.div {...fadeUp}>
        <LuxCard className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/60 text-left dark:border-white/5 dark:bg-white/5">
                {['Hora', 'Paciente', 'Doctor', 'Estado', 'Motivo', ''].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {citas.map((c) => {
                const bloque = disponibilidadPorId.get(c.idDisponibilidad);
                return (
                  <tr
                    key={c.idCita}
                    className="transition-luxe border-b border-neutral-50 last:border-0 hover:bg-lux-tinta/5 dark:border-white/5"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-neutral-500">
                      {new Date(c.fechaHora).toLocaleTimeString('es-CR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3 font-medium text-lux-blue dark:text-white">
                      {nombrePersona(c.idPaciente)}
                    </td>
                    <td className="px-5 py-3 text-neutral-500">
                      {bloque ? nombrePersona(bloque.idEmpleado) : '—'}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={TONO_ESTADO[c.estado]}>{c.estado}</Badge>
                    </td>
                    <td className="px-5 py-3 text-neutral-500">{c.motivo || '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        {TRANSICIONES_ESTADO[c.estado].map((siguiente) => (
                          <button
                            key={siguiente}
                            type="button"
                            onClick={() => cambiar(c, siguiente)}
                            className="transition-luxe inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hover:text-lux-tinta"
                          >
                            <Check className="h-3 w-3" /> {siguiente}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {citas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-neutral-400">
                    Sin citas para esta fecha.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </LuxCard>
      </motion.div>
    </>
  );
};
