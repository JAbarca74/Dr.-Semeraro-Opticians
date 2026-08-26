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

/**
 * CU-19, flujo alterno «Descargar Resumen»: el CSV se arma **con lo que ya
 * está en pantalla**, sin volver a preguntarle a la API. Es lo que pide el
 * literal del caso de uso y, de paso, lo que exige **RS-18**: una descarga no
 * debería costarle a la base transaccional otra ronda de agregaciones.
 */
export const ENCABEZADOS_CSV = ['Sección', 'Concepto', 'Valor', 'Detalle'];

/**
 * Un extremo del periodo en `YYYY-MM-DD`, **en hora local**.
 *
 * ⚠️ **No vale `iso.slice(0, 10)`.** El backend arma el rango con la hora local
 * de la óptica y lo serializa en UTC: el `hasta` del 26 de agosto viaja como
 * `2026-08-27T05:59:59.999Z`, seis horas por delante. Cortando la cadena, el
 * archivo decía «Hasta 2026-08-27» mientras la pantalla mostraba «26 ago» —se
 * vio al abrir el CSV real, no en las pruebas—. Reconstruir la fecha la
 * devuelve al día que el usuario pidió.
 */
const diaLocal = (iso: string): string => hoyISO(new Date(iso));

/**
 * Las filas del CSV, en formato largo (una métrica por línea).
 *
 * ⚠️ **Los importes van crudos, sin «₡» ni separador de miles.** Con el símbolo
 * de moneda pegado, Excel importa la columna como texto y no se puede sumar,
 * que es justo para lo que alguien se baja un CSV.
 */
export const filasCsvMetricas = (d: ResumenMetricas): unknown[][] => {
  const periodo: unknown[][] = [
    ['Periodo', 'Desde', diaLocal(d.periodo.desde), ''],
    ['Periodo', 'Hasta', diaLocal(d.periodo.hasta), ''],
  ];

  // EX-21: el archivo se genera igual y dice que el periodo está vacío. Un CSV
  // con solo el encabezado no distingue «no hubo nada» de «falló la descarga».
  if (d.sinDatos) {
    return [
      ...periodo,
      ['Resultado', 'Sin registros', 0, 'No hay registros disponibles para este periodo'],
    ];
  }

  return [
    ...periodo,
    ['Indicadores', 'Ingresos internos (CRC)', d.ventas.ingresos, `${d.ventas.cantidad} venta(s)`],
    ['Indicadores', 'Ticket promedio (CRC)', d.ventas.ticketPromedio, ''],
    ['Indicadores', 'Ventas anuladas', d.ventas.anuladas, 'Excluidas del ingreso'],
    ['Indicadores', 'Unidades vendidas', d.inventario.unidadesVendidas, ''],
    ['Indicadores', 'Citas del periodo', d.agenda.total, ''],
    ...d.topAros.map((a) => [
      'Aros más vendidos',
      a.nombre,
      a.unidades,
      `${a.marca} · ${a.sku} · CRC ${a.ingresos}`,
    ]),
    ...Object.entries(d.agenda.porEstado).map(([estado, total]) => [
      'Agenda',
      estado,
      total,
      `${porcentaje(total, d.agenda.total)}%`,
    ]),
    ['Inventario', 'Productos en catálogo', d.inventario.productos, 'Existencias de hoy'],
    ['Inventario', 'Unidades en bodega', d.inventario.unidadesEnBodega, 'Existencias de hoy'],
    ['Inventario', 'Productos bajo stock', d.inventario.bajoStock, 'Existencias de hoy'],
    ['Inventario', 'Salidas del periodo', d.inventario.unidadesVendidas, ''],
  ];
};

/** Nombre del archivo descargado, con el rango dentro para no pisar el anterior. */
export const nombreReporte = (
  d: ResumenMetricas,
  extension: 'csv' | 'pdf',
): string =>
  `metricas-${diaLocal(d.periodo.desde)}_${diaLocal(d.periodo.hasta)}.${extension}`;
