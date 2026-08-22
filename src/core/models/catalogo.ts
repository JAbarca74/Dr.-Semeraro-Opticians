/**
 * Catálogo público (CU-09).
 *
 * Espejo de `ProductoVitrina` del backend. ⚠️ **No tiene `stock` ni nada de
 * costo, y no es un olvido**: el endpoint público no los devuelve, para no
 * publicar cuánto inventario tiene la óptica. Si algún día aparecen aquí, es
 * que alguien los expuso al otro lado.
 */

import type { CategoriaProducto } from './inventario';

export interface ProductoVitrina {
  idProducto: number;
  sku: string;
  nombre: string;
  marca: string;
  categoria: CategoriaProducto;
  precio: number;
  color: string | null;
  material: string | null;
  calibre: number | null;
  indiceRefraccion: number | null;
  filtro: string | null;
  tratamiento: string | null;
  imagenUrl: string | null;
}

/** Parámetros públicos que sirve `GET /configuracion/publicos`. */
export interface ParametrosPublicos {
  'optica.nombre'?: string;
  'optica.whatsapp'?: string;
}

/**
 * El mensaje de «Consultar por WhatsApp» (CU-09 pasos 7–8).
 *
 * El caso de uso pide que abra el enlace **«con el nombre del producto ya
 * incluido en el mensaje»**, y eso es exactamente lo que lleva: qué modelo,
 * de qué marca y su SKU, para que quien atienda sepa de cuál se habla sin
 * tener que adivinar entre dos monturas parecidas.
 *
 * ⚠️ **No pide ni incluye datos del visitante.** La vista es informativa: la
 * conversación la abre la persona desde su propio WhatsApp, que ya lleva su
 * número. Pedirle nombre y teléfono para algo que el canal ya aporta sería
 * recoger datos personales sin necesidad.
 */
export const construirMensajeConsulta = (
  producto: ProductoVitrina,
  nombreOptica = 'su catálogo',
): string =>
  `Hola, me interesa el modelo ${producto.nombre} de ${producto.marca} ` +
  `(${producto.sku}) que vi en ${nombreOptica}. ¿Me brindan más información?`;

/**
 * URL de `wa.me` con el mensaje ya escrito (CU-09 paso 8).
 *
 * `wa.me` no admite espacios ni signos en el número: se deja solo en dígitos,
 * igual que hace el backend con los recordatorios.
 */
export const enlaceWhatsapp = (numero: string, mensaje: string): string =>
  `https://wa.me/${numero.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`;

/**
 * Formato legible del número, para cuando el navegador bloquea la apertura.
 *
 * Es el mismo trato que CU-11 le da a **EX-13** en su propio flujo: si la
 * redirección falla, se muestra el número para contactar a mano.
 */
export const numeroLegible = (numero: string): string => {
  const digitos = numero.replace(/\D/g, '');
  // Los números de Costa Rica son 8 dígitos tras el código de país (506).
  const local = digitos.startsWith('506') ? digitos.slice(3) : digitos;
  return local.length === 8 ? `${local.slice(0, 4)}-${local.slice(4)}` : digitos;
};
