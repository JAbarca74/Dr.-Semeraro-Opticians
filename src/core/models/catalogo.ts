/**
 * Catálogo público (CU-09) y solicitud por WhatsApp (patrón de CU-11).
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

/** Una línea del carrito del visitante. */
export interface LineaApartado {
  idProducto: number;
  sku: string;
  nombre: string;
  marca: string;
  precio: number;
  cantidad: number;
}

/** Quién escribe. CU-11 paso 2 pide identificarse antes de redirigir. */
export interface DatosSolicitante {
  nombre: string;
  telefono: string;
}

/** Parámetros públicos que sirve `GET /configuracion/publicos`. */
export interface ParametrosPublicos {
  'optica.nombre'?: string;
  'optica.whatsapp'?: string;
}

export const totalApartado = (lineas: LineaApartado[]): number => {
  const suma = lineas.reduce((t, l) => t + l.cantidad * l.precio, 0);
  return Math.round(suma * 100) / 100;
};

/** Añade al carrito sumando la cantidad si el producto ya estaba. */
export const agregarAlApartado = (
  lineas: LineaApartado[],
  nueva: LineaApartado,
): LineaApartado[] => {
  const existente = lineas.find((l) => l.idProducto === nueva.idProducto);
  if (!existente) {
    return [...lineas, nueva];
  }
  return lineas.map((l) =>
    l.idProducto === nueva.idProducto
      ? { ...l, cantidad: l.cantidad + nueva.cantidad }
      : l,
  );
};

const colonesTexto = (monto: number): string =>
  new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency: 'CRC',
    minimumFractionDigits: 2,
  }).format(monto);

/**
 * El mensaje que recibe Recepción.
 *
 * Se redacta aquí, en una función pura, y no dentro del componente, porque es
 * **lo único que la óptica llega a ver** de todo este flujo: si sale incompleto,
 * quien atiende no sabe qué apartar ni a quién llamar. Lleva, en este orden,
 * quién escribe y cómo contactarlo, qué quiere con cantidades y precios, y el
 * total de referencia.
 */
export const construirMensajeApartado = (
  lineas: LineaApartado[],
  solicitante: DatosSolicitante,
  nombreOptica = 'la óptica',
): string => {
  const detalle = lineas
    .map(
      (l) =>
        `• ${l.cantidad} × ${l.nombre} (${l.marca}) — ${l.sku} — ${colonesTexto(l.precio)} c/u`,
    )
    .join('\n');

  return [
    `Hola, soy ${solicitante.nombre.trim()} (tel. ${solicitante.telefono.trim()}).`,
    `Me interesa apartar lo siguiente en ${nombreOptica}:`,
    '',
    detalle,
    '',
    `Total de referencia: ${colonesTexto(totalApartado(lineas))}`,
    '¿Me confirman disponibilidad y el paso siguiente? Gracias.',
  ].join('\n');
};

/**
 * URL de `wa.me` con el mensaje ya escrito (CU-09 paso 8, CU-11 paso 5).
 *
 * `wa.me` no admite espacios ni signos en el número: se deja solo en dígitos,
 * igual que hace el backend con los recordatorios.
 */
export const enlaceWhatsapp = (numero: string, mensaje: string): string =>
  `https://wa.me/${numero.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`;

/** Formato legible del número, para EX-13 cuando el navegador bloquea la apertura. */
export const numeroLegible = (numero: string): string => {
  const digitos = numero.replace(/\D/g, '');
  // Los números de Costa Rica son 8 dígitos tras el código de país (506).
  const local = digitos.startsWith('506') ? digitos.slice(3) : digitos;
  return local.length === 8 ? `${local.slice(0, 4)}-${local.slice(4)}` : digitos;
};
