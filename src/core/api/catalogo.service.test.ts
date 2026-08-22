import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  listarCatalogo,
  marcasDelCatalogo,
  parametrosPublicos,
} from './catalogo.service';
import { CategoriaProducto } from '../models/inventario';
import type { ProductoVitrina } from '../models/catalogo';

vi.mock('./http', () => ({ default: { get: vi.fn() } }));

import api from './http';

const mockApi = api as unknown as { get: ReturnType<typeof vi.fn> };

const vitrina: ProductoVitrina = {
  idProducto: 1,
  sku: 'RB-2140-51',
  nombre: 'Ray-Ban Wayfarer',
  marca: 'Ray-Ban',
  categoria: CategoriaProducto.ARO,
  precio: 189.5,
  color: 'Negro',
  material: 'Acetato',
  calibre: null,
  indiceRefraccion: null,
  filtro: null,
  tratamiento: null,
  imagenUrl: null,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('listarCatalogo', () => {
  it('sin filtros pide el catálogo completo', async () => {
    mockApi.get.mockResolvedValue({ data: [vitrina] });

    await expect(listarCatalogo()).resolves.toEqual([vitrina]);
    expect(mockApi.get).toHaveBeenCalledWith('/catalogo', { params: {} });
  });

  it('pasa búsqueda, marca y categoría', async () => {
    mockApi.get.mockResolvedValue({ data: [] });

    await listarCatalogo({
      q: 'wayfarer',
      marca: 'Ray-Ban',
      categoria: CategoriaProducto.ARO,
    });

    expect(mockApi.get).toHaveBeenCalledWith('/catalogo', {
      params: { q: 'wayfarer', marca: 'Ray-Ban', categoria: CategoriaProducto.ARO },
    });
  });

  it('lo que devuelve no trae existencias ni umbral', async () => {
    mockApi.get.mockResolvedValue({ data: [vitrina] });

    const [producto] = await listarCatalogo();

    // Contrato del endpoint público: si esto cambia, el backend está filtrando
    // de menos y la vitrina publicaría el inventario de la óptica.
    expect(producto).not.toHaveProperty('stock');
    expect(producto).not.toHaveProperty('umbralMinimo');
    expect(producto).not.toHaveProperty('bajoStock');
  });
});

describe('marcasDelCatalogo', () => {
  it('pide las marcas publicadas', async () => {
    mockApi.get.mockResolvedValue({ data: ['Ray-Ban', 'Oakley'] });

    await expect(marcasDelCatalogo()).resolves.toEqual(['Ray-Ban', 'Oakley']);
    expect(mockApi.get).toHaveBeenCalledWith('/catalogo/marcas');
  });
});

describe('parametrosPublicos', () => {
  it('pide la lista blanca de parámetros', async () => {
    mockApi.get.mockResolvedValue({
      data: { 'optica.nombre': 'Óptica Dr. Semeraro', 'optica.whatsapp': '50688887777' },
    });

    await expect(parametrosPublicos()).resolves.toMatchObject({
      'optica.whatsapp': '50688887777',
    });
    expect(mockApi.get).toHaveBeenCalledWith('/configuracion/publicos');
  });
});
