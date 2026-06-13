import api from './http';
import type {
  Evaluacion,
  Expediente,
  ExpedienteDetalle,
  NuevaEvaluacion,
  Receta,
  VerificacionReceta,
} from '../models/expediente';

export const listarExpedientes = (): Promise<Expediente[]> =>
  api.get<Expediente[]>('/expedientes').then((r) => r.data);

export const expedientePorPaciente = (
  idPaciente: number,
): Promise<ExpedienteDetalle> =>
  api
    .get<ExpedienteDetalle>(`/expedientes/paciente/${idPaciente}`)
    .then((r) => r.data);

export const crearEvaluacion = (input: NuevaEvaluacion): Promise<Evaluacion> =>
  api.post<Evaluacion>('/expedientes/evaluaciones', input).then((r) => r.data);

export const emitirReceta = (idEvaluacion: number): Promise<Receta> =>
  api
    .post<Receta>(`/expedientes/evaluaciones/${idEvaluacion}/receta`)
    .then((r) => r.data);

export const verificarReceta = (hash: string): Promise<VerificacionReceta> =>
  api.get<VerificacionReceta>(`/recetas/verificar/${hash}`).then((r) => r.data);
