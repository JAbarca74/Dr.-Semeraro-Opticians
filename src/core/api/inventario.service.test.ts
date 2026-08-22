import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  actualizarProducto,
  ajustarStock,
  crearProducto,
  listarProductos,
  movimientosDeProducto,
  obtenerProducto,
  registrarEntrada,
} from './inventario.service';
import {
  CategoriaProducto,
  TipoMovimiento,
  type MovimientoInventario,
  type Producto,
} from '../models/inventario';

vi.mock('./http', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

import api from './http';

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
};

const producto: Producto = {
  idProducto: 1,
  sku: 'RB-2140-51',
  nombre: 'Ray-Ban Wayfarer',
  marca: 'Ray-Ban',
  categoria: CategoriaProducto.ARO,
  stock: 10,
  umbralMinimo: 3,
  bajoStock: false,
  precio: 189.5,
  color: null,
  material: null,
  calibre: null,
  indiceRefraccion: null,
  filtro: null,
  tratamiento: null,
  formasRostroCompatibles: null,
};

const asiento: MovimientoInventario = {
  idMovimientoInventario: 99,
  idProducto: 1,
  idUsuario: 7,
  tipo: TipoMovimiento.ENTRADA,
  cantidad: 6,
  stockAntes: 10,
  stockDespues: 16,
  referencia: 'FAC-001',
  createdAt: '2026-08-21T10:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('listarProductos', () => {
  it('sin filtros pide el inventario completo', async () => {
    mockApi.get.mockResolvedValue({ data: [producto] });

    await expect(listarProductos()).resolves.toEqual([producto]);
    expect(mockApi.get).toHaveBeenCalledWith('/productos', { params: {} });
  });

  it('pasa la búsqueda, la categoría y la alerta de stock', async () => {
    mockApi.get.mockResolvedValue({ data: [] });

    await listarProductos({
      q: 'ray',
      categoria: CategoriaProducto.ARO,
      bajoStock: true,
    });

    expect(mockApi.get).toHaveBeenCalledWith('/productos', {
      params: { q: 'ray', categoria: CategoriaProducto.ARO, bajoStock: true },
    });
  });
});

describe('obtenerProducto', () => {
  it('pide el producto por su id', async () => {
    mockApi.get.mockResolvedValue({ data: producto });

    await expect(obtenerProducto(1)).resolves.toEqual(producto);
    expect(mockApi.get).toHaveBeenCalledWith('/productos/1');
  });
});

describe('crearProducto', () => {
  it('envía el cuerpo del alta', async () => {
    mockApi.post.mockResolvedValue({ data: producto });
    const input = {
      sku: 'RB-2140-51',
      nombre: 'Ray-Ban Wayfarer',
      marca: 'Ray-Ban',
      categoria: CategoriaProducto.ARO,
      precio: 189.5,
    };

    await expect(crearProducto(input)).resolves.toEqual(producto);
    expect(mockApi.post).toHaveBeenCalledWith('/productos', input);
  });
});

describe('actualizarProducto', () => {
  it('manda solo los datos maestros que cambian', async () => {
    mockApi.patch.mockResolvedValue({ data: producto });

    await actualizarProducto(1, { precio: 200 });

    expect(mockApi.patch).toHaveBeenCalledWith('/productos/1', { precio: 200 });
  });
});

describe('registrarEntrada', () => {
  it('registra la entrada con su referencia', async () => {
    mockApi.post.mockResolvedValue({ data: asiento });

    await expect(
      registrarEntrada(1, { cantidad: 6, referencia: 'FAC-001' }),
    ).resolves.toEqual(asiento);
    expect(mockApi.post).toHaveBeenCalledWith('/productos/1/entradas', {
      cantidad: 6,
      referencia: 'FAC-001',
    });
  });
});

describe('ajustarStock', () => {
  it('manda el conteo físico real, no la diferencia', async () => {
    mockApi.post.mockResolvedValue({ data: { ...asiento, cantidad: -3 } });

    await ajustarStock(1, { stockFinal: 7, motivo: 'Conteo de agosto' });

    expect(mockApi.post).toHaveBeenCalledWith('/productos/1/ajustes', {
      stockFinal: 7,
      motivo: 'Conteo de agosto',
    });
  });
});

describe('movimientosDeProducto', () => {
  it('sin filtros pide el kardex completo', async () => {
    mockApi.get.mockResolvedValue({ data: [asiento] });

    await expect(movimientosDeProducto(1)).resolves.toEqual([asiento]);
    expect(mockApi.get).toHaveBeenCalledWith('/productos/1/movimientos', {
      params: {},
    });
  });

  it('acota el kardex por tipo y límite', async () => {
    mockApi.get.mockResolvedValue({ data: [] });

    await movimientosDeProducto(1, { tipo: TipoMovimiento.AJUSTE, limite: 10 });

    expect(mockApi.get).toHaveBeenCalledWith('/productos/1/movimientos', {
      params: { tipo: TipoMovimiento.AJUSTE, limite: 10 },
    });
  });
});
