import { describe, expect, it, vi, beforeEach } from 'vitest';
import { reporteMetricasPdf, resumenMetricas } from './metricas.service';

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

describe('reporteMetricasPdf (CU-19, flujo alterno)', () => {
  it('pide el PDF como blob y con el rango puesto', async () => {
    const pdf = new Blob(['%PDF'], { type: 'application/pdf' });
    mockApi.get.mockResolvedValue({ data: pdf });

    await expect(
      reporteMetricasPdf({ desde: '2026-08-01', hasta: '2026-08-26' }),
    ).resolves.toBe(pdf);

    // `responseType: blob` no es opcional: sin él Axios interpreta el binario
    // como texto y el archivo descargado sale corrupto.
    expect(mockApi.get).toHaveBeenCalledWith('/metricas/reporte.pdf', {
      params: { desde: '2026-08-01', hasta: '2026-08-26' },
      responseType: 'blob',
    });
  });

  it('sin filtros deja que el backend elija el mes actual', async () => {
    mockApi.get.mockResolvedValue({ data: new Blob() });
    await reporteMetricasPdf();
    expect(mockApi.get).toHaveBeenCalledWith('/metricas/reporte.pdf', {
      params: {},
      responseType: 'blob',
    });
  });

  it('propaga el error en vez de descargar un archivo vacío', async () => {
    mockApi.get.mockRejectedValue(new Error('Forbidden'));
    await expect(reporteMetricasPdf()).rejects.toThrow('Forbidden');
  });
});
