import { describe, expect, it } from 'vitest';
import { normalizarHash } from './receta';

describe('normalizarHash', () => {
  const hash = '2a1f51b9076428ab2d5a5bfe01c5b641af9dcb95d77807bc988c2950f8ecdb16';

  it('devuelve el hash tal cual cuando se ingresa directo', () => {
    expect(normalizarHash(hash)).toBe(hash);
  });

  it('recorta espacios alrededor del hash', () => {
    expect(normalizarHash(`  ${hash}  `)).toBe(hash);
  });

  it('extrae el hash de una URL de verificación completa', () => {
    expect(normalizarHash(`https://optica.local/verificar/${hash}`)).toBe(hash);
  });

  it('extrae el hash de una ruta relativa /verificar/', () => {
    expect(normalizarHash(`/verificar/${hash}`)).toBe(hash);
  });

  it('es insensible a mayúsculas en el segmento "verificar"', () => {
    expect(normalizarHash(`/VERIFICAR/${hash}`)).toBe(hash);
  });

  it('devuelve cadena vacía para entrada vacía', () => {
    expect(normalizarHash('   ')).toBe('');
  });

  it('devuelve el texto recortado cuando no coincide el patrón de URL', () => {
    expect(normalizarHash('  texto-no-url  ')).toBe('texto-no-url');
  });
});
