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

/**
 * Lo que se pinta cuando no hay fecha.
 *
 * ⚠️ **Una fecha ausente no es un error.** `fechaEstimadaEntrega` es nula
 * mientras el laboratorio no la confirme, y antes de esto cada pantalla lo
 * resolvía por su cuenta. Sin este guardia, `new Date(null)` da el 1 de enero
 * de 1970 y el paciente lee que sus lentes llegan hace cincuenta años.
 */
const SIN_FECHA = '—';

type Fecha = string | Date | null | undefined;

/**
 * Convierte a `Date` respetando el huso local.
 *
 * ⚠️ **`new Date('2026-09-11')` NO es el 11 de setiembre en Costa Rica.** Una
 * cadena de solo fecha la interpreta el motor como **UTC medianoche**, que en
 * UTC−6 es el día anterior a las 18:00: la fecha estimada de entrega de un
 * pedido se mostraba **un día antes** de la real. Con la hora incluida no pasa,
 * porque entonces se interpreta como local. Por eso se completa la hora cuando
 * la cadena viene sin ella.
 */
const aFecha = (valor: string | Date): Date =>
  typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor)
    ? new Date(`${valor}T00:00:00`)
    : new Date(valor);

/** Fecha corta: 27 ago 2026 · Aug 27, 2026 · 27 ago 2026 */
export const fechaCorta = (idioma: Idioma, valor: Fecha): string =>
  valor
    ? aFecha(valor).toLocaleDateString(LOCALES[idioma], {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : SIN_FECHA;

/** Fecha con hora, para bitácoras y auditoría. */
export const fechaHora = (idioma: Idioma, valor: Fecha): string =>
  valor
    ? aFecha(valor).toLocaleString(LOCALES[idioma], {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : SIN_FECHA;

/** Solo la hora, para el calendario de cupos. */
export const hora = (idioma: Idioma, valor: string | Date): string =>
  aFecha(valor).toLocaleTimeString(LOCALES[idioma], {
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
