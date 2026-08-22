/**
 * Inventario (CU-03).
 *
 * Espejo del contrato publicado en
 * `optica-semeraro-api/docs/contratos-sprint8.md` §1.
 */

export const CategoriaProducto = {
  ARO: 'Aro',
  LENTE: 'Lente',
  ACCESORIO: 'Accesorio',
} as const;

export type CategoriaProducto =
  (typeof CategoriaProducto)[keyof typeof CategoriaProducto];

export const CATEGORIAS: CategoriaProducto[] = [
  CategoriaProducto.ARO,
  CategoriaProducto.LENTE,
  CategoriaProducto.ACCESORIO,
];

export interface Producto {
  idProducto: number;
  sku: string;
  nombre: string;
  marca: string;
  categoria: CategoriaProducto;
  stock: number;
  umbralMinimo: number;
  /** Lo calcula la API (`stock <= umbralMinimo`), no la pantalla. */
  bajoStock: boolean;
  precio: number;
  color: string | null;
  material: string | null;
  calibre: number | null;
  indiceRefraccion: number | null;
  filtro: string | null;
  tratamiento: string | null;
  formasRostroCompatibles: string[] | null;
  /** CU-09 paso 2: si el producto se muestra en el catálogo público. */
  esPublico: boolean;
  imagenUrl: string | null;
}

/**
 * Cuerpo del alta. ⚠️ **`stock` solo se acepta al crear**, como existencia
 * inicial: en el `PATCH` el backend lo rechaza con un 400, porque toda variación
 * posterior tiene que pasar por entradas o ajustes para dejar kardex.
 */
export interface ProductoInput {
  sku: string;
  nombre: string;
  marca: string;
  categoria: CategoriaProducto;
  precio: number;
  stock?: number;
  umbralMinimo?: number;
  color?: string;
  material?: string;
  calibre?: number;
  indiceRefraccion?: number;
  filtro?: string;
  tratamiento?: string;
  esPublico?: boolean;
  imagenUrl?: string;
  formasRostroCompatibles?: string[];
}

export const TipoMovimiento = {
  ENTRADA: 'entrada',
  SALIDA: 'salida',
  AJUSTE: 'ajuste',
} as const;

export type TipoMovimiento =
  (typeof TipoMovimiento)[keyof typeof TipoMovimiento];

export interface MovimientoInventario {
  idMovimientoInventario: number;
  idProducto: number;
  idUsuario: number;
  tipo: TipoMovimiento;
  /** Firmada: negativa en salidas y en ajustes a la baja. */
  cantidad: number;
  stockAntes: number;
  stockDespues: number;
  referencia: string | null;
  createdAt: string;
}

export interface EntradaInput {
  cantidad: number;
  referencia?: string;
}

/** El conteo físico real, no la diferencia: el servidor deriva el delta. */
export interface AjusteInput {
  stockFinal: number;
  motivo: string;
}

const ETIQUETAS_MOVIMIENTO: Record<TipoMovimiento, string> = {
  [TipoMovimiento.ENTRADA]: 'Entrada',
  [TipoMovimiento.SALIDA]: 'Salida',
  [TipoMovimiento.AJUSTE]: 'Ajuste',
};

export const etiquetaMovimiento = (tipo: TipoMovimiento): string =>
  ETIQUETAS_MOVIMIENTO[tipo] ?? tipo;

/** Importe en colones, la moneda del cliente. */
export const colones = (monto: number): string =>
  new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 2,
  }).format(monto);

/** Cantidad firmada tal como debe leerse en el kardex: «+6», «−3», «0». */
export const cantidadFirmada = (cantidad: number): string => {
  if (cantidad > 0) return `+${cantidad}`;
  if (cantidad < 0) return `−${Math.abs(cantidad)}`;
  return '0';
};

export const fechaHoraLarga = (iso: string): string =>
  new Date(iso).toLocaleString('es-CR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * Descompone el SKU tal como lo guarda el backend: en mayúsculas y sin espacios
 * laterales. Se replica aquí para que el campo muestre en el acto lo que se va
 * a guardar, y no una cosa distinta de la que acabará en la base.
 */
export const normalizarSku = (sku: string): string => sku.trim().toUpperCase();
