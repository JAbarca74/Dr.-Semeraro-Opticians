import api from './http';
import type { FiltrosMetricas, ResumenMetricas } from '../models/metricas';

/**
 * Panel gerencial (CU-19). **Solo Administrador**: el backend responde 403 a
 * Recepción y al Doctor.
 */
export const resumenMetricas = (
  filtros: FiltrosMetricas = {},
): Promise<ResumenMetricas> =>
  api.get<ResumenMetricas>('/metricas', { params: filtros }).then((r) => r.data);
