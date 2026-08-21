import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Bell, CalendarPlus, Check, ExternalLink, Send, X } from 'lucide-react';
import {
  cambiarEstadoCita,
  crearCita,
  cuposDe,
  reprogramarCita,
} from '../../core/api/agenda.service';
import {
  generarRecordatorios,
  marcarRecordatorioEnviado,
} from '../../core/api/whatsapp.service';
import {
  EstadoCita,
  TRANSICIONES_ESTADO,
  type Cita,
  type Cupo,
  type DisponibilidadMedica,
} from '../../core/models/agenda';
import type { Persona } from '../../core/models/persona';
import { EstadoEnvio, type ComunicacionWhatsapp } from '../../core/models/whatsapp';
import { mensajeDeError } from '../../shared/error';
import { TelefonoInput } from '../../shared/TelefonoInput';
import {
  Badge,
  LuxButton,
  LuxCard,
  fadeUp,
  fieldInputClass,
  fieldLabelClass,
} from '../../shared/ui';

const TONO_ESTADO: Record<EstadoCita, 'neutral' | 'green' | 'red' | 'blue'> = {
  [EstadoCita.SOLICITADA]: 'neutral',
  [EstadoCita.CONFIRMADA]: 'green',
  [EstadoCita.CANCELADA]: 'red',
  [EstadoCita.REPROGRAMADA]: 'blue',
};

/** Día de la semana (0-6) de una fecha `YYYY-MM-DD`, leída en local. */
const diaDe = (fecha: string) => new Date(`${fecha}T00:00:00`).getDay();

interface FormCita {
  idPaciente: number;
  telefono: string;
  motivo: string;
}

const FORM_CITA_VACIO: FormCita = { idPaciente: 0, telefono: '', motivo: '' };

/** El cupo elegido en el calendario: de qué bloque y a qué hora. */
interface CupoElegido {
  idDisponibilidad: number;
  hora: string;
}

/**
 * Agenda del día (CU-05). El calendario del paso 2 es la pieza central: cada
 * bloque del doctor se despliega en sus cupos y se agenda **haciendo clic en uno
 * libre**, que es lo que el caso de uso describe y lo que evita escribir horas
 * a mano que no existen en la agenda.
 */
