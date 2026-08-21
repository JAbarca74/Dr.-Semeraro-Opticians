import api from './http';
import type {
  Cita,
  CitaInput,
  Cupo,
  DisponibilidadInput,
  DisponibilidadMedica,
  EstadoCita,
  HistorialCita,
  ReprogramacionInput,
} from '../models/agenda';

export const listarDisponibilidad = (
  idEmpleado?: number,
): Promise<DisponibilidadMedica[]> =>
  api
    .get<DisponibilidadMedica[]>('/disponibilidad', {
      params: idEmpleado ? { idEmpleado } : undefined,
    })
    .then((r) => r.data);

export const crearDisponibilidad = (
  input: DisponibilidadInput,
): Promise<DisponibilidadMedica> =>
  api.post<DisponibilidadMedica>('/disponibilidad', input).then((r) => r.data);

export const actualizarDisponibilidad = (
  id: number,
  input: Partial<DisponibilidadInput>,
): Promise<DisponibilidadMedica> =>
  api
    .patch<DisponibilidadMedica>(`/disponibilidad/${id}`, input)
    .then((r) => r.data);

export const desactivarDisponibilidad = (
  id: number,
): Promise<DisponibilidadMedica> =>
  api.delete<DisponibilidadMedica>(`/disponibilidad/${id}`).then((r) => r.data);

/** Cupos del bloque en una fecha, con su marca de libre u ocupado. */
export const cuposDe = (id: number, fecha: string): Promise<Cupo[]> =>
  api.get<Cupo[]>(`/disponibilidad/${id}/cupos`, { params: { fecha } }).then((r) => r.data);

export const listarCitas = (
  filtros: { fecha?: string; estado?: EstadoCita } = {},
): Promise<Cita[]> => api.get<Cita[]>('/citas', { params: filtros }).then((r) => r.data);

export const crearCita = (input: CitaInput): Promise<Cita> =>
  api.post<Cita>('/citas', input).then((r) => r.data);

export const cambiarEstadoCita = (
  id: number,
  estado: EstadoCita,
  motivoCambio?: string,
): Promise<Cita> =>
  api.patch<Cita>(`/citas/${id}/estado`, { estado, motivoCambio }).then((r) => r.data);

/**
 * Reprogramar es un cambio de estado que además lleva cupo destino. Va aparte
 * de `cambiarEstadoCita` para que sea imposible mandar «Reprogramada» sin
 * fecha nueva, que es justo lo que el backend rechaza.
 */
export const reprogramarCita = (
  id: number,
  input: ReprogramacionInput,
): Promise<Cita> =>
  api
    .patch<Cita>(`/citas/${id}/estado`, { estado: 'Reprogramada', ...input })
    .then((r) => r.data);

export const historialDeCita = (id: number): Promise<HistorialCita[]> =>
  api.get<HistorialCita[]>(`/citas/${id}/historial`).then((r) => r.data);
