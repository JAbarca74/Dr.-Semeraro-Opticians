import api from './http';
import type { UsuarioSesion } from '../models/usuario';

/** Identidad de la cuenta vigente; idPersona pertenece solo al usuario autenticado. */
export const miCuenta = (): Promise<UsuarioSesion & { idPersona: number }> =>
  api.get<UsuarioSesion & { idPersona: number }>('/auth/me').then((r) => r.data);
