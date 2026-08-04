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

/** Posiciones diagnósticas de mirada del diagrama de motilidad del impreso. */
export const POSICIONES_MIRADA = [
  'arribaIzq',
  'arriba',
  'arribaDer',
  'izq',
  'centro',
  'der',
  'abajoIzq',
  'abajo',
  'abajoDer',
] as const;

export type PosicionMirada = (typeof POSICIONES_MIRADA)[number];

export const EstadoMotilidad = {
  NORMAL: 'normal',
  LIMITADO: 'limitado',
} as const;

export type EstadoMotilidad =
  (typeof EstadoMotilidad)[keyof typeof EstadoMotilidad];

export type MotilidadOjo = Partial<Record<PosicionMirada, EstadoMotilidad>>;

export interface MovimientosOculares {
  od?: MotilidadOjo;
  oi?: MotilidadOjo;
}

/** Campos del expediente impreso comunes a la evaluación guardada y a la nueva. */
export interface FichaClinica {
  motivoConsulta?: string | null;
  ultimoControl?: string | null;
  remitidoPor?: string | null;
  antOculares?: string | null;
  antFamiliares?: string | null;
  antPersonales?: string | null;
  antMedicamentosos?: string | null;
  rxEnUso?: string | null;
  tiempoUso?: string | null;
  avScOd?: string | null;
  avScOi?: string | null;
  avScAo?: string | null;
  avCcOd?: string | null;
  avCcOi?: string | null;
  avCcAo?: string | null;
  pioOd?: number | string | null;
  pioOi?: number | string | null;
  movimientosOculares?: MovimientosOculares | null;
  dp?: number | string | null;
  ppc?: number | string | null;
  vergenciasForias?: string | null;
  segmentoExterno?: string | null;
  oftalmoscopia?: string | null;
  refraccionTexto?: string | null;
  recomendaciones?: string | null;
  control?: string | null;
  remisiones?: string | null;
}

export interface Evaluacion extends FichaClinica {
  idEvaluacionClinica: number;
  idExpediente: number;
  idDoctor: number;
  /** «Impresión Diagnóstica» del impreso. */
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

export interface NuevaEvaluacion extends FichaClinica {
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
