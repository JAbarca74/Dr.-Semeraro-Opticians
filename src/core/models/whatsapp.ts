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
}
