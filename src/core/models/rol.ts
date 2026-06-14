/**
 * Roles del sistema (RBAC). Los valores coinciden con el enum del backend.
 */
export const Rol = {
  ADMINISTRADOR: 'Administrador',
  RECEPCION: 'Recepcion',
  DOCTOR: 'Doctor',
  PACIENTE: 'Paciente',
} as const;

export type Rol = (typeof Rol)[keyof typeof Rol];

/** Ruta de inicio del entorno privado según el rol (separación de vistas). */
export const homePathForRole = (rol?: Rol | null): string =>
  rol === Rol.RECEPCION ? '/recepcion' : '/admin';
