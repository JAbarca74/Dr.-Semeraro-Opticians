import { describe, expect, it } from 'vitest';
import {
  aFormatoInternacional,
  partirTelefono,
  soloDigitos,
  unirTelefono,
} from './telefono';
import { PAISES, etiquetaPais } from './paises';

describe('soloDigitos', () => {
  it('quita espacios, guiones y paréntesis', () => {
    expect(soloDigitos('(506) 8888-7777')).toBe('50688887777');
  });

  it('deja intacta una cadena que ya es numérica', () => {
    expect(soloDigitos('72221959')).toBe('72221959');
  });
});

describe('partirTelefono', () => {
  it('separa prefijo y número de un teléfono guardado', () => {
    expect(partirTelefono('+506 72221959')).toEqual({
      prefijo: '+506',
      numero: '72221959',
    });
  });

  it('sin valor devuelve Costa Rica y número vacío', () => {
    expect(partirTelefono('')).toEqual({ prefijo: '+506', numero: '' });
    expect(partirTelefono(null)).toEqual({ prefijo: '+506', numero: '' });
    expect(partirTelefono(undefined)).toEqual({ prefijo: '+506', numero: '' });
  });

  it('un número heredado sin prefijo se atribuye al país por defecto', () => {
    // Lo que ya estaba en la base antes de que el formulario pidiera el país.
    expect(partirTelefono('8710-1122')).toEqual({
      prefijo: '+506',
      numero: '8710-1122',
    });
  });

  it('prefiere el prefijo más largo cuando uno empieza por otro', () => {
    // +1809 (República Dominicana) empieza por +1 (Estados Unidos).
    expect(partirTelefono('+1809 5551234').prefijo).toBe('+1809');
    expect(partirTelefono('+1 5551234').prefijo).toBe('+1');
  });

  it('un prefijo desconocido no se inventa: queda como número local', () => {
    expect(partirTelefono('+9999 123')).toEqual({
      prefijo: '+506',
      numero: '+9999 123',
    });
  });

  it('tolera espacios sobrantes alrededor', () => {
    expect(partirTelefono('  +34 600123123  ')).toEqual({
      prefijo: '+34',
      numero: '600123123',
    });
  });
});

describe('unirTelefono', () => {
  it('compone prefijo y número', () => {
    expect(unirTelefono('+506', '72221959')).toBe('+506 72221959');
  });

  it('un número vacío no produce un teléfono suelto con solo el prefijo', () => {
    expect(unirTelefono('+506', '')).toBe('');
    expect(unirTelefono('+506', '   ')).toBe('');
  });
});

describe('aFormatoInternacional', () => {
  it('arma el número que admite wa.me', () => {
    expect(aFormatoInternacional('+506 7222-1959')).toBe('50672221959');
  });

  it('a un número heredado le antepone el país por defecto', () => {
    expect(aFormatoInternacional('72221959')).toBe('50672221959');
  });

  it('sin teléfono devuelve solo el prefijo por defecto', () => {
    expect(aFormatoInternacional('')).toBe('506');
  });
});

describe('catálogo de países', () => {
  it('abre la lista con Costa Rica, que es donde está la óptica', () => {
    expect(PAISES[0]).toMatchObject({ iso: 'CR', prefijo: '+506' });
  });

  it('la etiqueta enseña el prefijo antes del nombre, sin bandera', () => {
    expect(etiquetaPais(PAISES[0])).toBe('+506 · Costa Rica');
  });

  it('trae un catálogo amplio y sin códigos ISO repetidos', () => {
    expect(PAISES.length).toBeGreaterThan(180);
    expect(new Set(PAISES.map((p) => p.iso)).size).toBe(PAISES.length);
  });

  it('todos los prefijos empiezan por + y siguen con dígitos', () => {
    expect(PAISES.every((p) => /^\+\d{1,4}$/.test(p.prefijo))).toBe(true);
  });
});
