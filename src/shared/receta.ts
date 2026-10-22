/**
 * Normaliza la entrada de verificación de receta: acepta el hash directo
 * o la URL completa del QR (`…/verificar/<hash>`) y devuelve solo el hash.
 */
export const normalizarHash = (valor: string): string => {
  const limpio = valor.trim();
  const m = limpio.match(/verificar\/([a-f0-9]+)/i);
  return m ? m[1] : limpio;
};

/**
 * Enlace de descarga del PDF de una receta. El hash lo escribe la persona, así
 * que se codifica: una entrada como `../usuarios` no puede salirse de
 * `/recetas/` ni inyectar otra URL en el `href`.
 */
export const urlPdfReceta = (apiBase: string, hash: string): string =>
  `${apiBase}/recetas/${encodeURIComponent(hash)}/pdf`;
