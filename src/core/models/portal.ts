/**
 * Portal del paciente (CU-12 y CU-14).
 *
 * Espejo de `EvaluacionPaciente` y `PedidoPaciente` del backend. ⚠️ **La
 * evaluación no tiene `notas` ni las columnas del expediente en papel, y no es
 * un olvido**: el endpoint no las devuelve porque CU-12 manda ocultarlas. Si
 * algún día aparecen aquí, es que alguien las expuso al otro lado.
 */

export interface RefraccionPaciente {
  ojo: string;
  esfera: number;
  cilindro: number;
  eje: number;
  adicion: number | null;
}

export interface EvaluacionPaciente {
  idEvaluacionClinica: number;
  fecha: string;
  doctor: string;
  diagnosticos: string[];
  refracciones: RefraccionPaciente[];
  receta: { hash: string; firmadoEn: string } | null;
}

/**
 * Las cuatro etapas que **CU-14 promete al paciente**.
 *
 * No son los estados internos de CU-07: la traducción la hace el backend
 * (`PortalService.ETAPA_POR_ESTADO`). Aquí solo se pintan, y este arreglo fija
 * el orden de la barra de progreso.
 */
export const ETAPAS_PEDIDO = [
  'Recibido',
  'En fabricación',
  'Listo para retirar',
  'Entregado',
] as const;

export type EtapaPedido = (typeof ETAPAS_PEDIDO)[number] | 'Cancelado';

export interface PedidoPaciente {
  idOrdenLaboratorio: number;
  idVenta: number;
  fechaSolicitud: string;
  laboratorio: string;
  especificaciones: string;
  etapa: EtapaPedido;
  /** Índice 0–3 en `ETAPAS_PEDIDO`; `null` cuando está cancelado (EX-17). */
  indiceEtapa: number | null;
  fechaEstimadaEntrega: string | null;
  retrasado: boolean;
  actualizadoAl: string;
}

/**
 * Mensaje de «Consultar por WhatsApp» del flujo alterno de CU-14.
 *
 * El caso de uso pide que lleve **el número de pedido ya incluido**, para que
 * quien atienda no tenga que preguntarlo.
 */
export const construirMensajePedido = (
  pedido: PedidoPaciente,
  nombreOptica = 'la óptica',
): string =>
  `Hola, quisiera consultar por mi pedido n.º ${pedido.idOrdenLaboratorio} ` +
  `en ${nombreOptica}. Aparece como «${pedido.etapa}».`;

/** Fecha y hora larga en español, para el sello de EX-16. */
export const fechaHoraLarga = (iso: string): string =>
  new Date(iso).toLocaleString('es-CR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/** Fecha `YYYY-MM-DD` legible; `—` cuando no hay. */
export const fechaCorta = (iso: string | null): string => {
  if (!iso) return '—';
  const [anio, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
};

/** Formato de una refracción, tal como se lee en la receta impresa. */
export const refraccionLegible = (r: RefraccionPaciente): string => {
  const partes = [
    `Esf ${Number(r.esfera).toFixed(2)}`,
    `Cil ${Number(r.cilindro).toFixed(2)}`,
    `Eje ${r.eje}°`,
  ];
  if (r.adicion !== null) partes.push(`Add ${Number(r.adicion).toFixed(2)}`);
  return partes.join(' · ');
};
