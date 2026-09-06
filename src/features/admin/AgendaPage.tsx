import { useIdioma } from '../../core/i18n/idioma.context';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { CalendarClock, Clock, Pencil, X } from 'lucide-react';
import {
  actualizarDisponibilidad,
  crearDisponibilidad,
  desactivarDisponibilidad,
  listarCitas,
  listarDisponibilidad,
} from '../../core/api/agenda.service';
import { listarPersonas } from '../../core/api/personas.service';
import {
  DIAS_SEMANA,
  type Cita,
  type DisponibilidadInput,
  type DisponibilidadMedica,
} from '../../core/models/agenda';
import { TipoPersona, type Persona } from '../../core/models/persona';
import { Rol } from '../../core/models/rol';
import { useAuth } from '../../core/auth/auth.context';
import { mensajeDeError } from '../../shared/error';
import { PanelCitas } from './AgendaCitasPanel';
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

const FORM_DISPONIBILIDAD_VACIO: DisponibilidadInput = {
  idEmpleado: 0,
  diaSemana: 1,
  horaInicio: '08:00',
  horaFin: '17:00',
  duracionMin: 30,
  activo: true,
};

type Tab = 'citas' | 'disponibilidad';

/**
 * Agenda del consultorio, compartida por los entornos `/admin` y `/recepcion`.
 *
 * **Decisión del PO (2026-08-20):** configurar la disponibilidad (CU-06) queda
 * abierto a **Administrador, Recepción y Doctor**, y cerrado al **Paciente**.
 * El TFM lo describía como «exclusivo del Doctor»; la desviación es consciente
 * —en el mostrador también se ajustan horarios— y coincide con los `@Roles` del
 * `DisponibilidadController`. Queda pendiente formalizarla ante el CCC.
 *
 * La comprobación se conserva aunque hoy la cumplan todos los que llegan aquí:
 * el día que un rol nuevo alcance esta página, el valor por defecto será *no
 * poder configurar*, que es el lado seguro.
 */
export const AgendaPage = () => {
  const { t } = useIdioma();
  const { hasRole } = useAuth();
  const puedeConfigurar = hasRole([
    Rol.ADMINISTRADOR,
    Rol.RECEPCION,
    Rol.DOCTOR,
  ]);
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

  const cargarBase = () => {
    listarPersonas()
      .then(setPersonas)
      .catch((e) => setError(mensajeDeError(e, t('personas.error'))));
    listarDisponibilidad()
      .then(setDisponibilidad)
      .catch((e) => setError(mensajeDeError(e, t('agenda.errorDisponibilidad'))));
  };

  const cargarCitas = (fecha: string) => {
    listarCitas({ fecha })
      .then(setCitas)
      .catch((e) => setError(mensajeDeError(e, t('agenda.errorCitas'))));
  };

  // `cargarBase` y `cargarCitas` dependen de `t` solo para el texto de respaldo
  // del error. En las dependencias, cambiar de idioma volvería a pedir la
  // agenda entera.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(cargarBase, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => cargarCitas(fechaFiltro), [fechaFiltro]);

  return (
    <section className="space-y-10">
      <SectionHeader
        kicker={puedeConfigurar ? 'CU-05 · CU-06' : 'CU-05'}
        title={t('agenda.titulo')}
        description={
          puedeConfigurar
            ? t('agenda.descripcionCompleta')
            : t('agenda.descripcionCitas')
        }
        actions={
          <div className="flex gap-2">
            <LuxButton
              variant={tab === 'citas' ? 'primary' : 'ghost'}
              onClick={() => setTab('citas')}
            >
              <CalendarClock className="h-3.5 w-3.5" /> {t('agenda.tabCitas')}
            </LuxButton>
            {puedeConfigurar ? (
              <LuxButton
                variant={tab === 'disponibilidad' ? 'primary' : 'ghost'}
                onClick={() => setTab('disponibilidad')}
              >
                <Clock className="h-3.5 w-3.5" /> {t('agenda.tabDisponibilidad')}
              </LuxButton>
            ) : null}
          </div>
        }
      />

      {error ? <Alert>{error}</Alert> : null}
      {aviso ? <Alert>{aviso}</Alert> : null}

      {tab === 'disponibilidad' && puedeConfigurar ? (
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
  const { t } = useIdioma();
  const [form, setForm] = useState<DisponibilidadInput>(FORM_DISPONIBILIDAD_VACIO);
  const [editId, setEditId] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);

  // CU-06 paso 4. El backend lo valida también —es quien manda—, pero avisar
  // aquí ahorra el viaje y señala el campo exacto que está mal.
  const rangoInvalido = form.horaFin <= form.horaInicio;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (rangoInvalido) {
      return;
    }
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
            {editId ? t('agenda.editarBloque') : t('agenda.nuevoBloque')}
          </h2>
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label>
              <span className={fieldLabelClass}>{t('agenda.doctorEspecialista')}</span>
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
              <span className={fieldLabelClass}>{t('agenda.dia')}</span>
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
              <span className={fieldLabelClass}>{t('agenda.horaInicio')}</span>
              <input
                type="time"
                className={fieldInputClass}
                value={form.horaInicio}
                onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
                required
              />
            </label>
            <label>
              <span className={fieldLabelClass}>{t('agenda.horaFin')}</span>
              <input
                type="time"
                className={`${fieldInputClass} ${rangoInvalido ? 'border-red-400 text-red-600' : ''}`}
                value={form.horaFin}
                onChange={(e) => setForm({ ...form, horaFin: e.target.value })}
                aria-invalid={rangoInvalido}
                required
              />
              {rangoInvalido ? (
                <span className="mt-1 block text-[11px] font-semibold text-red-600">{t('agenda.horaFinPosterior')}</span>
              ) : null}
            </label>
            <label>
              <span className={fieldLabelClass}>{t('agenda.duracionCita')}</span>
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
              <span className={fieldLabelClass}>{t('agenda.activo')}</span>
            </label>

            <div className="col-span-full flex items-center gap-3 pt-2">
              <LuxButton type="submit" disabled={guardando || rangoInvalido}>
                {editId ? t('comun.guardarCambios') : t('agenda.crearBloque')}
              </LuxButton>
              {editId ? (
                <LuxButton type="button" variant="ghost" onClick={cancelar}>
                  <X className="h-3.5 w-3.5" />{t('comun.cancelar')}</LuxButton>
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
                      {d.activo ? t('agenda.activo') : t('agenda.inactivo')}
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
                        >{t('agenda.desactivar')}</button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {disponibilidad.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-neutral-400">{t('agenda.sinBloques')}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </LuxCard>
      </motion.div>
    </>
  );
};

