import api from './http';
import type {
  AnulacionInput,
  EstadoVenta,
  Venta,
  VentaInput,
} from '../models/venta';

export interface FiltrosVenta {
  estado?: EstadoVenta;
  idPaciente?: number;
  desde?: string;
  hasta?: string;
  limite?: number;
  pagina?: number;
}

export const listarVentas = (filtros: FiltrosVenta = {}): Promise<Venta[]> =>
  api.get<Venta[]>('/ventas', { params: filtros }).then((r) => r.data);

export const obtenerVenta = (id: number): Promise<Venta> =>
  api.get<Venta>(`/ventas/${id}`).then((r) => r.data);

/**
 * CU-04 pasos 5–7. El servidor valida existencias (**EX-05**), carga el precio
 * referencial, persiste las líneas y descuenta el inventario en una sola
 * transacción.
 */
export const registrarVenta = (input: VentaInput): Promise<Venta> =>
  api.post<Venta>('/ventas', input).then((r) => r.data);

/**
 * CU-04, flujo alterno. Devuelve el stock y marca la venta.
 *
 * Puede fallar con 409 si la venta ya está anulada **o si tiene una orden de
 * laboratorio en curso**: no se revierte una venta cuyos lentes se están
 * montando (`06-estado-y-hallazgos.md` §3.17).
 */
export const anularVenta = (
  id: number,
  input: AnulacionInput,
): Promise<Venta> =>
  api.patch<Venta>(`/ventas/${id}/anular`, input).then((r) => r.data);
