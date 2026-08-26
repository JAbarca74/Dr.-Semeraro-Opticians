import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  loginRequest,
  logoutRequest,
  cambiarPasswordRequest,
  registrarPacienteRequest,
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

/**
 * Alta de cuenta de paciente (CU-10, `DSO-39`).
 *
 * ⚠️ Esta funcion se quedó sin prueba directa al construir `DSO-39`: las de
 * `RegistroPage` mockean el módulo entero, así que el código real nunca llegaba
 * a ejecutarse. Lo destapó el umbral de cobertura de `src/core/**`.
 */
describe('registrarPacienteRequest', () => {
  it('publica el alta en el endpoint público y devuelve la cuenta creada', async () => {
    const creada = {
      idUsuario: 11,
      email: 'ana@example.com',
      rol: Rol.PACIENTE,
    };
    (api.post as ReturnType<typeof vi.fn>).mockResolvedValue({ data: creada });

    await expect(
      registrarPacienteRequest({
        cedula: '1-4000-0001',
        nombre: 'Ana Mora',
        correo: 'ana@example.com',
        password: 'clave12345',
      }),
    ).resolves.toEqual(creada);

    expect(api.post).toHaveBeenCalledWith(
      '/auth/registro',
      expect.objectContaining({ correo: 'ana@example.com' }),
    );
  });

  it('propaga el 409 de EX-12 en vez de tragárselo', async () => {
    (api.post as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('Identificación o correo en uso'),
    );

    await expect(
      registrarPacienteRequest({
        cedula: '1-4000-0001',
        nombre: 'Ana Mora',
        correo: 'ana@example.com',
        password: 'clave12345',
      }),
    ).rejects.toThrow('Identificación o correo en uso');
  });
});
