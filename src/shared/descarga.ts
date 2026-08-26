/**
 * Descarga de archivos en el navegador (`DSO-48`).
 *
 * Estaba metido dentro de `csv.ts` y solo servía para CSV. Se sacó aquí porque
 * el reporte de métricas (CU-19, flujo alterno) también descarga un **PDF**, y
 * un PDF que se baja desde un módulo llamado `csv` no se encuentra nunca.
 */

/**
 * Crea un enlace temporal, lo dispara y limpia lo que creó.
 *
 * Se revoca la URL y se quita el `<a>` del documento: si no, cada descarga deja
 * un objeto en memoria y un enlace suelto en el DOM.
 */
export const descargarArchivo = (nombreArchivo: string, blob: Blob): void => {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
};
