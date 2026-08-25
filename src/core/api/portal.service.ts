import api from './http';
import type { EvaluacionPaciente, PedidoPaciente } from '../models/portal';

/**
 * Portal del paciente (CU-12 y CU-14).
 *
 * ⚠️ **Ninguna de estas funciones recibe un identificador de paciente.** El
 * backend lo saca del JWT: si la URL admitiera un `idPaciente`, cualquiera con
 * sesión leería el expediente de otro. Si alguna vez hace falta pasarlo, es
 * señal de que el endpoint está mal.
 */
export const misExpedientes = (): Promise<EvaluacionPaciente[]> =>
  api.get<EvaluacionPaciente[]>('/portal/expedientes').then((r) => r.data);

export const misPedidos = (): Promise<PedidoPaciente[]> =>
  api.get<PedidoPaciente[]>('/portal/pedidos').then((r) => r.data);
