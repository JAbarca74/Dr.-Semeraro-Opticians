import { describe, expect, it } from 'vitest';
import { colones, fechaCorta, fechaHora, hora, numero } from './formato';

const REYES = new Date(2026, 0, 6, 14, 30); // 6 de enero de 2026, 14:30

describe('fechaCorta', () => {
  it('cada idioma escribe el mes en el suyo', () => {
    expect(fechaCorta('es', REYES)).toMatch(/ene/i);
    expect(fechaCorta('en', REYES)).toMatch(/jan/i);
    expect(fechaCorta('it', REYES)).toMatch(/gen/i);
  });

  it('los tres llevan el mismo día y año', () => {
    for (const idioma of ['es', 'en', 'it'] as const) {
      expect(fechaCorta(idioma, REYES)).toContain('06');
      expect(fechaCorta(idioma, REYES)).toContain('2026');
    }
  });

  it('acepta una fecha ISO además de un Date', () => {
    expect(fechaCorta('es', '2026-01-06T14:30:00')).toContain('2026');
  });

  it('una cadena de solo fecha no retrocede un día por el huso', () => {
    // `new Date('2026-09-11')` es UTC medianoche, que en Costa Rica (UTC−6) cae
    // el día 10 a las 18:00. La entrega estimada de un pedido se mostraba un
    // día antes de la real.
    expect(fechaCorta('es', '2026-09-11')).toContain('11');
    expect(fechaCorta('en', '2026-09-11')).toContain('11');
    expect(fechaCorta('it', '2026-09-11')).toContain('11');
  });

  it('con hora incluida se respeta tal cual', () => {
    expect(fechaCorta('es', '2026-09-11T23:30:00')).toContain('11');
  });

  it('una fecha ausente se pinta «—», no el 1 de enero de 1970', () => {
    // `new Date(null)` da la época Unix: el paciente leería que sus lentes
    // llegan hace cincuenta años. `fechaEstimadaEntrega` es nula mientras el
    // laboratorio no la confirme.
    expect(fechaCorta('es', null)).toBe('—');
    expect(fechaCorta('en', undefined)).toBe('—');
    expect(fechaHora('it', null)).toBe('—');
    expect(fechaCorta('es', '')).toBe('—');
  });
});

describe('fechaHora y hora', () => {
  it('la fecha con hora incluye ambas', () => {
    const texto = fechaHora('es', REYES);
    expect(texto).toContain('2026');
    expect(texto).toMatch(/\d{1,2}:\d{2}/);
  });

  it('el inglés usa reloj de 12 h y el italiano de 24 h', () => {
    // Es justo lo que se pierde con `es-CR` fijo en todas partes.
    expect(hora('en', REYES)).toMatch(/PM/i);
    expect(hora('it', REYES)).toContain('14');
  });
});

describe('numero', () => {
  it('el separador de miles cambia con el idioma', () => {
    expect(numero('en', 12345)).toBe('12,345');
    expect(numero('it', 12345)).toBe('12.345');
  });

  it('el italiano no agrupa las cuatro cifras, y aquí se respeta', () => {
    // Convención de `it-IT` para números sueltos: 1234, no 1.234. En importes
    // se fuerza lo contrario a propósito (ver `colones`).
    expect(numero('it', 1234)).toBe('1234');
  });

  it('respeta los decimales pedidos', () => {
    expect(numero('en', 1234.5, 2)).toBe('1,234.50');
  });
});

describe('colones', () => {
  /**
   * ⚠️ La regla de negocio de `DSO-57`: **el idioma cambia el formato del
   * número, nunca la moneda**. Un `$189.50` en la versión inglesa haría creer
   * que ese es el precio, y el precio de la óptica está en colones.
   */
  it('lleva el símbolo del colón en los tres idiomas', () => {
    expect(colones('es', 189.5)).toContain('₡');
    expect(colones('en', 189.5)).toContain('₡');
    expect(colones('it', 189.5)).toContain('₡');
  });

  it('ninguno escribe el símbolo del dólar', () => {
    for (const idioma of ['es', 'en', 'it'] as const) {
      expect(colones(idioma, 189.5)).not.toContain('$');
    }
  });

  it('pero el formato del número sí sigue al idioma', () => {
    expect(colones('en', 1234.5)).toBe('₡1,234.50');
    expect(colones('it', 1234.5)).toBe('₡1.234,50');
  });

  it('los importes agrupan siempre, aunque el idioma no lo haría', () => {
    // Sin esto, una lista italiana mezclaría ₡1234,00 con ₡12.345,00.
    expect(colones('it', 1234)).toContain('1.234');
    expect(colones('it', 12345)).toContain('12.345');
  });

  it('el español mantiene exactamente el formato que ya tenía la aplicación', () => {
    // `es-CR` separa los miles con un espacio fino, no con un punto. Es lo que
    // el catálogo lleva mostrando desde siempre: esto no debe cambiarlo.
    expect(colones('es', 189.5)).toBe('₡189,50');
    // El separador es un espacio duro (U+00A0), no un punto ni un espacio normal.
    expect(colones('es', 1234.5)).toBe('₡1 234,50');
  });

  it('siempre con dos decimales, que es un importe', () => {
    expect(colones('es', 100)).toContain('00');
  });
});