export const PanelCitas = ({
  pacientes,
  disponibilidad,
  disponibilidadPorId,
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
  nombrePersona: (id: number) => string;
  citas: Cita[];
  fechaFiltro: string;
  setFechaFiltro: (f: string) => void;
  onCambio: () => void;
  onError: (m: string) => void;
  onAviso: (m: string) => void;
}) => {
  const [form, setForm] = useState<FormCita>(FORM_CITA_VACIO);
  const [elegido, setElegido] = useState<CupoElegido | null>(null);
  const [moviendo, setMoviendo] = useState<Cita | null>(null);
  const [cupos, setCupos] = useState<Record<number, Cupo[]>>({});
  const [guardando, setGuardando] = useState(false);
  const [generando, setGenerando] = useState(false);
  const [recordatorios, setRecordatorios] = useState<ComunicacionWhatsapp[]>([]);

  /** Solo los bloques activos que atienden el día elegido tienen cupos que ofrecer. */
  const bloquesDelDia = useMemo(
    () => disponibilidad.filter((d) => d.activo && d.diaSemana === diaDe(fechaFiltro)),
    [disponibilidad, fechaFiltro],
  );

  useEffect(() => {
    let vigente = true;
    Promise.all(
      bloquesDelDia.map((d) =>
        cuposDe(d.idDisponibilidadMedica, fechaFiltro)
          .then((lista) => [d.idDisponibilidadMedica, lista] as const)
          .catch(() => [d.idDisponibilidadMedica, [] as Cupo[]] as const),
      ),
    ).then((pares) => {
      // La fecha pudo cambiar mientras viajaban las peticiones: si ya no es la
      // que se está mirando, estos cupos son de otro día y no deben pintarse.
      if (vigente) {
        setCupos(Object.fromEntries(pares));
      }
    });
    return () => {
      vigente = false;
    };
  }, [bloquesDelDia, fechaFiltro, citas]);

  const cancelarSeleccion = () => {
    setElegido(null);
    setForm(FORM_CITA_VACIO);
  };

  /** Un clic en un cupo libre: o agenda una cita nueva, o suelta ahí la que se está moviendo. */
  const alPulsarCupo = async (idDisponibilidad: number, hora: string) => {
    if (!moviendo) {
      setElegido({ idDisponibilidad, hora });
      return;
    }
    onError('');
    try {
      await reprogramarCita(moviendo.idCita, {
        nuevaFechaHora: `${fechaFiltro}T${hora}:00`,
        idDisponibilidad,
      });
      onAviso(
        `Cita de ${nombrePersona(moviendo.idPaciente)} reprogramada a las ${hora}; ` +
          'el cupo anterior queda libre.',
      );
      setMoviendo(null);
      onCambio();
    } catch (e) {
      onError(mensajeDeError(e));
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!elegido) {
      return;
    }
    onError('');
    setGuardando(true);
    try {
      await crearCita({
        idPaciente: form.idPaciente,
        idDisponibilidad: elegido.idDisponibilidad,
        fechaHora: `${fechaFiltro}T${elegido.hora}:00`,
        telefono: form.telefono,
        motivo: form.motivo || undefined,
      });
      cancelarSeleccion();
      onCambio();
    } catch (e) {
      onError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const cambiar = async (cita: Cita, estado: EstadoCita) => {
    // Reprogramar no es un cambio de etiqueta: hay que elegir el cupo destino.
    if (estado === EstadoCita.REPROGRAMADA) {
      setMoviendo(cita);
      cancelarSeleccion();
      onAviso(
        `Elija en el calendario el nuevo cupo para ${nombrePersona(cita.idPaciente)}.`,
      );
      return;
    }
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
      setRecordatorios(generados);
      onAviso(
        generados.length > 0
          ? `${generados.length} recordatorio(s) preparado(s). Ábralos en WhatsApp para enviarlos.`
          : 'No hay citas confirmadas en las próximas 24 horas sin recordatorio.',
      );
    } catch (e) {
      onError(mensajeDeError(e));
    } finally {
      setGenerando(false);
    }
  };

  const marcarEnviado = async (id: number) => {
    onError('');
    try {
      const actualizada = await marcarRecordatorioEnviado(id);
      setRecordatorios((previos) =>
        previos.map((r) =>
          r.idComunicacionWhatsapp === id
            ? { ...r, estadoEnvio: actualizada.estadoEnvio }
            : r,
        ),
      );
    } catch (e) {
      onError(mensajeDeError(e));
    }
  };

  return (
    <>
      <motion.div {...fadeUp} className="flex flex-wrap items-center justify-between gap-4">
        <label className="flex items-center gap-3">
          <span className={fieldLabelClass}>Agenda del</span>
          <input
            type="date"
            className={fieldInputClass}
            value={fechaFiltro}
            onChange={(e) => {
              setFechaFiltro(e.target.value);
              cancelarSeleccion();
              setMoviendo(null);
            }}
          />
        </label>
        <LuxButton variant="tinta" onClick={onGenerarRecordatorios} disabled={generando}>
          <Bell className="h-3.5 w-3.5" />
          Preparar recordatorios (próximas 24 h)
        </LuxButton>
      </motion.div>

      {moviendo ? (
        <motion.div {...fadeUp}>
          <LuxCard className="flex flex-wrap items-center justify-between gap-3 border-lux-tinta/40 p-4">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Moviendo la cita de{' '}
              <strong>{nombrePersona(moviendo.idPaciente)}</strong>: elija abajo un
              cupo libre.
            </p>
            <LuxButton variant="ghost" onClick={() => setMoviendo(null)}>
              <X className="h-3.5 w-3.5" /> Cancelar
            </LuxButton>
          </LuxCard>
        </motion.div>
      ) : null}

      {/* CU-05 paso 2 — calendario de cupos ocupados y disponibles */}
      <motion.div {...fadeUp}>
        <LuxCard className="p-6">
          <h2 className="mb-5 border-b border-neutral-100 pb-4 text-[11px] font-bold uppercase tracking-widest text-neutral-700 dark:border-white/5 dark:text-neutral-200">
            Calendario del día
          </h2>
          {bloquesDelDia.length === 0 ? (
            <p className="py-8 text-center text-sm text-neutral-400">
              No hay atención configurada para este día. Defina un bloque en la
              pestaña «Disponibilidad».
            </p>
          ) : (
            <div className="space-y-6">
              {bloquesDelDia.map((bloque) => {
                const lista = cupos[bloque.idDisponibilidadMedica] ?? [];
                return (
                  <div key={bloque.idDisponibilidadMedica}>
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                      {nombrePersona(bloque.idEmpleado)} ·{' '}
                      {bloque.horaInicio.slice(0, 5)}–{bloque.horaFin.slice(0, 5)} ·
                      cada {bloque.duracionMin} min
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {lista.map((cupo) => (
                        <button
                          key={cupo.hora}
                          type="button"
                          disabled={cupo.ocupado}
                          aria-pressed={
                            elegido?.idDisponibilidad === bloque.idDisponibilidadMedica &&
                            elegido?.hora === cupo.hora
                          }
                          onClick={() =>
                            alPulsarCupo(bloque.idDisponibilidadMedica, cupo.hora)
                          }
                          className={`transition-luxe rounded-md border px-3 py-2 font-mono text-xs ${
                            cupo.ocupado
                              ? 'cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-400 line-through dark:border-white/10 dark:bg-white/5'
                              : elegido?.idDisponibilidad ===
                                    bloque.idDisponibilidadMedica &&
                                  elegido?.hora === cupo.hora
                                ? 'border-lux-tinta bg-lux-tinta text-white'
                                : 'border-lux-tinta/30 text-lux-tinta hover:bg-lux-tinta/10'
                          }`}
                        >
                          <span>{cupo.hora}</span>{' '}
                          <span className="text-[10px] uppercase tracking-wider">
                            {cupo.ocupado ? 'Ocupado' : 'Libre'}
                          </span>
                        </button>
                      ))}
                      {lista.length === 0 ? (
                        <span className="text-sm text-neutral-400">
                          Este bloque no genera cupos.
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </LuxCard>
      </motion.div>

      {/* CU-05 pasos 4 y 5 — el formulario aparece al elegir un cupo libre */}
      {elegido ? (
        <motion.div {...fadeUp}>
          <LuxCard className="p-6">
            <h2 className="mb-5 flex items-center gap-2 border-b border-neutral-100 pb-4 text-[11px] font-bold uppercase tracking-widest text-neutral-700 dark:border-white/5 dark:text-neutral-200">
              <CalendarPlus className="h-4 w-4 text-lux-tinta" strokeWidth={1.5} />
              Nueva cita — {fechaFiltro} a las {elegido.hora}
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
              {/* De este número sale el enlace del recordatorio: sin código de
                  país, WhatsApp rechaza la URL. */}
              <TelefonoInput
                etiqueta="Teléfono de contacto"
                valor={form.telefono}
                onChange={(telefono) => setForm({ ...form, telefono })}
                labelClass={fieldLabelClass}
                inputClass={fieldInputClass}
                requerido
              />
              <label>
                <span className={fieldLabelClass}>Motivo (opcional)</span>
                <input
                  className={fieldInputClass}
                  value={form.motivo}
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                />
              </label>
              <div className="col-span-full flex items-center gap-3 pt-2">
                <LuxButton type="submit" disabled={guardando}>
                  Guardar cita
                </LuxButton>
                <LuxButton type="button" variant="ghost" onClick={cancelarSeleccion}>
                  <X className="h-3.5 w-3.5" /> Cancelar
                </LuxButton>
              </div>
            </form>
          </LuxCard>
        </motion.div>
      ) : null}

      {recordatorios.length > 0 ? (
        <motion.div {...fadeUp}>
          <LuxCard className="p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-lux-tinta">
              Recordatorios preparados
            </p>
            <ul className="space-y-3 text-xs text-neutral-500">
              {recordatorios.map((r) => (
                <li
                  key={r.idComunicacionWhatsapp}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-50 pb-2 last:border-0 dark:border-white/5"
                >
                  <span className="max-w-xl">
                    <strong className="text-lux-blue dark:text-white">
                      {nombrePersona(r.idPaciente)}
                    </strong>{' '}
                    — {r.mensaje}
                  </span>
                  <span className="flex items-center gap-3">
                    <Badge tone={r.estadoEnvio === EstadoEnvio.ENVIADO ? 'green' : 'neutral'}>
                      {r.estadoEnvio}
                    </Badge>
                    {r.urlWhatsapp ? (
                      <a
                        href={r.urlWhatsapp}
                        target="_blank"
                        rel="noreferrer"
                        className="transition-luxe inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-lux-tinta hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> Abrir en WhatsApp
                      </a>
                    ) : null}
                    {r.estadoEnvio !== EstadoEnvio.ENVIADO ? (
                      <button
                        type="button"
                        onClick={() => marcarEnviado(r.idComunicacionWhatsapp)}
                        className="transition-luxe inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hover:text-lux-tinta"
                      >
                        <Send className="h-3 w-3" /> Marcar enviado
                      </button>
                    ) : null}
                  </span>
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
