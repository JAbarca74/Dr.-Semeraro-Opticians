import { describe, expect, it } from 'vitest';
import {
  CATALOGOS,
  IDIOMAS,
  IDIOMA_BASE,
  LOCALES,
  NOMBRE_IDIOMA,
  esIdioma,
  idiomaInicial,
  traducir,
} from './idioma';

describe('esIdioma', () => {
  it('acepta los tres idiomas servidos', () => {
    expect(IDIOMAS.every(esIdioma)).toBe(true);
  });

  it('rechaza cualquier otra cosa', () => {
    for (const valor of ['fr', 'ES', '', null, undefined, 42, {}]) {
      expect(esIdioma(valor)).toBe(false);
    }
  });
});

describe('traducir', () => {
  it('devuelve el texto del idioma pedido', () => {
    expect(traducir('es', 'comun.guardar')).toBe('Guardar');
    expect(traducir('en', 'comun.guardar')).toBe('Save');
    expect(traducir('it', 'comun.guardar')).toBe('Salva');
  });

  it('con el texto vacío cae al español, no deja un hueco', () => {
    // Un `comun.guardar` en pantalla parece la aplicación rota; el español al
    // menos se entiende. Se vacía la entrada de verdad para recorrer la rama.
    const original = CATALOGOS.en['comun.guardar'];
    CATALOGOS.en['comun.guardar'] = '';
    try {
      expect(traducir('en', 'comun.guardar')).toBe('Guardar');
    } finally {
      CATALOGOS.en['comun.guardar'] = original;
    }
  });

  it('si hasta el español falta, devuelve la clave en vez de una cadena vacía', () => {
    // Último recurso: es feo, pero un hueco invisible es peor de diagnosticar.
    const enOriginal = CATALOGOS.en['comun.cerrar'];
    const esOriginal = CATALOGOS.es['comun.cerrar'];
    CATALOGOS.en['comun.cerrar'] = '';
    CATALOGOS.es['comun.cerrar'] = '';
    try {
      expect(traducir('en', 'comun.cerrar')).toBe('comun.cerrar');
    } finally {
      CATALOGOS.en['comun.cerrar'] = enOriginal;
      CATALOGOS.es['comun.cerrar'] = esOriginal;
    }
  });
});

describe('idiomaInicial', () => {
  it('respeta lo que el usuario eligió antes', () => {
    expect(idiomaInicial('it', 'en-US')).toBe('it');
  });

  it('si no hay elección guardada, usa el idioma del navegador', () => {
    expect(idiomaInicial(null, 'en-US')).toBe('en');
    expect(idiomaInicial(null, 'it-IT')).toBe('it');
  });

  it('compara solo la raíz: «en-GB» también es inglés', () => {
    expect(idiomaInicial(null, 'en-GB')).toBe('en');
    expect(idiomaInicial(null, 'it-CH')).toBe('it');
  });

  it('un idioma que no servimos cae al español', () => {
    expect(idiomaInicial(null, 'fr-FR')).toBe(IDIOMA_BASE);
    expect(idiomaInicial(null, undefined)).toBe(IDIOMA_BASE);
  });

  it('un valor guardado corrupto no rompe: cae al español', () => {
    expect(idiomaInicial('klingon', 'fr-FR')).toBe(IDIOMA_BASE);
  });
});

describe('metadatos de idioma', () => {
  it('el español de la óptica es es-CR, no es-ES', () => {
    // Cambia el formato de fecha y el separador de miles.
    expect(LOCALES.es).toBe('es-CR');
  });

  it('cada idioma se nombra en su propio idioma', () => {
    expect(NOMBRE_IDIOMA.en).toBe('English');
    expect(NOMBRE_IDIOMA.it).toBe('Italiano');
  });
});
