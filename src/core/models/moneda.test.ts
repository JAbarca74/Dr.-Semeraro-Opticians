import { describe, expect, it } from 'vitest';
import { aproximadoUsd, type TipoCambio } from './moneda';

const CON_TASA: TipoCambio = {
  disponible: true,
  valor: 505,
  fecha: '2026-08-27T00:00:00.000Z',
  fuente: 'open.er-api.com',
};
const SIN_TASA: TipoCambio = { disponible: false };

describe('aproximadoUsd', () => {
  it('convierte y redondea a céntimos', () => {
    expect(aproximadoUsd(505, CON_TASA)).toBe(1);
    expect(aproximadoUsd(189.5, CON_TASA)).toBe(0.38);
  });

  /**
   * ⚠️ **La regla entera de `DSO-57` está en estas cuatro pruebas.** Un `$0.00`
   * junto a un aro de ₡189,50 no es un dato incompleto: es un dato **falso**, y
   * el visitante no tiene forma de saberlo. Sin tasa fiable no se enseña nada.
   */
  it('sin tasa devuelve null, no cero', () => {
    expect(aproximadoUsd(189.5, SIN_TASA)).toBeNull();
  });

  it('con tasa en cero devuelve null, no Infinity', () => {
    expect(aproximadoUsd(189.5, { ...CON_TASA, valor: 0 })).toBeNull();
  });

  it('con tasa negativa devuelve null, no un importe negativo', () => {
    expect(aproximadoUsd(189.5, { ...CON_TASA, valor: -5 })).toBeNull();
  });

  it('con tasa no finita devuelve null', () => {
    expect(aproximadoUsd(189.5, { ...CON_TASA, valor: Number.NaN })).toBeNull();
    expect(
      aproximadoUsd(189.5, { ...CON_TASA, valor: Number.POSITIVE_INFINITY }),
    ).toBeNull();
  });

  it('con un precio no finito devuelve null, no NaN', () => {
    expect(aproximadoUsd(Number.NaN, CON_TASA)).toBeNull();
  });

  it('un precio de cero sí convierte: cero colones son cero dólares', () => {
    // Es distinto de «no hay tasa»: aquí el dato es real.
    expect(aproximadoUsd(0, CON_TASA)).toBe(0);
  });
});
