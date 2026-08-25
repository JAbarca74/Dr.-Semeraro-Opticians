import { describe, expect, it, vi, beforeEach } from 'vitest';
import { misExpedientes, misPedidos } from './portal.service';

vi.mock('./http', () => ({ default: { get: vi.fn() } }));

import api from './http';

const mockApi = api as unknown as { get: ReturnType<typeof vi.fn> };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('misExpedientes', () => {
  it('pide el expediente propio SIN pasar ningún identificador', async () => {
    mockApi.get.mockResolvedValue({ data: [] });

    await expect(misExpedientes()).resolves.toEqual([]);
    // La URL no lleva id: el backend lo saca del JWT. Si esto cambia, es que
    // alguien abrió la puerta a leer el expediente de otro.
    expect(mockApi.get).toHaveBeenCalledWith('/portal/expedientes');
  });

  it('propaga el error de la API', async () => {
    mockApi.get.mockRejectedValue(new Error('sin red'));
    await expect(misExpedientes()).rejects.toThrow('sin red');
  });
});

describe('misPedidos', () => {
  it('pide los pedidos propios SIN pasar ningún identificador', async () => {
    mockApi.get.mockResolvedValue({ data: [] });

    await expect(misPedidos()).resolves.toEqual([]);
    expect(mockApi.get).toHaveBeenCalledWith('/portal/pedidos');
  });
});
