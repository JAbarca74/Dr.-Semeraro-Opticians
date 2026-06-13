export const TipoPersona = {
  PACIENTE: 'Paciente',
  EMPLEADO: 'Empleado',
} as const;

export type TipoPersona = (typeof TipoPersona)[keyof typeof TipoPersona];

export interface Persona {
  idPersona: number;
  cedula: string;
  nombre: string;
  telefono?: string | null;
  correo?: string | null;
  tipo: TipoPersona;
  fechaNacimiento?: string | null;
  puesto?: string | null;
  fechaIngreso?: string | null;
  observaciones?: string | null;
}

export interface PersonaInput {
  cedula: string;
  nombre: string;
  telefono?: string;
  correo?: string;
  tipo: TipoPersona;
  fechaNacimiento?: string;
  puesto?: string;
  fechaIngreso?: string;
  observaciones?: string;
}
