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

/**
 * Ruta de inicio del entorno privado según el rol (separación de vistas).
 *
 * El `Paciente` va al portal público: no tiene ningún entorno privado, y
 * mandarlo a `/admin` provocaba un bucle de redirección con `RoleRoute`, que
 * dejaba la aplicación en blanco.
 */
export const homePathForRole = (rol?: Rol | null): string => {
  if (rol === Rol.RECEPCION) {
    return '/recepcion';
  }
  return rol === Rol.PACIENTE ? '/portal' : '/admin';
};

/**
 * Etiqueta de presentación del rol (con tilde correcta). El valor del enum
 * del backend es "Recepcion" sin tilde; en la UI siempre se muestra "Recepción".
 */
export const rolLabel = (rol?: Rol | null): string =>
  rol === Rol.RECEPCION ? 'Recepción' : (rol ?? '');
