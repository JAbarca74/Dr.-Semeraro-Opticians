import api from './http';
import type { ComunicacionWhatsapp } from '../models/whatsapp';

export const listarComunicaciones = (): Promise<ComunicacionWhatsapp[]> =>
  api.get<ComunicacionWhatsapp[]>('/whatsapp/comunicaciones').then((r) => r.data);

/**
 * DSO-36: genera los recordatorios pendientes de las citas confirmadas de las
 * próximas 24 h. Cada uno trae su `urlWhatsapp` lista para abrir (CU-05 paso 8).
 */
export const generarRecordatorios = (): Promise<ComunicacionWhatsapp[]> =>
  api
    .post<ComunicacionWhatsapp[]>('/whatsapp/recordatorios/generar')
    .then((r) => r.data);

/** Confirma que el operador ya mandó el mensaje desde WhatsApp. */
export const marcarRecordatorioEnviado = (
  id: number,
): Promise<ComunicacionWhatsapp> =>
  api
    .patch<ComunicacionWhatsapp>(`/whatsapp/comunicaciones/${id}/enviada`)
    .then((r) => r.data);
