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

/**
 * CU-19, flujo alterno «Descargar Resumen»: el PDF lo arma la API (`DSO-48`).
 *
 * ⚠️ **Tiene que venir por Axios y no por un `<a href>`.** El endpoint está
 * detrás del guardia de Administrador, y un enlace directo no lleva el
 * `Authorization`: el navegador abriría una pestaña con un 401. Por eso se pide
 * como `blob` con la instancia que sí adjunta el token.
 */
export const reporteMetricasPdf = (
  filtros: FiltrosMetricas = {},
): Promise<Blob> =>
  api
    .get<Blob>('/metricas/reporte.pdf', {
      params: filtros,
      responseType: 'blob',
    })
    .then((r) => r.data);
