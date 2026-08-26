import { describe, expect, it } from 'vitest';
import {
  MENSAJE_CONTACTO_RAPIDO,
  construirMensajeCita,
} from './cita-whatsapp';

describe('construirMensajeCita', () => {
  it('lleva el nombre y el motivo, que es lo que CU-11 manda recopilar', () => {
    const m = construirMensajeCita(
      { nombre: 'Ana Mora', motivo: 'Control anual' },
      'Óptica Dr. Semeraro',
    );
    expect(m).toContain('Ana Mora');
    expect(m).toContain('Control anual');
    expect(m).toContain('Óptica Dr. Semeraro');
  });

  it('recorta los espacios sobrantes de lo que se teclea', () => {
    const m = construirMensajeCita({ nombre: '  Ana  ', motivo: '  Control  ' });
    expect(m).toContain('soy Ana y');
    expect(m).toContain('consulta: Control');
  });

  it('sin nombre de óptica usa un genérico, no deja un hueco', () => {
    expect(construirMensajeCita({ nombre: 'Ana', motivo: 'X' })).toContain(
      'la óptica',
    );
  });
});

describe('MENSAJE_CONTACTO_RAPIDO', () => {
  it('es el saludo genérico del flujo alterno de CU-11', () => {
    expect(MENSAJE_CONTACTO_RAPIDO).toBe(
      'Hola, deseo información sobre disponibilidad de citas.',
    );
  });

  it('no pide ni incluye datos del visitante', () => {
    expect(MENSAJE_CONTACTO_RAPIDO).not.toMatch(/\d{4}/);
  });
});
