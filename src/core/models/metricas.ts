/**
 * Métricas gerenciales (CU-19).
 *
 * Espejo de `ResumenMetricas` del backend. Todo lo que llega ya viene agregado
 * en SQL (RS-18): aquí **no se recalcula nada**, solo se pinta.
 */

export interface AroVendido {
  idProducto: number;
  sku: string;
  nombre: string;
  marca: string;
  unidades: number;
  ingresos: number;
}

export interface ResumenMetricas {
  periodo: { desde: string; hasta: string };
  /** `true` cuando no hubo ni ventas ni citas: lo rotula **EX-21**. */
  sinDatos: boolean;
  ventas: {
    ingresos: number;
    cantidad: number;
    ticketPromedio: number;
    anuladas: number;
  };
  inventario: {
    productos: number;
    unidadesEnBodega: number;
    bajoStock: number;
    unidadesVendidas: number;
  };
  agenda: {
    total: number;
    porEstado: Record<string, number>;
  };
  topAros: AroVendido[];
}

export interface FiltrosMetricas {
  desde?: string;
  hasta?: string;
  limite?: number;
}

/** El primer día del mes actual, en `YYYY-MM-DD`. CU-19 paso 2. */
export const primerDiaDelMes = (hoy: Date = new Date()): string =>
  `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;

/** Hoy en `YYYY-MM-DD`, para el extremo derecho del rango. */
export const hoyISO = (hoy: Date = new Date()): string =>
  `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(
    hoy.getDate(),
  ).padStart(2, '0')}`;

/**
 * Porcentaje de un valor sobre un total, para las barras de la gráfica.
 *
 * Devuelve 0 cuando el total es 0 en vez de `NaN`: una barra con `width: NaN%`
 * no se pinta y la gráfica queda coja sin decir por qué.
 */
export const porcentaje = (valor: number, total: number): number =>
  total > 0 ? Math.round((valor / total) * 1000) / 10 : 0;

/** Rango legible para el encabezado del panel. */
export const periodoLegible = (desde: string, hasta: string): string => {
  const f = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('es-CR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };
  return `${f(desde)} — ${f(hasta)}`;
};
