import api from './http';
import type {
  AjusteInput,
  CategoriaProducto,
  EntradaInput,
  MovimientoInventario,
  Producto,
  ProductoInput,
  TipoMovimiento,
} from '../models/inventario';

export interface FiltrosProducto {
  /** Busca en SKU, nombre y marca. */
  q?: string;
  categoria?: CategoriaProducto;
  /** Solo los que cumplen `stock <= umbralMinimo`. */
  bajoStock?: boolean;
}

export const listarProductos = (
  filtros: FiltrosProducto = {},
): Promise<Producto[]> =>
  api.get<Producto[]>('/productos', { params: filtros }).then((r) => r.data);

export const obtenerProducto = (id: number): Promise<Producto> =>
  api.get<Producto>(`/productos/${id}`).then((r) => r.data);

export const crearProducto = (input: ProductoInput): Promise<Producto> =>
  api.post<Producto>('/productos', input).then((r) => r.data);

/**
 * Datos maestros del producto.
 *
 * ⚠️ **No acepta `stock`**: el backend responde 400 si llega. Toda variación de
 * existencias pasa por `registrarEntrada` o `ajustarStock`, que son las que
 * dejan asiento en el kardex. El tipo lo refleja para que no se pueda mandar
 * por descuido.
 */
export const actualizarProducto = (
  id: number,
  input: Partial<Omit<ProductoInput, 'stock'>>,
): Promise<Producto> =>
  api.patch<Producto>(`/productos/${id}`, input).then((r) => r.data);

/** CU-03 flujo principal: entrada de mercadería. */
export const registrarEntrada = (
  id: number,
  input: EntradaInput,
): Promise<MovimientoInventario> =>
  api
    .post<MovimientoInventario>(`/productos/${id}/entradas`, input)
    .then((r) => r.data);

/** CU-03 flujo alterno: ajuste contra el conteo físico. */
export const ajustarStock = (
  id: number,
  input: AjusteInput,
): Promise<MovimientoInventario> =>
  api
    .post<MovimientoInventario>(`/productos/${id}/ajustes`, input)
    .then((r) => r.data);

export interface FiltrosMovimiento {
  tipo?: TipoMovimiento;
  desde?: string;
  hasta?: string;
  limite?: number;
}

export const movimientosDeProducto = (
  id: number,
  filtros: FiltrosMovimiento = {},
): Promise<MovimientoInventario[]> =>
  api
    .get<MovimientoInventario[]>(`/productos/${id}/movimientos`, {
      params: filtros,
    })
    .then((r) => r.data);
