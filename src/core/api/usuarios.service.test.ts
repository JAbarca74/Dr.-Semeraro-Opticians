import { describe, expect, it, vi, beforeEach } from 'vitest';
import { listarUsuarios, crearUsuario, actualizarUsuario } from './usuarios.service';
import type { Usuario } from '../models/usuario';
import { Rol } from '../models/rol';

vi.mock('./http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

import api from './http';

const mockApi = api as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
};

const mockUsuario: Usuario = {
  idUsuario: 1,
  idPersona: 10,
  email: 'admin@optica.local',
  rol: Rol.ADMINISTRADOR,
  activo: true,
};

beforeEach(() => vi.clearAllMocks());

describe('listarUsuarios', () => {
  it('hace GET /usuarios y devuelve la lista', async () => {
    mockApi.get.mockResolvedValue({ data: [mockUsuario] });

    const result = await listarUsuarios();

    expect(mockApi.get).toHaveBeenCalledWith('/usuarios');
    expect(result).toEqual([mockUsuario]);
  });
});

describe('crearUsuario', () => {
  it('hace POST /usuarios y devuelve el usuario creado', async () => {
    mockApi.post.mockResolvedValue({ data: mockUsuario });

    const input = {
      idPersona: 10,
      email: 'admin@optica.local',
      password: 'admin1234',
      rol: Rol.ADMINISTRADOR,
    };
    const result = await crearUsuario(input);

    expect(mockApi.post).toHaveBeenCalledWith('/usuarios', input);
    expect(result).toEqual(mockUsuario);
  });
});

describe('actualizarUsuario', () => {
  it('hace PATCH /usuarios/:id con los cambios y devuelve el usuario actualizado', async () => {
    const actualizado = { ...mockUsuario, activo: false };
    mockApi.patch.mockResolvedValue({ data: actualizado });

    const result = await actualizarUsuario(1, { activo: false });

    expect(mockApi.patch).toHaveBeenCalledWith('/usuarios/1', { activo: false });
    expect(result.activo).toBe(false);
  });

  it('hace PATCH con cambio de rol', async () => {
    const actualizado = { ...mockUsuario, rol: Rol.DOCTOR };
    mockApi.patch.mockResolvedValue({ data: actualizado });

    const result = await actualizarUsuario(1, { rol: Rol.DOCTOR });

    expect(mockApi.patch).toHaveBeenCalledWith('/usuarios/1', { rol: Rol.DOCTOR });
    expect(result.rol).toBe(Rol.DOCTOR);
  });
});
