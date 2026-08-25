import api from './http';
import type { EspecialistaVitrina } from '../models/especialista';

/**
 * Perfil público del especialista. **No requiere sesión**: es la precondición
 * de CU-13, igual que en el catálogo (CU-09).
 *
 * Usa la misma instancia de Axios que el resto — el interceptor adjunta el
 * token *si lo hay*, y al backend le da igual: el endpoint no tiene guards.
 */
export const listarEspecialistas = (): Promise<EspecialistaVitrina[]> =>
  api.get<EspecialistaVitrina[]>('/especialistas').then((r) => r.data);

/** Un especialista concreto. 404 si no existe **o no está publicado**. */
export const especialistaPorId = (id: number): Promise<EspecialistaVitrina> =>
  api.get<EspecialistaVitrina>(`/especialistas/${id}`).then((r) => r.data);
