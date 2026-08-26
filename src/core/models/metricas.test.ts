import { describe, expect, it } from 'vitest';
import {
  ENCABEZADOS_CSV,
  filasCsvMetricas,
  hoyISO,
  nombreReporte,
  periodoLegible,
  porcentaje,
  primerDiaDelMes,
} from './metricas';
import type { ResumenMetricas } from './metricas';

describe('primerDiaDelMes', () => {
  it('devuelve el día 1 del mes dado, con dos dígitos', () => {
    expect(primerDiaDelMes(new Date(2026, 2, 17))).toBe('2026-03-01');
  });

  it('rellena el mes de un dígito', () => {
    expect(primerDiaDelMes(new Date(2026, 0, 5))).toBe('2026-01-01');
  });
});

describe('hoyISO', () => {
  it('formatea año-mes-día con relleno', () => {
    expect(hoyISO(new Date(2026, 8, 7))).toBe('2026-09-07');
  });
});

describe('porcentaje', () => {
  it('calcula con un decimal', () => {
    expect(porcentaje(1, 3)).toBe(33.3);
  });

  it('con total 0 devuelve 0, no NaN', () => {
    // Una barra con width: NaN% no se pinta y la gráfica queda coja.
    expect(porcentaje(5, 0)).toBe(0);
    expect(Number.isNaN(porcentaje(5, 0))).toBe(false);
  });

  it('el total completo es 100', () => {
    expect(porcentaje(7, 7)).toBe(100);
  });

  it('cero sobre un total válido es 0', () => {
    expect(porcentaje(0, 9)).toBe(0);
  });
});

describe('periodoLegible', () => {
  it('muestra los dos extremos separados por una raya', () => {
    const texto = periodoLegible(
      '2026-03-01T00:00:00.000Z',
      '2026-03-31T23:59:59.999Z',
    );
    expect(texto).toContain('—');
    expect(texto).toMatch(/2026/);
  });
});

const resumen = (cambios: Partial<ResumenMetricas> = {}): ResumenMetricas => ({
  periodo: { desde: '2026-08-01T12:00:00.000Z', hasta: '2026-08-26T12:00:00.000Z' },
  sinDatos: false,
  ventas: { ingresos: 758, cantidad: 4, ticketPromedio: 189.5, anuladas: 11 },
  inventario: { productos: 4, unidadesEnBodega: 55, bajoStock: 0, unidadesVendidas: 4 },
  agenda: {
    total: 9,
    porEstado: { Solicitada: 0, Confirmada: 7, Cancelada: 1, Reprogramada: 1 },
  },
  topAros: [
    {
      idProducto: 9,
      sku: 'DEMO-1',
      nombre: 'Armazón Ray-Ban Wayfarer',
      marca: 'Ray-Ban',
      unidades: 4,
      ingresos: 758,
    },
  ],
  ...cambios,
});

/** Busca una fila por sección y concepto. */
const fila = (filas: unknown[][], seccion: string, concepto: string) =>
  filas.find((f) => f[0] === seccion && f[1] === concepto);

describe('filasCsvMetricas (CU-19, flujo alterno)', () => {
  it('abre con el periodo consultado', () => {
    const filas = filasCsvMetricas(resumen());
    expect(fila(filas, 'Periodo', 'Desde')?.[2]).toBe('2026-08-01');
    expect(fila(filas, 'Periodo', 'Hasta')?.[2]).toBe('2026-08-26');
  });

  it('el «hasta» es el día que se pidió, no el que sale de cortar el ISO', () => {
    // El backend arma el rango con la hora local de la óptica y lo serializa en
    // UTC: el 26 de agosto a las 23:59 viaja como `2026-08-27T05:59:59.999Z`.
    // Cortando la cadena, el archivo decía «Hasta 2026-08-27».
    const filas = filasCsvMetricas(
      resumen({
        periodo: {
          desde: new Date(2026, 7, 1, 0, 0, 0).toISOString(),
          hasta: new Date(2026, 7, 26, 23, 59, 59, 999).toISOString(),
        },
      }),
    );

    expect(fila(filas, 'Periodo', 'Desde')?.[2]).toBe('2026-08-01');
    expect(fila(filas, 'Periodo', 'Hasta')?.[2]).toBe('2026-08-26');
  });

  it('los importes van crudos, sin «₡» ni separador de miles', () => {
    const filas = filasCsvMetricas(resumen());
    // Con el símbolo pegado, Excel importa la columna como texto y no suma.
    expect(fila(filas, 'Indicadores', 'Ingresos internos (CRC)')?.[2]).toBe(758);
    expect(fila(filas, 'Indicadores', 'Ticket promedio (CRC)')?.[2]).toBe(189.5);
  });

  it('las anuladas salen rotuladas como fuera del ingreso', () => {
    const filas = filasCsvMetricas(resumen());
    const f = fila(filas, 'Indicadores', 'Ventas anuladas');
    expect(f?.[2]).toBe(11);
    expect(f?.[3]).toBe('Excluidas del ingreso');
  });

  it('incluye el top de aros con marca, SKU e ingresos', () => {
    const filas = filasCsvMetricas(resumen());
    const f = fila(filas, 'Aros más vendidos', 'Armazón Ray-Ban Wayfarer');
    expect(f?.[2]).toBe(4);
    expect(f?.[3]).toContain('DEMO-1');
  });

  it('incluye los cuatro estados de agenda con su porcentaje', () => {
    const filas = filasCsvMetricas(resumen());
    expect(fila(filas, 'Agenda', 'Confirmada')?.[3]).toBe('77.8%');
    expect(fila(filas, 'Agenda', 'Solicitada')?.[2]).toBe(0);
  });

  it('marca las existencias como del día de hoy, no del periodo', () => {
    const filas = filasCsvMetricas(resumen());
    expect(fila(filas, 'Inventario', 'Unidades en bodega')?.[3]).toBe(
      'Existencias de hoy',
    );
  });

  it('EX-21: con el periodo vacío el archivo lo dice, no sale a medias', () => {
    const filas = filasCsvMetricas(resumen({ sinDatos: true }));

    expect(fila(filas, 'Resultado', 'Sin registros')?.[3]).toBe(
      'No hay registros disponibles para este periodo',
    );
    // Y no inventa indicadores para un periodo en el que no pasó nada.
    expect(fila(filas, 'Indicadores', 'Ingresos internos (CRC)')).toBeUndefined();
  });

  it('las filas tienen tantas columnas como encabezados', () => {
    expect(ENCABEZADOS_CSV).toHaveLength(4);
    for (const f of filasCsvMetricas(resumen())) {
      expect(f).toHaveLength(4);
    }
  });
});

describe('nombreReporte', () => {
  it('lleva el rango dentro para no pisar la descarga anterior', () => {
    expect(nombreReporte(resumen(), 'csv')).toBe('metricas-2026-08-01_2026-08-26.csv');
    expect(nombreReporte(resumen(), 'pdf')).toBe('metricas-2026-08-01_2026-08-26.pdf');
  });
});
