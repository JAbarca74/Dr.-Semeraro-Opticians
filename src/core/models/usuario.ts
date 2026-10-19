import type { Rol } from './rol';
import type { Persona } from './persona';

export interface Usuario {
  idUsuario: number;
  idPersona: number;
  email: string;
  rol: Rol;
  activo: boolean;
  activado?: boolean;
  accesoCuenta?: { estado: string };
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
  idPersona?: number;
  cedula?: string;
  nombre?: string;
  email: string;
  rol: Rol;
}

export interface UpdateUsuario {
  email?: string;
  rol?: Rol;
  activo?: boolean;

}

/**
 * Alta de cuenta de paciente por autoservicio (CU-10 paso 3).
 *
 * ⚠️ **No lleva `rol` ni `tipo`, y no es un olvido**: los fija el servidor. Si
 * viajaran desde aquí, cualquiera podría darse de alta como Administrador.
 */
export interface RegistroPaciente {
  cedula: string;
  nombre: string;
  correo: string;
  password: string;
  telefono?: string;
}

/** Lo que responde `POST /auth/registro`. No incluye token: el CU no lo pide. */
export interface CuentaCreada {
  idUsuario: number;
  email: string;
  rol: Rol;
}
