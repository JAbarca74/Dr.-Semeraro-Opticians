/**
 * Órdenes de laboratorio (CU-07).
 *
 * Espejo del contrato publicado en
 * `optica-semeraro-api/docs/contratos-sprint8.md` §3. Si el backend cambia,
 * este archivo cambia con él.
 */

export const EstadoOrden = {
  ENVIADO: 'Enviado',
  EN_PROCESO: 'En_proceso',
  RECIBIDO: 'Recibido',
  LISTO: 'Listo',
  RETRASADO: 'Retrasado',
  CANCELADO: 'Cancelado',
} as const;

export type EstadoOrden = (typeof EstadoOrden)[keyof typeof EstadoOrden];

export interface OrdenLaboratorio {
  idOrdenLaboratorio: number;
  idVenta: number;
  laboratorioNombre: string;
  laboratorioContacto: string | null;
  laboratorioTelefono: string | null;
  estado: EstadoOrden;
  /** Solo con valor mientras `estado === 'Retrasado'`. */
  estadoPrevio: EstadoOrden | null;
  especificaciones: string;
  fechaEstimadaEntrega: string | null;
  retrasadaDesde: string | null;
  createdAt: string;
}

export interface OrdenInput {
  idVenta: number;
  laboratorioNombre: string;
  especificaciones: string;
  laboratorioContacto?: string;
  laboratorioTelefono?: string;
  fechaEstimadaEntrega?: string;
}

export interface HistorialOrden {
  idHistorialOrden: number;
  idOrden: number;
  idUsuario: number;
  estadoAnterior: EstadoOrden;
  estadoNuevo: EstadoOrden;
  comentario: string | null;
  changedAt: string;
}

/**
 * Cómo nombra CU-07 cada estado. El enum viaja con guion bajo porque es un
 * valor de base de datos; en pantalla nunca debe verse `En_proceso`.
 */
const ETIQUETAS: Record<EstadoOrden, string> = {
  [EstadoOrden.ENVIADO]: 'Enviado a lab',
  [EstadoOrden.EN_PROCESO]: 'En proceso',
  [EstadoOrden.RECIBIDO]: 'Recibido en clínica',
  [EstadoOrden.LISTO]: 'Listo para entrega',
  [EstadoOrden.RETRASADO]: 'Retrasado',
  [EstadoOrden.CANCELADO]: 'Cancelado',
};

export const etiquetaEstado = (estado: EstadoOrden): string =>
  ETIQUETAS[estado] ?? estado;

/**
 * Transiciones del camino normal. **Copia deliberada de la máquina de estados
 * del backend** (`LaboratorioService.TRANSICIONES`).
 *
 * No sustituye a la validación del servidor: la duplica para que el desplegable
 * ofrezca solo destinos válidos. Si el usuario nunca puede elegir un salto
 * inválido, el 400 de EX-09 queda como red de seguridad y no como la forma
 * normal de enterarse de que algo no se podía hacer.
 */
const TRANSICIONES: Record<EstadoOrden, EstadoOrden[]> = {
  [EstadoOrden.ENVIADO]: [
    EstadoOrden.EN_PROCESO,
    EstadoOrden.RETRASADO,
    EstadoOrden.CANCELADO,
  ],
  [EstadoOrden.EN_PROCESO]: [
    EstadoOrden.RECIBIDO,
    EstadoOrden.RETRASADO,
    EstadoOrden.CANCELADO,
  ],
  [EstadoOrden.RECIBIDO]: [
    EstadoOrden.LISTO,
    EstadoOrden.RETRASADO,
    EstadoOrden.CANCELADO,
  ],
  [EstadoOrden.LISTO]: [],
  [EstadoOrden.CANCELADO]: [],
  [EstadoOrden.RETRASADO]: [],
};

/** Estados que cierran la orden y la sacan del tablero de pendientes. */
export const ESTADOS_CERRADOS: EstadoOrden[] = [
  EstadoOrden.LISTO,
  EstadoOrden.CANCELADO,
];

/**
 * A dónde puede moverse una orden desde donde está.
 *
 * `Retrasado` es una **pausa**, no un paso del camino: se reanuda hacia lo que
 * admitía el estado en que se retrasó —incluido ese mismo estado, que es
 * «reanudar sin avanzar»— y nunca hacia `Retrasado` otra vez.
 */
export const destinosPermitidos = (orden: OrdenLaboratorio): EstadoOrden[] => {
  if (orden.estado !== EstadoOrden.RETRASADO) {
    return TRANSICIONES[orden.estado];
  }
  const base = orden.estadoPrevio ?? EstadoOrden.ENVIADO;
  return [base, ...TRANSICIONES[base]].filter((e) => e !== EstadoOrden.RETRASADO);
};

/** Una orden cerrada ya no admite cambios: el tablero no debe ofrecerlos. */
export const esTerminal = (orden: OrdenLaboratorio): boolean =>
  destinosPermitidos(orden).length === 0;

/** Fecha `YYYY-MM-DD` legible en español; `—` si no hay. */
export const fechaCorta = (iso: string | null): string => {
  if (!iso) return '—';
  const [anio, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
};

/** Fecha y hora de un `timestamptz`, para el historial. */
export const fechaHoraLarga = (iso: string): string =>
  new Date(iso).toLocaleString('es-CR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/**
 * Días que lleva detenida una orden retrasada. Es lo que el tablero usa para
 * avisar de cuánto lleva parado el laboratorio.
 */
export const diasRetrasada = (
  orden: OrdenLaboratorio,
  ahora: Date = new Date(),
): number => {
  if (!orden.retrasadaDesde) return 0;
  const transcurrido = ahora.getTime() - new Date(orden.retrasadaDesde).getTime();
  return Math.max(0, Math.floor(transcurrido / 86_400_000));
};
