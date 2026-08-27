import { es, type Catalogo, type ClaveTexto } from './catalogos/es';
import { en } from './catalogos/en';
import { it } from './catalogos/it';

/** Los idiomas que la aplicación sirve hoy. Añadir uno es añadirlo aquí y su catálogo. */
export const IDIOMAS = ['es', 'en', 'it'] as const;
export type Idioma = (typeof IDIOMAS)[number];

/** El idioma del negocio. También es el respaldo cuando algo falta. */
export const IDIOMA_BASE: Idioma = 'es';

export const CATALOGOS: Record<Idioma, Catalogo> = { es, en, it };

/**
 * Locale para `Intl`. **No es lo mismo que el idioma**: el español de la óptica
 * es `es-CR`, no `es-ES` —cambia el formato de fecha y el separador de miles—.
 */
export const LOCALES: Record<Idioma, string> = {
  es: 'es-CR',
  en: 'en-US',
  it: 'it-IT',
};

/** Nombre de cada idioma en su propio idioma, que es como se rotulan los selectores. */
export const NOMBRE_IDIOMA: Record<Idioma, string> = {
  es: 'Español',
  en: 'English',
  it: 'Italiano',
};

export const esIdioma = (valor: unknown): valor is Idioma =>
  typeof valor === 'string' && (IDIOMAS as readonly string[]).includes(valor);

/**
 * Traduce una clave.
 *
 * ⚠️ **Cae al español antes que enseñar la clave.** Un `admin.ventas.titulo`
 * en pantalla es peor que un texto en el idioma equivocado: lo segundo se
 * entiende, lo primero parece la aplicación rota. El tipado hace que esto casi
 * no pueda pasar, pero `casi` no es `nunca`: los catálogos podrían traer una
 * cadena vacía.
 */
export const traducir = (idioma: Idioma, clave: ClaveTexto): string =>
  CATALOGOS[idioma][clave] || CATALOGOS[IDIOMA_BASE][clave] || clave;

/**
 * Idioma inicial: lo que el usuario eligió antes; si no, lo que pide su
 * navegador; si no, español.
 *
 * `navigator.language` viene como `en-GB` o `it-CH`, así que se compara solo la
 * primera parte: a alguien con el navegador en inglés británico le sirve el
 * inglés que tenemos.
 */
export const idiomaInicial = (
  guardado: string | null,
  idiomaNavegador?: string,
): Idioma => {
  if (esIdioma(guardado)) return guardado;
  const raiz = (idiomaNavegador ?? '').split('-')[0];
  return esIdioma(raiz) ? raiz : IDIOMA_BASE;
};
