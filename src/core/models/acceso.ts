import { Rol } from './rol';

/** Mismos límites que la API. Sin herencia de privilegios administrativos. */
export const ROLES_RUTA: Record<string, Rol[]> = {
  '/admin': [Rol.ADMINISTRADOR, Rol.DOCTOR],
  '/admin/personas': [Rol.ADMINISTRADOR, Rol.DOCTOR],
  '/admin/cuenta': [Rol.ADMINISTRADOR, Rol.DOCTOR],
  '/admin/agenda': [Rol.DOCTOR],
  '/admin/expedientes': [Rol.DOCTOR],
  '/admin/inventario': [Rol.ADMINISTRADOR],
  '/admin/ventas': [Rol.ADMINISTRADOR],
  '/admin/laboratorio': [Rol.ADMINISTRADOR],
  '/admin/metricas': [Rol.ADMINISTRADOR],
  '/admin/usuarios': [Rol.ADMINISTRADOR],
  '/admin/auditoria': [Rol.ADMINISTRADOR],
  '/recepcion': [Rol.RECEPCION],
  '/recepcion/agenda': [Rol.RECEPCION],
  '/recepcion/cuenta': [Rol.RECEPCION],
  '/portal': [Rol.PACIENTE],
  '/pedidos': [Rol.PACIENTE],
};

export const puedeAccederRuta = (ruta: string, rol?: Rol | null): boolean =>
  !!rol && !!ROLES_RUTA[ruta]?.includes(rol);
