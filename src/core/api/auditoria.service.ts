import api from './http';
import type {
  EventoAcceso,
  EventoAuditoria,
  FiltrosAccesos,
  FiltrosAuditoria,
  PaginaAuditoria,
} from '../models/auditoria';

/**
 * Quita los filtros vacíos antes de armar la consulta: un `?tabla=` sin valor
 * viaja igual y el backend lo rechazaría o filtraría de más.
 */
export const limpiarFiltros = (
  filtros: object,
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(filtros).filter(
      ([, valor]) => valor !== undefined && valor !== null && valor !== '',
    ),
  );

export const listarLogs = (
  filtros: FiltrosAuditoria = {},
): Promise<PaginaAuditoria<EventoAuditoria>> =>
  api
    .get<PaginaAuditoria<EventoAuditoria>>('/auditoria/logs', {
      params: limpiarFiltros(filtros),
    })
    .then((r) => r.data);

export const listarAccesos = (
  filtros: FiltrosAccesos = {},
): Promise<PaginaAuditoria<EventoAcceso>> =>
  api
    .get<PaginaAuditoria<EventoAcceso>>('/auditoria/accesos', {
      params: limpiarFiltros(filtros),
    })
    .then((r) => r.data);

export const listarTablasAuditadas = (): Promise<string[]> =>
  api.get<string[]>('/auditoria/tablas').then((r) => r.data);
