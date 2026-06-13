import type { Rol } from './rol';

export interface Usuario {
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
}

/** Estructura del payload del JWT emitido por el backend. */
export interface JwtPayload {
  sub: number;
  email: string;
  rol: Rol;
  iat?: number;
  exp?: number;
}
