/**
 * Exportación a CSV (CU-08, flujo alterno «Descargar Reporte»).
 * Se genera en el navegador con lo que ya está en pantalla: no hay endpoint de
 * exportación en la API.
 */

/** Escapa una celda según RFC 4180: comillas dobles duplicadas y campo citado. */
export const celdaCsv = (valor: unknown): string => {
  if (valor === null || valor === undefined) return '';
  const texto =
    typeof valor === 'object' ? JSON.stringify(valor) : String(valor);
  return `"${texto.replace(/"/g, '""')}"`;
};

/** Arma el contenido CSV a partir de los encabezados y las filas. */
export const aCsv = (encabezados: string[], filas: unknown[][]): string =>
  [encabezados, ...filas]
    .map((fila) => fila.map(celdaCsv).join(','))
    .join('\r\n');

/**
 * Dispara la descarga del archivo. El BOM inicial es lo que hace que Excel
 * abra las tildes correctamente en Windows.
 */
export const descargarCsv = (nombreArchivo: string, contenido: string): void => {
  const BOM = String.fromCharCode(0xfeff);
  const blob = new Blob([BOM + contenido], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
};
