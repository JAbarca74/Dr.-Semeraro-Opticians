import { LOCALES, type Idioma } from './idioma';

/**
 * Formato regional (`DSO-53`).
 *
 * Hasta ahora había **10 `es-CR` fijos** repartidos por las pantallas. Con tres
 * idiomas eso deja de servir: un inglés espera `Aug 27, 2026` y un italiano
 * `27 ago 2026`, no `27/8/2026`.
 *
 * ⚠️ **La fecha y el número siguen al idioma. La MONEDA NO.** El precio de la
 * óptica es en colones en los tres idiomas: lo que cambia con el idioma es
 * cómo se escribe el número —el separador de miles y el de decimales—, nunca
 * la moneda. Un `$189.50` en la versión inglesa haría creer que ese es el
 * precio, y no lo es (ver `DSO-57`).
 */

/** Fecha corta: 27/8/2026 · Aug 27, 2026 · 27 ago 2026 */
export const fechaCorta = (idioma: Idioma, valor: string | Date): string =>
  new Date(valor).toLocaleDateString(LOCALES[idioma], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

/** Fecha con hora, para bitácoras y auditoría. */
export const fechaHora = (idioma: Idioma, valor: string | Date): string =>
  new Date(valor).toLocaleString(LOCALES[idioma], {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/** Solo la hora, para el calendario de cupos. */
export const hora = (idioma: Idioma, valor: string | Date): string =>
  new Date(valor).toLocaleTimeString(LOCALES[idioma], {
    hour: '2-digit',
    minute: '2-digit',
  });

/** Número con los separadores del idioma. */
export const numero = (
  idioma: Idioma,
  valor: number,
  decimales = 0,
): string =>
  valor.toLocaleString(LOCALES[idioma], {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  });

/**
 * Precio de la óptica. **Siempre en colones**, con los separadores del idioma.
 *
 * `Intl` con `currency: 'CRC'` y locale inglés escribe `CRC 189.50` en vez de
 * `₡189,50`. Se fuerza el símbolo a mano para que el precio se vea igual en
 * los tres idiomas y solo cambie el formato del número.
 *
 * ⚠️ **`useGrouping: 'always'` está puesto por el italiano.** `it-IT` no agrupa
 * los números de cuatro cifras: dejaría una lista de precios con `₡1234,00` al
 * lado de `₡12.345,00`, que se lee como un fallo. Es correcto según la
 * convención italiana para números sueltos, pero **en una columna de importes
 * la coherencia pesa más**. Los conteos (`numero`) sí respetan la convención.
 *
 * El valor `'always'` es de **ES2023**, y por eso `tsconfig.json` suma
 * `ES2023.Intl` a `lib`: el motor ya lo soporta, solo faltaban los tipos. No se
 * cambió el `target`, que sigue en ES2020.
 */
export const colones = (idioma: Idioma, valor: number): string =>
  `₡${valor.toLocaleString(LOCALES[idioma], {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: 'always',
  })}`;
