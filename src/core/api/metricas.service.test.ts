import { describe, expect, it, vi, beforeEach } from 'vitest';
import { resumenMetricas } from './metricas.service';

vi.mock('./http', () => ({ default: { get: vi.fn() } }));

import api from './http';

const mockApi = api as unknown as { get: ReturnType<typeof vi.fn> };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('resumenMetricas', () => {
  it('sin filtros pide el resumen tal cual (el backend usa el mes actual)', async () => {
    mockApi.get.mockResolvedValue({ data: { sinDatos: true } });

    await expect(resumenMetricas()).resolves.toEqual({ sinDatos: true });
    expect(mockApi.get).toHaveBeenCalledWith('/metricas', { params: {} });
  });

  it('pasa el rango como parámetros de consulta', async () => {
    mockApi.get.mockResolvedValue({ data: {} });

    await resumenMetricas({ desde: '2026-03-01', hasta: '2026-03-31' });

    expect(mockApi.get).toHaveBeenCalledWith('/metricas', {
      params: { desde: '2026-03-01', hasta: '2026-03-31' },
    });
  });

  it('propaga el error: un 403 debe verse, no tragarse', async () => {
    mockApi.get.mockRejectedValue(new Error('Forbidden'));
    await expect(resumenMetricas()).rejects.toThrow('Forbidden');
  });
});
