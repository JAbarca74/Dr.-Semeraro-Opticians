import type { Persona } from './persona';

export const Ojo = { DERECHO: 'OD', IZQUIERDO: 'OI' } as const;
export type Ojo = (typeof Ojo)[keyof typeof Ojo];

export interface Refraccion {
  idParametroRefraccion?: number;
  ojo: Ojo;
  esfera: number | string;
  cilindro: number | string;
  eje: number;
  adicion?: number | string | null;
  avsc?: number | string | null;
}

export interface Receta {
  idRecetaCriptografica: number;
  idEvaluacion: number;
  hashSha256: string;
  urlArchivo: string;
  codigoQr: string;
  firmadoEn: string;
}

export interface Evaluacion {
  idEvaluacionClinica: number;
  idExpediente: number;
  idDoctor: number;
  diagnosticos?: string[] | null;
  notas?: string | null;
  fecha: string;
  doctor?: Persona;
  refracciones?: Refraccion[];
  receta?: Receta | null;
}

export interface Expediente {
  idExpediente: number;
  idPaciente: number;
  paciente?: Persona;
  createdAt?: string;
}

export interface ExpedienteDetalle {
  expediente: Expediente;
  evaluaciones: Evaluacion[];
}

export interface NuevaRefraccion {
  ojo: Ojo;
  esfera: number;
  cilindro: number;
  eje: number;
  adicion?: number;
}

export interface NuevaEvaluacion {
  idPaciente: number;
  diagnosticos?: string[];
  notas?: string;
  refracciones?: NuevaRefraccion[];
}

export interface VerificacionReceta {
  valida: boolean;
  hash?: string;
  firmadoEn?: string;
  paciente?: string;
  doctor?: string;
  fecha?: string;
  refracciones?: Refraccion[];
}
