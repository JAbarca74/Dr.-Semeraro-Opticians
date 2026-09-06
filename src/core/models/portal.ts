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

/**
 * Clave de traducción de cada etapa, **por posición** (`DSO-54`).
 *
 * ⚠️ El nombre de la etapa lo manda la API en español, así que no se puede
 * traducir el texto que llega: se traduce **la posición**, que es lo que el
 * backend sí garantiza (`indiceEtapa`). Un pedido cancelado no tiene posición
 * —es `null` por EX-17— y se rotula aparte.
 */
export const CLAVE_ETAPA = [
  'pedidos.etapa.recibido',
  'pedidos.etapa.fabricacion',
  'pedidos.etapa.listo',
  'pedidos.etapa.entregado',
] as const;

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
