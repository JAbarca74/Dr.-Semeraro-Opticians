import api from './http';
import type {
  EstadoOrden,
  HistorialOrden,
  OrdenInput,
  OrdenLaboratorio,
} from '../models/laboratorio';

export interface FiltrosOrden {
  estado?: EstadoOrden;
  idVenta?: number;
  /** Todo lo que no esté «Listo para entrega» ni «Cancelado» (CU-07 paso 2). */
  pendientes?: boolean;
}

export const listarOrdenes = (
  filtros: FiltrosOrden = {},
): Promise<OrdenLaboratorio[]> =>
  api.get<OrdenLaboratorio[]>('/ordenes', { params: filtros }).then((r) => r.data);

export const obtenerOrden = (id: number): Promise<OrdenLaboratorio> =>
  api.get<OrdenLaboratorio>(`/ordenes/${id}`).then((r) => r.data);

export const crearOrden = (input: OrdenInput): Promise<OrdenLaboratorio> =>
  api.post<OrdenLaboratorio>('/ordenes', input).then((r) => r.data);

/** Avance por el camino normal. El comentario es opcional aquí. */
export const cambiarEstadoOrden = (
  id: number,
  estado: EstadoOrden,
  comentario?: string,
): Promise<OrdenLaboratorio> =>
  api
    .patch<OrdenLaboratorio>(`/ordenes/${id}/estado`, { estado, comentario })
    .then((r) => r.data);

/**
 * Marcar retraso va **aparte** de `cambiarEstadoOrden`, igual que
 * `reprogramarCita` va aparte de `cambiarEstadoCita`: así es imposible mandar
 * «Retrasado» sin motivo, que es justo lo que el backend rechaza con un 400.
 */
export const marcarRetraso = (
  id: number,
  motivo: string,
): Promise<OrdenLaboratorio> =>
  api
    .patch<OrdenLaboratorio>(`/ordenes/${id}/estado`, {
      estado: 'Retrasado',
      comentario: motivo,
    })
    .then((r) => r.data);

export const historialDeOrden = (id: number): Promise<HistorialOrden[]> =>
  api.get<HistorialOrden[]>(`/ordenes/${id}/historial`).then((r) => r.data);
