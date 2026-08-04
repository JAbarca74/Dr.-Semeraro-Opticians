import api from './http';
import type { Persona, PersonaInput } from '../models/persona';

export const listarPersonas = (): Promise<Persona[]> =>
  api.get<Persona[]>('/personas').then((r) => r.data);

export const crearPersona = (
  input: PersonaInput | Partial<PersonaInput>,
): Promise<Persona> => api.post<Persona>('/personas', input).then((r) => r.data);

export const actualizarPersona = (
  id: number,
  input: Partial<PersonaInput>,
): Promise<Persona> =>
  api.patch<Persona>(`/personas/${id}`, input).then((r) => r.data);
