/**
 * Moneda del negocio (`DSO-57`).
 *
 * **Decisión del PO del 2026-08-27: el precio de la óptica es en colones, en
 * los tres idiomas.** El dólar es una referencia, no un precio.
 */

export type TipoCambio =
  | { disponible: true; valor: number; fecha: string; fuente: string }
  | { disponible: false };

/**
 * Equivalente aproximado en dólares, o `null` si no hay con qué calcularlo.
 *
 * ⚠️ **Devuelve `null` en vez de cero, y eso es la regla entera.** Un `$0.00`
 * junto a un aro de ₡189,50 no es un dato incompleto: es un dato **falso**, y
 * el visitante no tiene forma de saber que lo es. Sin tasa no se enseña nada.
 */
export const aproximadoUsd = (
  colones: number,
  cambio: TipoCambio,
): number | null => {
  if (!cambio.disponible) return null;
  // Una tasa de cero o negativa no puede venir del servicio —lo valida—, pero
  // este módulo no depende de esa promesa: dividir entre cero da Infinity.
  if (!Number.isFinite(cambio.valor) || cambio.valor <= 0) return null;
  if (!Number.isFinite(colones)) return null;
  return Math.round((colones / cambio.valor) * 100) / 100;
};
