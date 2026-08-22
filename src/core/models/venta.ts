/**
 * Ventas y salida de productos (CU-04).
 *
 * Espejo del contrato publicado en
 * `optica-semeraro-api/docs/contratos-sprint8.md` §2.
 */

export const EstadoVenta = {
  ACTIVA: 'activa',
  ANULADA: 'anulada',
} as const;

export type EstadoVenta = (typeof EstadoVenta)[keyof typeof EstadoVenta];

export interface LineaVenta {
  idDetalleVenta: number;
  idProducto: number;
  /** Denormalizados por la API para que la caja no encadene peticiones. */
  sku: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface Venta {
  idVenta: number;
  idPaciente: number | null;
  nombrePaciente: string | null;
  idUsuario: number;
  total: number;
  estado: EstadoVenta;
  fecha: string;
  detalles: LineaVenta[];
}

/**
 * Cuerpo del alta.
 *
 * ⚠️ **No lleva `idUsuario` ni `precioUnitario`**, y no es un olvido: el primero
 * sale del JWT y el segundo lo carga el servidor desde el producto (CU-04 paso
 * 4). Si el precio viniera del navegador, lo decidiría el navegador.
 */
export interface VentaInput {
  idPaciente?: number;
  detalles: Array<{ idProducto: number; cantidad: number }>;
}

export interface AnulacionInput {
  motivo: string;
}

/** Una línea del carrito, antes de que exista la venta. */
export interface LineaCarrito {
  idProducto: number;
  sku: string;
  nombre: string;
  /** Precio de referencia mostrado en pantalla; el que manda es el del servidor. */
  precio: number;
  cantidad: number;
  /** Existencias del producto al momento de añadirlo, para avisar antes de cobrar. */
  stockDisponible: number;
}

const ETIQUETAS_ESTADO: Record<EstadoVenta, string> = {
  [EstadoVenta.ACTIVA]: 'Activa',
  [EstadoVenta.ANULADA]: 'Anulada',
};

export const etiquetaEstadoVenta = (estado: EstadoVenta): string =>
  ETIQUETAS_ESTADO[estado] ?? estado;

/**
 * Total del carrito, **solo para mostrar**. El importe que se cobra lo calcula
 * el servidor con los precios de la base: si aquí saliera otro número, manda el
 * de la respuesta.
 */
export const totalCarrito = (lineas: LineaCarrito[]): number => {
  const suma = lineas.reduce((t, l) => t + l.cantidad * l.precio, 0);
  return Math.round(suma * 100) / 100;
};

/**
 * Añade al carrito **consolidando** las líneas del mismo producto, igual que
 * hace el backend antes de validar existencias. Si el carrito mandara dos
 * líneas de 3 unidades y el stock fuera 5, la pantalla dejaría intentar una
 * venta que el servidor va a rechazar.
 */
export const agregarAlCarrito = (
  lineas: LineaCarrito[],
  nueva: LineaCarrito,
): LineaCarrito[] => {
  const existente = lineas.find((l) => l.idProducto === nueva.idProducto);
  if (!existente) {
    return [...lineas, nueva];
  }
  return lineas.map((l) =>
    l.idProducto === nueva.idProducto
      ? { ...l, cantidad: l.cantidad + nueva.cantidad }
      : l,
  );
};

/**
 * Las líneas que piden más de lo que hay. Es un aviso **anticipado**: quien
 * decide es el 409 de EX-05, porque entre que se pintó la pantalla y se cobra
 * puede haber vendido otra persona.
 */
export const lineasSinExistencias = (lineas: LineaCarrito[]): LineaCarrito[] =>
  lineas.filter((l) => l.cantidad > l.stockDisponible);

export const fechaHoraLarga = (iso: string): string =>
  new Date(iso).toLocaleString('es-CR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
