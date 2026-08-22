import api from './http';
import type { CategoriaProducto } from '../models/inventario';
import type { ParametrosPublicos, ProductoVitrina } from '../models/catalogo';

export interface FiltrosCatalogo {
  /** Coincidencia parcial de modelo o marca (flujo alterno de CU-09). */
  q?: string;
  marca?: string;
  categoria?: CategoriaProducto;
}

/**
 * Catálogo público. **No requiere sesión**: es la precondición de CU-09.
 *
 * Usa la misma instancia de Axios que el resto — el interceptor adjunta el
 * token *si lo hay*, y al backend le da igual: el endpoint no tiene guards.
 */
export const listarCatalogo = (
  filtros: FiltrosCatalogo = {},
): Promise<ProductoVitrina[]> =>
  api.get<ProductoVitrina[]>('/catalogo', { params: filtros }).then((r) => r.data);

/** Marcas con algo publicado, para armar el filtro de CU-09 paso 3. */
export const marcasDelCatalogo = (): Promise<string[]> =>
  api.get<string[]>('/catalogo/marcas').then((r) => r.data);

/** Nombre de la óptica y WhatsApp de Recepción. Lista blanca en el backend. */
export const parametrosPublicos = (): Promise<ParametrosPublicos> =>
  api.get<ParametrosPublicos>('/configuracion/publicos').then((r) => r.data);
