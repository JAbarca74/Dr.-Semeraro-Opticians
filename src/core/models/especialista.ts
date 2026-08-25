/**
 * Perfil del especialista (CU-13).
 *
 * Espejo de `EspecialistaVitrina` del backend. ⚠️ **No tiene `cedula`, `correo`
 * ni `telefono`, y no es un olvido**: el endpoint público no los devuelve,
 * porque son datos personales de un empleado y CU-13 no los pide. Si algún día
 * aparecen aquí, es que alguien los expuso al otro lado.
 */
export interface EspecialistaVitrina {
  idPerfilEspecialista: number;
  nombre: string;
  titulo: string;
  /** Colegiatura. Puede venir en `null`: ver `06-estado-y-hallazgos.md` §3.9. */
  codigoProfesional: string | null;
  aniosExperiencia: number | null;
  biografia: string | null;
  /** Frase atribuida al doctor. Vacía hasta que él dé una propia (§3.9). */
  filosofia: string | null;
  fotoUrl: string | null;
  especialidades: string[];
}

/**
 * El mensaje de «Agendar o Consultar por WhatsApp» (CU-13 pasos 5–6).
 *
 * El caso de uso da el texto casi literal: *«Hola, me gustaría agendar una cita
 * o consultar sobre mis lentes.»* Se le añade a quién va dirigido, que es lo
 * único que el paso 6 deja al criterio de la implementación y lo que evita que
 * quien atiende tenga que preguntar de qué óptica le escriben.
 *
 * ⚠️ **No pide ni incluye datos del visitante**, igual que el mensaje del
 * catálogo: la conversación la abre la persona desde su propio WhatsApp, que ya
 * lleva su número.
 */
export const construirMensajeEspecialista = (
  especialista: EspecialistaVitrina,
  nombreOptica = 'la óptica',
): string =>
  `Hola, me gustaría agendar una cita o consultar sobre mis lentes con ` +
  `${especialista.nombre} en ${nombreOptica}.`;

/**
 * Cómo se rotula la experiencia. Devuelve `null` cuando no hay dato, para que
 * la ficha **no pinte la línea** en vez de pintar un «0 años» que nadie dijo.
 */
export const experienciaLegible = (anios: number | null): string | null => {
  if (anios === null || anios <= 0) return null;
  return anios === 1 ? '1 año de experiencia' : `${anios} años de experiencia`;
};
