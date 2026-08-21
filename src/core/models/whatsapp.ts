export const TipoComunicacion = {
  RECORDATORIO: 'recordatorio',
  CHATBOT: 'chatbot',
  MANUAL: 'manual',
} as const;

export type TipoComunicacion = (typeof TipoComunicacion)[keyof typeof TipoComunicacion];

export const EstadoEnvio = {
  PENDIENTE: 'pendiente',
  ENVIADO: 'enviado',
  FALLIDO: 'fallido',
} as const;

export type EstadoEnvio = (typeof EstadoEnvio)[keyof typeof EstadoEnvio];

export interface ComunicacionWhatsapp {
  idComunicacionWhatsapp: number;
  idPaciente: number;
  idCita: number | null;
  idInteraccionIa: number | null;
  tipo: TipoComunicacion;
  mensaje: string;
  estadoEnvio: EstadoEnvio;
  enviadoEn: string | null;
  /**
   * Enlace `wa.me` con el mensaje ya escrito (CU-05 paso 8). Lo calcula la API
   * al generar el recordatorio; es `null` si la cita no tiene un teléfono
   * utilizable, y no viene en las comunicaciones que solo se listan.
   */
  urlWhatsapp?: string | null;
}
