import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// Mocks declarados ANTES de importar http para que el módulo los tome al inicializarse.
vi.mock('../auth/token', () => ({
  getToken: vi.fn(),
  clearToken: vi.fn(),
}));

import { getToken, clearToken } from '../auth/token';
import api from './http';

const mockGetToken = getToken as ReturnType<typeof vi.fn>;
const mockClearToken = clearToken as ReturnType<typeof vi.fn>;

// Acceso tipado a los handlers internos de Axios (API estable en tests).
type AxiosHandler = {
  fulfilled: ((v: unknown) => unknown) | null;
  rejected: ((e: unknown) => unknown) | null;
};
const reqHandlers = (api.interceptors.request as unknown as { handlers: AxiosHandler[] }).handlers;
const resHandlers = (api.interceptors.response as unknown as { handlers: AxiosHandler[] }).handlers;

let windowAssign: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  windowAssign = vi.fn();
  vi.stubGlobal('window', {
    location: { pathname: '/dashboard', assign: windowAssign },
  });
});
afterEach(() => vi.unstubAllGlobals());

describe('interceptor de request', () => {
  const requestFn = (config: object) =>
    (reqHandlers[0].fulfilled as (c: object) => object)(config);

  it('adjunta el token Bearer cuando hay sesión activa', () => {
    mockGetToken.mockReturnValue('jwt.del.usuario');
    const config = requestFn({ headers: {} }) as { headers: Record<string, string> };
    expect(config.headers.Authorization).toBe('Bearer jwt.del.usuario');
  });

  it('no adjunta Authorization cuando no hay token', () => {
    mockGetToken.mockReturnValue(null);
    const config = requestFn({ headers: {} }) as { headers: Record<string, string> };
    expect(config.headers.Authorization).toBeUndefined();
  });
});

describe('interceptor de response', () => {
  const errorFn = (err: unknown) =>
    (resHandlers[0].rejected as (e: unknown) => Promise<never>)(err);

  it('limpia el token y redirige a /login en respuesta 401', async () => {
    const err = { response: { status: 401 } };
    await expect(errorFn(err)).rejects.toEqual(err);
    expect(mockClearToken).toHaveBeenCalled();
    expect(windowAssign).toHaveBeenCalledWith('/login');
  });

  it('no redirige si ya estamos en /login (evita bucle)', async () => {
    vi.stubGlobal('window', {
      location: { pathname: '/login', assign: windowAssign },
    });
    const err = { response: { status: 401 } };
    await expect(errorFn(err)).rejects.toEqual(err);
    expect(mockClearToken).toHaveBeenCalled();
    expect(windowAssign).not.toHaveBeenCalled();
  });

  it('propaga el error sin limpiar sesión para respuestas distintas de 401', async () => {
    const err = { response: { status: 404 } };
    await expect(errorFn(err)).rejects.toEqual(err);
    expect(mockClearToken).not.toHaveBeenCalled();
  });
});
