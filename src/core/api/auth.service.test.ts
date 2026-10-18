import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  loginRequest,
  logoutRequest,
  cambiarPasswordRequest,
} from '../auth/auth.service';
import { Rol } from '../models/rol';

vi.mock('../api/http', () => ({
  default: {
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

import api from '../api/http';

const mockApi = api as unknown as { post: ReturnType<typeof vi.fn>; patch: ReturnType<typeof vi.fn> };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('loginRequest', () => {
  it('hace POST /auth/login y devuelve accessToken + usuario', async () => {
    const respuesta = {
      accessToken: 'token.jwt',
      usuario: { idUsuario: 1, email: 'admin@optica.local', rol: Rol.ADMINISTRADOR },
    };
    mockApi.post.mockResolvedValue({ data: respuesta });

    const result = await loginRequest({ email: 'admin@optica.local', password: 'admin1234' });

    expect(mockApi.post).toHaveBeenCalledWith('/auth/login', {
      email: 'admin@optica.local',
      password: 'admin1234',
    });
    expect(result).toEqual(respuesta);
  });
});

describe('logoutRequest', () => {
  it('hace POST /auth/logout', async () => {
    mockApi.post.mockResolvedValue({ data: { mensaje: 'Sesión cerrada' } });

    await logoutRequest();

    expect(mockApi.post).toHaveBeenCalledWith('/auth/logout');
  });

  it('no lanza aunque el servidor devuelva error (best-effort)', async () => {
    mockApi.post.mockRejectedValue(new Error('Network error'));

    await expect(logoutRequest()).resolves.toBeUndefined();
  });
});

describe('cambiarPasswordRequest', () => {
  it('hace PATCH /auth/password con la contraseña actual y la nueva', async () => {
    mockApi.patch.mockResolvedValue({ data: { mensaje: 'Contraseña actualizada' } });

    await cambiarPasswordRequest('actual123', 'nueva456');

    expect(mockApi.patch).toHaveBeenCalledWith('/auth/password', {
      actual: 'actual123',
      nueva: 'nueva456',
    });
  });
});
