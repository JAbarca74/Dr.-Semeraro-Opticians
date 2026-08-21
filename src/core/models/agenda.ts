export const EstadoCita = {
  SOLICITADA: 'Solicitada',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
  REPROGRAMADA: 'Reprogramada',
} as const;

export type EstadoCita = (typeof EstadoCita)[keyof typeof EstadoCita];

export interface DisponibilidadMedica {
  idDisponibilidadMedica: number;
  idEmpleado: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  duracionMin: number;
  activo: boolean;
}

export interface DisponibilidadInput {
  idEmpleado: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  duracionMin?: number;
  activo?: boolean;
}

export interface Cita {
  idCita: number;
  idPaciente: number;
  idDisponibilidad: number;
  fechaHora: string;
  estado: EstadoCita;
  motivo?: string | null;
  telefono: string;
}

export interface CitaInput {
  idPaciente: number;
  idDisponibilidad: number;
  fechaHora: string;
  telefono: string;
  motivo?: string;
}

/** Un cupo del bloque en una fecha concreta (CU-06 paso 6). */
export interface Cupo {
  hora: string;
  ocupado: boolean;
  idCita: number | null;
}

/**
 * Reprogramar exige cupo destino: el backend rechaza el cambio de estado sin
 * `nuevaFechaHora` porque mover una cita es moverla, no reetiquetarla.
 */
export interface ReprogramacionInput {
  nuevaFechaHora: string;
  idDisponibilidad?: number;
  motivoCambio?: string;
}

export interface HistorialCita {
  idHistorialCita: number;
  idCita: number;
  idUsuario: number;
  estadoAnterior: string;
  estadoNuevo: string;
  changedAt: string;
  motivoCambio?: string | null;
}

export const DIAS_SEMANA = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
] as const;

/**
 * Espejo de las transiciones que valida el backend (`agenda.service.ts`). Vive
 * duplicado a propósito: sirve para no ofrecer en la UI un botón que el
 * servidor va a rechazar, pero la validación real —la que importa— es la de
 * allá; esto es solo para la experiencia.
 */
export const TRANSICIONES_ESTADO: Record<EstadoCita, EstadoCita[]> = {
  [EstadoCita.SOLICITADA]: [EstadoCita.CONFIRMADA, EstadoCita.CANCELADA],
  [EstadoCita.CONFIRMADA]: [EstadoCita.CANCELADA, EstadoCita.REPROGRAMADA],
  [EstadoCita.REPROGRAMADA]: [EstadoCita.CONFIRMADA, EstadoCita.CANCELADA],
  [EstadoCita.CANCELADA]: [],
};
