/**
 * Solicitud de cita guiada por WhatsApp (CU-11).
 *
 * ⚠️ **Aquí no hay ningún modelo de datos del servidor, y eso es el punto.**
 * CU-11 dice literalmente: *«El sistema NO realiza modificaciones ni bloqueos en
 * la base de datos de la agenda»*. La solicitud viaja por WhatsApp y la registra
 * Recepción a mano en CU-05. Si algún día este archivo importa un servicio de
 * la API, es señal de que alguien convirtió una redirección en una reserva.
 */

/** Lo que el formulario rápido del paso 2 recoge: nombre y motivo. */
export interface SolicitudCita {
  nombre: string;
  motivo: string;
}

/**
 * Texto preformateado del paso 4.
 *
 * Lleva **nombre y motivo**, que es exactamente lo que el caso de uso manda
 * recopilar, para que Recepción pueda priorizar sin tener que preguntar de cero.
 */
export const construirMensajeCita = (
  solicitud: SolicitudCita,
  nombreOptica = 'la óptica',
): string =>
  `Hola, soy ${solicitud.nombre.trim()} y quisiera solicitar una cita en ` +
  `${nombreOptica}. Motivo de la consulta: ${solicitud.motivo.trim()}`;

/**
 * Saludo del **flujo alterno «Contacto rápido»**: el icono flotante, sin
 * formulario. El CU da el ejemplo casi literal.
 */
export const MENSAJE_CONTACTO_RAPIDO =
  'Hola, deseo información sobre disponibilidad de citas.';
