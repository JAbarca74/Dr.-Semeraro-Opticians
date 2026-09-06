import { describe, expect, it } from 'vitest';
import { es } from './es';
import { en } from './en';
import { it as italiano } from './it';
import { CATALOGOS, IDIOMAS } from '../idioma';

/**
 * ⚠️ **Estas pruebas son el seguro contra el modo habitual de que una
 * aplicación multiidioma se pudra:** alguien añade un texto, traduce el suyo, y
 * meses después un usuario ve español suelto en mitad de una pantalla italiana.
 *
 * El tipo `Catalogo` ya obliga a que las claves estén completas en tiempo de
 * compilación. Esto cubre lo que el tipo no puede ver: cadenas vacías, textos
 * sin traducir copiados del español, y catálogos que se olviden de registrar.
 */

const claves = Object.keys(es).sort();

describe('paridad de catálogos', () => {
  it('los tres tienen exactamente las mismas claves', () => {
    expect(Object.keys(en).sort()).toEqual(claves);
    expect(Object.keys(italiano).sort()).toEqual(claves);
  });

  it('todos los idiomas declarados tienen catálogo registrado', () => {
    for (const idioma of IDIOMAS) {
      expect(CATALOGOS[idioma]).toBeDefined();
      expect(Object.keys(CATALOGOS[idioma]).sort()).toEqual(claves);
    }
  });

  it('ningún texto está vacío', () => {
    // Una cadena vacía compila y pasa el tipado, pero en pantalla es un hueco.
    for (const idioma of IDIOMAS) {
      const vacias = Object.entries(CATALOGOS[idioma])
        .filter(([, texto]) => texto.trim() === '')
        .map(([clave]) => `${idioma}:${clave}`);
      expect(vacias).toEqual([]);
    }
  });

  it('las claves siguen la convención `ambito.elemento`', () => {
    // El ámbito va en minúsculas; los segmentos siguientes admiten camelCase y
    // dígitos, porque los códigos de excepción del TFM (`ex14`, `ex21`) son
    // parte del nombre y esconderlos haría la clave menos legible.
    for (const clave of claves) {
      expect(clave).toMatch(/^[a-z]+(\.[a-zA-Z0-9]+)+$/);
    }
  });
});

describe('calidad de las traducciones', () => {
  /**
   * Un texto idéntico al español suele ser un olvido. Hay excepciones
   * legítimas —«Lab», «Home», «Italiano»— así que se declaran, y así declararlas
   * obliga a mirar cada caso en vez de silenciar la prueba entera.
   */
  const IGUALES_A_PROPOSITO = new Set([
    'idioma.it', // «Italiano» se escribe igual en español e italiano
    'nav.admin.laboratorio', // «Lab» es la abreviatura en los tres
    'nav.publico.inicio', // «Home» ya se usaba en español en el sitio
    'nav.publico.catalogo', // «Catalogo» solo pierde la tilde en italiano
    'nav.publico.especialista',
    'nav.admin.metricas',
    // Nombre propio del negocio y su ubicación: no se traduce en ningún idioma.
    'publico.pie.ubicacion',
    // «Cilindro» se escribe igual en español y en italiano: es el término
    // óptico establecido en ambos, no una traducción olvidada.
    'receta.cilindro',
    // Cognados exactos con el italiano: «Lente», «Filtro», «Marca», «Tipo».
    'catalogo.categoria.lente',
    'catalogo.ficha.filtro',
    'catalogo.marca',
    'catalogo.tipo',
    // «Material» se escribe igual en español e inglés.
    'catalogo.ficha.material',
    // «Periodo» y «Magazzino»→«Inventario»: cognados exactos con el italiano.
    'metricas.periodo',
    'usuarios.persona',
    'persona.tipo',
    'auditoria.sistema',
    'lab.laboratorio',
    'inv.stock',
    'inv.marca',
    'inv.motivo',
    'ventas.total',
    // «Doctor» en inglés y «Agenda del» en italiano coinciden con el español.
    'agenda.doctor',
    'agenda.agendaDel',
    'agenda.titulo',
    'agenda.motivo',
    // Siglas optométricas que coinciden en español e italiano: PIO es
    // «pressione intraoculare» y PPC «punto prossimo di convergenza».
    'exp.campo.pio',
    'exp.campo.pioOd',
    'exp.campo.ppc',
    'exp.campo.control',
    'exp.campo.hallazgos',
    'exp.campo.refraccion',
    // «SKU» es una sigla internacional: igual en los tres.
    'inv.sku',
    'lab.laboratorioObl',
    // «Dr. Semeraro (Doctor)»: nombre propio y un cargo que se escribe igual.
    'login.demo.doctor',
    // Nombres propios y ejemplos técnicos: el correo de muestra y la sede.
    'login.campo.correoEjemplo',
    'login.sede',
  ]);

  it('el inglés no repite el texto español sin querer', () => {
    const sospechosas = claves.filter(
      (c) =>
        !IGUALES_A_PROPOSITO.has(c) &&
        en[c as keyof typeof en] === es[c as keyof typeof es],
    );
    expect(sospechosas).toEqual([]);
  });

  it('el italiano tampoco', () => {
    const sospechosas = claves.filter(
      (c) =>
        !IGUALES_A_PROPOSITO.has(c) &&
        italiano[c as keyof typeof italiano] === es[c as keyof typeof es],
    );
    expect(sospechosas).toEqual([]);
  });
});
