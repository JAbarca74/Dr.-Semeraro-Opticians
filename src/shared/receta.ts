/**
 * Normaliza la entrada de verificación de receta: acepta el hash directo
 * o la URL completa del QR (`…/verificar/<hash>`) y devuelve solo el hash.
 */
export const normalizarHash = (valor: string): string => {
  const limpio = valor.trim();
  const m = limpio.match(/verificar\/([a-f0-9]+)/i);
  return m ? m[1] : limpio;
};
