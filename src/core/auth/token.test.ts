import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { decodeToken, getUserFromToken, getToken, setToken, clearToken } from './token';
import { Rol } from '../models/rol';

// ── localStorage mock ──────────────────────────────────────────────────────
let storage: Record<string, string> = {};
beforeEach(() => {
  storage = {};
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => storage[k] ?? null,
    setItem: (k: string, v: string) => { storage[k] = v; },
    removeItem: (k: string) => { delete storage[k]; },
  });
});
afterEach(() => vi.unstubAllGlobals());

// ── helpers ────────────────────────────────────────────────────────────────
/** Construye un JWT de prueba (firma irrelevante: jwtDecode no la valida). */
const makeToken = (payload: Record<string, unknown>): string => {
  const encode = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.firma`;
};

describe('utilidades de token', () => {
  it('deriva el usuario de un token válido y vigente', () => {
    const token = makeToken({
      sub: 7,
      email: 'doc@optica.local',
      rol: Rol.DOCTOR,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    expect(getUserFromToken(token)).toEqual({
      idUsuario: 7,
      email: 'doc@optica.local',
      rol: Rol.DOCTOR,
    });
  });

  it('considera inválido un token expirado', () => {
    const token = makeToken({
      sub: 1,
      email: 'admin@optica.local',
      rol: Rol.ADMINISTRADOR,
      exp: Math.floor(Date.now() / 1000) - 10,
    });

    expect(getUserFromToken(token)).toBeNull();
  });

  it('devuelve null ante un token malformado', () => {
    expect(decodeToken('no-es-un-jwt')).toBeNull();
    expect(getUserFromToken('basura')).toBeNull();
  });
});

describe('gestión de token en localStorage', () => {
  it('getToken devuelve null cuando no hay token guardado', () => {
    expect(getToken()).toBeNull();
  });

  it('setToken persiste el token y getToken lo recupera', () => {
    setToken('mi.jwt.token');
    expect(getToken()).toBe('mi.jwt.token');
  });

  it('clearToken elimina el token del almacenamiento', () => {
    setToken('mi.jwt.token');
    clearToken();
    expect(getToken()).toBeNull();
  });
});
