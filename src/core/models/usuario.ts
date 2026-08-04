import type { Rol } from './rol';
import type { Persona } from './persona';

export interface Usuario {
  idUsuario: number;
  idPersona: number;
  email: string;
  rol: Rol;
  activo: boolean;
  createdAt?: string;
  persona?: Persona;
}

/** Usuario de la sesión actual, derivado del JWT. */
export interface UsuarioSesion {
  idUsuario: number;
  email: string;
  rol: Rol;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  usuario?: { idUsuario: number; email: string; rol: Rol };
}

/** Estructura del payload del JWT emitido por el backend. */
export interface JwtPayload {
  sub: number;
  email: string;
  rol: Rol;
  jti?: string;
  iat?: number;
  exp?: number;
}

export interface CreateUsuario {
  idPersona: number;
  email: string;
  password: string;
  rol: Rol;
}

export interface UpdateUsuario {
  email?: string;
  rol?: Rol;
  activo?: boolean;
  /** Restablecimiento por el Administrador (mínimo 8 caracteres). */
  password?: string;
}
