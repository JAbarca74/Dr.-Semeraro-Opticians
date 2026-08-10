import api from './http';
import type { ComunicacionWhatsapp } from '../models/whatsapp';

export const listarComunicaciones = (): Promise<ComunicacionWhatsapp[]> =>
  api.get<ComunicacionWhatsapp[]>('/whatsapp/comunicaciones').then((r) => r.data);

/** DSO-36: genera los recordatorios pendientes de las citas confirmadas de las próximas 24h. */
export const generarRecordatorios = (): Promise<ComunicacionWhatsapp[]> =>
  api
    .post<ComunicacionWhatsapp[]>('/whatsapp/recordatorios/generar')
    .then((r) => r.data);
