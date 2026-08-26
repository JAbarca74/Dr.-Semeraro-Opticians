import { describe, expect, it } from 'vitest';
import { hoyISO, periodoLegible, porcentaje, primerDiaDelMes } from './metricas';

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
