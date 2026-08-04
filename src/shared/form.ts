/**
 * Quita del objeto las claves cuyo valor es una cadena vacía.
 *
 * Sirve para las **altas**: un campo opcional que el usuario dejó en blanco no
 * aporta nada al registro nuevo. En las **ediciones** hay que hacer justo lo
 * contrario y mandar la cadena vacía, porque ahí significa «borra este campo»
 * y omitirla dejaría el valor anterior intacto en la base.
 */
export const sinVacios = <T extends object>(valores: T): Partial<T> => {
  const limpio: Partial<T> = {};
  for (const [clave, valor] of Object.entries(valores) as [
    keyof T,
    T[keyof T],
  ][]) {
    if (valor !== '') {
      limpio[clave] = valor;
    }
  }
  return limpio;
};
