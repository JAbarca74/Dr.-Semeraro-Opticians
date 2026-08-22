import { describe, expect, it } from 'vitest';
import {
  CATEGORIAS,
  CategoriaProducto,
  TipoMovimiento,
  cantidadFirmada,
  colones,
  etiquetaMovimiento,
  fechaHoraLarga,
  normalizarSku,
} from './inventario';

describe('CATEGORIAS', () => {
  it('son las tres del enum del backend', () => {
    expect(CATEGORIAS).toEqual([
      CategoriaProducto.ARO,
      CategoriaProducto.LENTE,
      CategoriaProducto.ACCESORIO,
    ]);
  });
});

describe('etiquetaMovimiento', () => {
  it('nombra los tres tipos de asiento', () => {
    expect(etiquetaMovimiento(TipoMovimiento.ENTRADA)).toBe('Entrada');
    expect(etiquetaMovimiento(TipoMovimiento.SALIDA)).toBe('Salida');
    expect(etiquetaMovimiento(TipoMovimiento.AJUSTE)).toBe('Ajuste');
  });

  it('devuelve el valor crudo si llegara un tipo desconocido', () => {
    expect(etiquetaMovimiento('devolucion' as TipoMovimiento)).toBe('devolucion');
  });
});

describe('colones', () => {
  it('formatea el importe en la moneda del cliente', () => {
    const texto = colones(189.5);
    expect(texto).toMatch(/189/);
    expect(texto).toMatch(/[₡]|CRC/);
  });

  it('mantiene los dos decimales y agrupa los miles', () => {
    // `es-CR` separa los miles con un espacio duro y usa coma decimal:
    // «₡1 000,00». No se fija el separador exacto para no atar la prueba a la
    // versión de ICU del entorno.
    const texto = colones(1000);
    expect(texto).toMatch(/1\s?000,00/);
  });
});

describe('cantidadFirmada', () => {
  it('marca las entradas con signo más', () => {
    expect(cantidadFirmada(6)).toBe('+6');
  });

  it('marca las salidas con el menos tipográfico, no un guion', () => {
    expect(cantidadFirmada(-3)).toBe('−3');
  });

  it('un conteo que cuadra se lee como cero, sin signo', () => {
    expect(cantidadFirmada(0)).toBe('0');
  });
});

describe('fechaHoraLarga', () => {
  it('incluye fecha y hora del asiento', () => {
    const texto = fechaHoraLarga('2026-08-20T15:30:00.000Z');
    expect(texto).toMatch(/2026/);
    expect(texto).toMatch(/:/);
  });
});

describe('normalizarSku', () => {
  it('replica lo que el backend guarda: mayúsculas y sin espacios laterales', () => {
    expect(normalizarSku('  rb-2140-51 ')).toBe('RB-2140-51');
  });

  it('un SKU ya normalizado no cambia', () => {
    expect(normalizarSku('RB-2140-51')).toBe('RB-2140-51');
  });
});
