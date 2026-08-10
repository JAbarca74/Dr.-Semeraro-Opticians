import api from './http';
import type {
  Cita,
  CitaInput,
  DisponibilidadInput,
  DisponibilidadMedica,
  EstadoCita,
  HistorialCita,
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

export const historialDeCita = (id: number): Promise<HistorialCita[]> =>
  api.get<HistorialCita[]>(`/citas/${id}/historial`).then((r) => r.data);
