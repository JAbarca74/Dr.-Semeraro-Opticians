export const TipoPersona = {
  PACIENTE: 'Paciente',
  EMPLEADO: 'Empleado',
} as const;

export type TipoPersona = (typeof TipoPersona)[keyof typeof TipoPersona];

export interface Persona {
  accesoPortal?: import('../api/activacion.service').EstadoAcceso;
  idPersona: number;
  cedula: string;
  nombre: string;
  telefono?: string | null;
  correo?: string | null;
  tipo: TipoPersona;
  fechaNacimiento?: string | null;
  /** Datos que pide el anverso del expediente impreso. */
  ocupacion?: string | null;
  direccion?: string | null;
  contactoEmergencia?: string | null;
  telefonoEmergencia?: string | null;
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
  ocupacion?: string;
  direccion?: string;
  contactoEmergencia?: string;
  telefonoEmergencia?: string;
  puesto?: string;
  fechaIngreso?: string;
  observaciones?: string;
}

/** Edad en años a partir de la fecha de nacimiento (la pide el anverso). */
export const edadDesde = (fechaNacimiento?: string | null): number | null => {
  if (!fechaNacimiento) return null;
  const nacimiento = new Date(fechaNacimiento);
  if (Number.isNaN(nacimiento.getTime())) return null;
  const hoy = new Date();
  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad -= 1;
  }
  return edad >= 0 ? edad : null;
};
