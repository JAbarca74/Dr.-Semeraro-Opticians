import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  anularVenta,
  listarVentas,
  obtenerVenta,
  registrarVenta,
} from './ventas.service';
import { EstadoVenta, type Venta } from '../models/venta';

vi.mock('./http', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

import api from './http';

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
};

const venta: Venta = {
  idVenta: 7,
  idPaciente: null,
  nombrePaciente: null,
  idUsuario: 1,
  total: 300,
  estado: EstadoVenta.ACTIVA,
  fecha: '2026-08-22T10:00:00.000Z',
  detalles: [
    {
      idDetalleVenta: 100,
      idProducto: 1,
      sku: 'RB-2140-51',
      nombre: 'Ray-Ban Wayfarer',
      cantidad: 3,
      precioUnitario: 100,
      subtotal: 300,
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('listarVentas', () => {
  it('sin filtros pide el listado', async () => {
    mockApi.get.mockResolvedValue({ data: [venta] });

    await expect(listarVentas()).resolves.toEqual([venta]);
    expect(mockApi.get).toHaveBeenCalledWith('/ventas', { params: {} });
  });

  it('pasa estado, paciente y paginación', async () => {
    mockApi.get.mockResolvedValue({ data: [] });

    await listarVentas({ estado: EstadoVenta.ANULADA, idPaciente: 5, limite: 20, pagina: 2 });

    expect(mockApi.get).toHaveBeenCalledWith('/ventas', {
      params: { estado: EstadoVenta.ANULADA, idPaciente: 5, limite: 20, pagina: 2 },
    });
  });
});

describe('obtenerVenta', () => {
  it('pide la venta por su id', async () => {
    mockApi.get.mockResolvedValue({ data: venta });

    await expect(obtenerVenta(7)).resolves.toEqual(venta);
    expect(mockApi.get).toHaveBeenCalledWith('/ventas/7');
  });
});

describe('registrarVenta', () => {
  it('manda solo producto y cantidad: el precio lo pone el servidor', async () => {
    mockApi.post.mockResolvedValue({ data: venta });

    await registrarVenta({ detalles: [{ idProducto: 1, cantidad: 3 }] });

    expect(mockApi.post).toHaveBeenCalledWith('/ventas', {
      detalles: [{ idProducto: 1, cantidad: 3 }],
    });
  });

  it('adjunta el paciente cuando la venta se le vincula', async () => {
    mockApi.post.mockResolvedValue({ data: venta });

    await registrarVenta({ idPaciente: 5, detalles: [{ idProducto: 1, cantidad: 1 }] });

    expect(mockApi.post).toHaveBeenCalledWith('/ventas', {
      idPaciente: 5,
      detalles: [{ idProducto: 1, cantidad: 1 }],
    });
  });
});

describe('anularVenta', () => {
  it('manda el motivo, que el backend exige', async () => {
    mockApi.patch.mockResolvedValue({
      data: { ...venta, estado: EstadoVenta.ANULADA },
    });

    const anulada = await anularVenta(7, { motivo: 'El paciente devolvió los aros' });

    expect(mockApi.patch).toHaveBeenCalledWith('/ventas/7/anular', {
      motivo: 'El paciente devolvió los aros',
    });
    expect(anulada.estado).toBe(EstadoVenta.ANULADA);
  });
});
