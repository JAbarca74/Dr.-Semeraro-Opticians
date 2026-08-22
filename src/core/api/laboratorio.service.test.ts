import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  cambiarEstadoOrden,
  crearOrden,
  historialDeOrden,
  listarOrdenes,
  marcarRetraso,
  obtenerOrden,
} from './laboratorio.service';
import { EstadoOrden, type OrdenLaboratorio } from '../models/laboratorio';

vi.mock('./http', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

import api from './http';

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
};

const orden: OrdenLaboratorio = {
  idOrdenLaboratorio: 42,
  idVenta: 7,
  laboratorioNombre: 'Óptica Lab CR',
  laboratorioContacto: null,
  laboratorioTelefono: null,
  estado: EstadoOrden.ENVIADO,
  estadoPrevio: null,
  especificaciones: 'Progresivos antirreflejo',
  fechaEstimadaEntrega: null,
  retrasadaDesde: null,
  createdAt: '2026-08-20T10:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('listarOrdenes', () => {
  it('sin filtros pide el listado completo', async () => {
    mockApi.get.mockResolvedValue({ data: [orden] });

    await expect(listarOrdenes()).resolves.toEqual([orden]);
    expect(mockApi.get).toHaveBeenCalledWith('/ordenes', { params: {} });
  });

  it('pasa los filtros del tablero tal cual', async () => {
    mockApi.get.mockResolvedValue({ data: [] });

    await listarOrdenes({ pendientes: true, idVenta: 7 });

    expect(mockApi.get).toHaveBeenCalledWith('/ordenes', {
      params: { pendientes: true, idVenta: 7 },
    });
  });
});

describe('obtenerOrden', () => {
  it('pide la orden por su id', async () => {
    mockApi.get.mockResolvedValue({ data: orden });

    await expect(obtenerOrden(42)).resolves.toEqual(orden);
    expect(mockApi.get).toHaveBeenCalledWith('/ordenes/42');
  });
});

describe('crearOrden', () => {
  it('envía el cuerpo del alta', async () => {
    mockApi.post.mockResolvedValue({ data: orden });
    const input = {
      idVenta: 7,
      laboratorioNombre: 'Óptica Lab CR',
      especificaciones: 'Progresivos',
    };

    await expect(crearOrden(input)).resolves.toEqual(orden);
    expect(mockApi.post).toHaveBeenCalledWith('/ordenes', input);
  });
});

describe('cambiarEstadoOrden', () => {
  it('manda el estado destino', async () => {
    mockApi.patch.mockResolvedValue({ data: orden });

    await cambiarEstadoOrden(42, EstadoOrden.EN_PROCESO);

    expect(mockApi.patch).toHaveBeenCalledWith('/ordenes/42/estado', {
      estado: EstadoOrden.EN_PROCESO,
      comentario: undefined,
    });
  });

  it('adjunta el comentario cuando se escribe uno', async () => {
    mockApi.patch.mockResolvedValue({ data: orden });

    await cambiarEstadoOrden(42, EstadoOrden.RECIBIDO, 'Llegó completo');

    expect(mockApi.patch).toHaveBeenCalledWith('/ordenes/42/estado', {
      estado: EstadoOrden.RECIBIDO,
      comentario: 'Llegó completo',
    });
  });
});

describe('marcarRetraso', () => {
  it('va aparte para que sea imposible retrasar sin motivo', async () => {
    mockApi.patch.mockResolvedValue({
      data: { ...orden, estado: EstadoOrden.RETRASADO },
    });

    await marcarRetraso(42, 'El lab no tiene material');

    expect(mockApi.patch).toHaveBeenCalledWith('/ordenes/42/estado', {
      estado: 'Retrasado',
      comentario: 'El lab no tiene material',
    });
  });
});

describe('historialDeOrden', () => {
  it('pide la bitácora de la orden', async () => {
    mockApi.get.mockResolvedValue({ data: [] });

    await expect(historialDeOrden(42)).resolves.toEqual([]);
    expect(mockApi.get).toHaveBeenCalledWith('/ordenes/42/historial');
  });
});
