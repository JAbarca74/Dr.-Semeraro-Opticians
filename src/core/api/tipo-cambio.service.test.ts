import { describe, expect, it, vi, beforeEach } from 'vitest';
import { tipoCambioVigente } from './tipo-cambio.service';

vi.mock('./http', () => ({ default: { get: vi.fn() } }));
import api from './http';

const mockApi = api as unknown as { get: ReturnType<typeof vi.fn> };

beforeEach(() => vi.clearAllMocks());

describe('tipoCambioVigente', () => {
  it('devuelve lo que manda la API', async () => {
    const tasa = {
      disponible: true,
      valor: 505,
      fecha: '2026-08-27T00:00:00.000Z',
      fuente: 'open.er-api.com',
    };
    mockApi.get.mockResolvedValue({ data: tasa });

    await expect(tipoCambioVigente()).resolves.toEqual(tasa);
    expect(mockApi.get).toHaveBeenCalledWith('/tipo-cambio');
  });

  it('si falla NO propaga el error: el catálogo no puede caerse por esto', async () => {
    // La conversión es un adorno; el precio en colones es el producto.
    mockApi.get.mockRejectedValue(new Error('sin red'));

    await expect(tipoCambioVigente()).resolves.toEqual({ disponible: false });
  });
});
