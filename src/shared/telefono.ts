import { PAISES, PAIS_POR_DEFECTO } from './paises';

/**
 * Los teléfonos se guardan en un solo campo, en formato
 * **`+<prefijo> <número>`** (por ejemplo `+506 72221959`). No se partió la
 * columna en dos porque `persona.telefono` ya existe en la base y una
 * migración solo para separar el prefijo no se paga: recomponerlo es trivial
 * y el formato sigue siendo legible para una persona.
 */

export interface TelefonoPartido {
  prefijo: string;
  numero: string;
}

/**
 * Prefijos ordenados de más largo a más corto. El orden **importa**: `+1809`
 * (República Dominicana) empieza por `+1` (Estados Unidos), así que buscar el
 * corto primero clasificaría mal media docena de países del Caribe.
 */
const PREFIJOS_POR_LONGITUD = [...new Set(PAISES.map((p) => p.prefijo))].sort(
  (a, b) => b.length - a.length,
);

/** Deja solo los dígitos: lo que `wa.me` admite en la URL. */
export const soloDigitos = (valor: string): string => valor.replace(/\D/g, '');

/**
 * Separa un teléfono guardado en prefijo y número.
 *
 * Si el valor no empieza por `+` se asume que es un número local heredado —los
 * que ya estaban en la base antes de que el formulario pidiera el país— y se le
 * atribuye el prefijo por defecto sin tocar los dígitos.
 */
export const partirTelefono = (valor?: string | null): TelefonoPartido => {
  const limpio = (valor ?? '').trim();
  if (!limpio) {
    return { prefijo: PAIS_POR_DEFECTO, numero: '' };
  }
  if (!limpio.startsWith('+')) {
    return { prefijo: PAIS_POR_DEFECTO, numero: limpio };
  }
  const prefijo = PREFIJOS_POR_LONGITUD.find((p) => limpio.startsWith(p));
  if (!prefijo) {
    return { prefijo: PAIS_POR_DEFECTO, numero: limpio };
  }
  return { prefijo, numero: limpio.slice(prefijo.length).trim() };
};

/**
 * Vuelve a unir prefijo y número. Un número vacío devuelve cadena vacía: un
 * teléfono que es solo «+506» no es un teléfono, y guardarlo dejaría basura en
 * la base y un enlace de WhatsApp roto.
 */
export const unirTelefono = (prefijo: string, numero: string): string => {
  const digitos = numero.trim();
  return digitos ? `${prefijo} ${digitos}` : '';
};

/**
 * Formato internacional listo para `wa.me`: solo dígitos, con el código de
 * país por delante. Es lo que convierte un «7222-1959» en algo que WhatsApp
 * acepta.
 */
export const aFormatoInternacional = (valor?: string | null): string => {
  const { prefijo, numero } = partirTelefono(valor);
  return soloDigitos(prefijo) + soloDigitos(numero);
};
