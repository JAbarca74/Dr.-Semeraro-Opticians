import { describe, expect, it, vi, beforeEach } from 'vitest';
import { listarPersonas, crearPersona, actualizarPersona } from './personas.service';
import type { Persona } from '../models/persona';

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

const mockPersona: Persona = {
  idPersona: 1,
  cedula: '1-1234-5678',
  nombre: 'Ana Lucía Mora',
  tipo: 'Paciente',
  telefono: '8710-1122',
};

beforeEach(() => vi.clearAllMocks());

describe('listarPersonas', () => {
  it('hace GET /personas y devuelve el arreglo', async () => {
    mockApi.get.mockResolvedValue({ data: [mockPersona] });

    const result = await listarPersonas();

    expect(mockApi.get).toHaveBeenCalledWith('/personas');
    expect(result).toEqual([mockPersona]);
  });
});

describe('crearPersona', () => {
  it('hace POST /personas con el input y devuelve la persona creada', async () => {
    mockApi.post.mockResolvedValue({ data: mockPersona });

    const input = { cedula: '1-1234-5678', nombre: 'Ana Lucía Mora', tipo: 'Paciente' as const };
    const result = await crearPersona(input);

    expect(mockApi.post).toHaveBeenCalledWith('/personas', input);
    expect(result).toEqual(mockPersona);
  });
});

describe('actualizarPersona', () => {
  it('hace PATCH /personas/:id con los campos a modificar', async () => {
    const actualizada = { ...mockPersona, telefono: '9999-0000' };
    mockApi.patch.mockResolvedValue({ data: actualizada });

    const result = await actualizarPersona(1, { telefono: '9999-0000' });

    expect(mockApi.patch).toHaveBeenCalledWith('/personas/1', { telefono: '9999-0000' });
    expect(result.telefono).toBe('9999-0000');
  });
});
