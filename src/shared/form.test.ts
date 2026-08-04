import { describe, expect, it } from 'vitest';
import { sinVacios } from './form';

describe('sinVacios', () => {
  it('descarta las claves con cadena vacía', () => {
    expect(sinVacios({ nombre: 'Ana', telefono: '', correo: '' })).toEqual({
      nombre: 'Ana',
    });
  });

  it('conserva los valores presentes, incluido el cero y el false', () => {
    expect(sinVacios({ edad: 0, activo: false, nota: 'x' })).toEqual({
      edad: 0,
      activo: false,
      nota: 'x',
    });
  });

  it('conserva el null, que no es lo mismo que una cadena vacía', () => {
    expect(sinVacios({ telefono: null })).toEqual({ telefono: null });
  });

  it('con todo vacío devuelve un objeto vacío', () => {
    expect(sinVacios({ a: '', b: '' })).toEqual({});
  });

  it('no modifica el objeto original', () => {
    const original = { nombre: 'Ana', telefono: '' };
    sinVacios(original);
    expect(original).toEqual({ nombre: 'Ana', telefono: '' });
  });
});
