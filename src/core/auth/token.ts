import { jwtDecode } from 'jwt-decode';
import type { JwtPayload, Usuario } from '../models/usuario';

const TOKEN_KEY = 'optica_token';

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const setToken = (token: string): void =>
  localStorage.setItem(TOKEN_KEY, token);

export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

/** Decodifica el JWT sin validar la firma (eso lo hace el backend). */
export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwtDecode<JwtPayload>(token);
  } catch {
    return null;
  }
};

/** True si el token tiene `exp` y ya venció. */
export const isExpired = (payload: JwtPayload): boolean =>
  typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();

/** Devuelve el usuario derivado de un token válido y vigente, o null. */
export const getUserFromToken = (token: string): Usuario | null => {
  const payload = decodeToken(token);
  if (!payload || isExpired(payload)) {
    return null;
  }
  return {
    idUsuario: payload.sub,
    email: payload.email,
    rol: payload.rol,
  };
};
