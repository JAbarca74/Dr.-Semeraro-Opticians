import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  limpiarFiltros,
  listarAccesos,
  listarLogs,
  listarTablasAuditadas,
} from './auditoria.service';
import { OperacionAuditoria } from '../models/auditoria';

vi.mock('./http', () => ({
  default: {
    get: vi.fn(),
  },
}));

import api from './http';

const mockApi = api as unknown as { get: ReturnType<typeof vi.fn> };

const paginaVacia = { total: 0, pagina: 1, limite: 50, registros: [] };

beforeEach(() => vi.clearAllMocks());

describe('limpiarFiltros', () => {
  it('descarta los valores vacíos, nulos e indefinidos', () => {
    expect(
      limpiarFiltros({
        tabla: '',
        operacion: undefined,
        idUsuario: null,
        desde: '2026-08-01',
      }),
    ).toEqual({ desde: '2026-08-01' });
  });

  it('conserva el cero y el false, que sí son filtros válidos', () => {
    expect(limpiarFiltros({ exitoso: false, pagina: 0 })).toEqual({
      exitoso: false,
      pagina: 0,
    });
  });
});

describe('listarLogs', () => {
  it('hace GET /auditoria/logs sin parámetros cuando no hay filtros', async () => {
    mockApi.get.mockResolvedValue({ data: paginaVacia });

    const result = await listarLogs();

    expect(mockApi.get).toHaveBeenCalledWith('/auditoria/logs', { params: {} });
    expect(result).toEqual(paginaVacia);
  });

  it('envía solo los filtros con valor', async () => {
    mockApi.get.mockResolvedValue({ data: paginaVacia });

    await listarLogs({
      tabla: 'persona',
      operacion: OperacionAuditoria.UPDATE,
      desde: '',
      pagina: 2,
    });

    expect(mockApi.get).toHaveBeenCalledWith('/auditoria/logs', {
      params: { tabla: 'persona', operacion: 'UPDATE', pagina: 2 },
    });
  });
});

describe('listarAccesos', () => {
  it('hace GET /auditoria/accesos y conserva el filtro exitoso=false', async () => {
    mockApi.get.mockResolvedValue({ data: paginaVacia });

    const result = await listarAccesos({ exitoso: false });

    expect(mockApi.get).toHaveBeenCalledWith('/auditoria/accesos', {
      params: { exitoso: false },
    });
    expect(result).toEqual(paginaVacia);
  });

  it('sin filtros manda parámetros vacíos', async () => {
    mockApi.get.mockResolvedValue({ data: paginaVacia });

    await listarAccesos();

    expect(mockApi.get).toHaveBeenCalledWith('/auditoria/accesos', {
      params: {},
    });
  });
});

describe('listarTablasAuditadas', () => {
  it('hace GET /auditoria/tablas y devuelve la lista', async () => {
    mockApi.get.mockResolvedValue({ data: ['persona', 'usuario'] });

    expect(await listarTablasAuditadas()).toEqual(['persona', 'usuario']);
    expect(mockApi.get).toHaveBeenCalledWith('/auditoria/tablas');
  });
});
