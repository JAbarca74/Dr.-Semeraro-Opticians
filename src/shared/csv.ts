/**
 * Exportación a CSV (CU-08 y CU-19, flujo alterno «Descargar Reporte»).
 * Se genera en el navegador con lo que ya está en pantalla: no se pide una
 * segunda vez a la API lo que el usuario ya tiene delante.
 */
import { descargarArchivo } from './descarga';

/**
 * Caracteres con los que Excel y LibreOffice interpretan la celda como
 * **fórmula** en vez de como texto.
 */
const INICIO_DE_FORMULA = /^[=+\-@\t\r]/;

/**
 * Escapa una celda según RFC 4180: comillas dobles duplicadas y campo citado.
 *
 * ⚠️ **Además antepone un apóstrofo a lo que empiece por `=`, `+`, `-` o `@`.**
 * Sin eso, un producto que alguien registrara como `=1+1` —o algo bastante
 * peor— se **ejecutaría como fórmula** al abrir el archivo en Excel. Las
 * comillas del RFC no protegen de esto: Excel evalúa igual. El apóstrofo no se
 * ve en la hoja, solo obliga a leer la celda como texto.
 */
export const celdaCsv = (valor: unknown): string => {
  if (valor === null || valor === undefined) return '';
  const texto =
    typeof valor === 'object' ? JSON.stringify(valor) : String(valor);
  const seguro = INICIO_DE_FORMULA.test(texto) ? `'${texto}` : texto;
  return `"${seguro.replace(/"/g, '""')}"`;
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
  descargarArchivo(
    nombreArchivo,
    new Blob([BOM + contenido], { type: 'text/csv;charset=utf-8;' }),
  );
};
