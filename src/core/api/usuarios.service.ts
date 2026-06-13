import api from './http';
import type { CreateUsuario, UpdateUsuario, Usuario } from '../models/usuario';

export const listarUsuarios = (): Promise<Usuario[]> =>
  api.get<Usuario[]>('/usuarios').then((r) => r.data);

export const crearUsuario = (input: CreateUsuario): Promise<Usuario> =>
  api.post<Usuario>('/usuarios', input).then((r) => r.data);

export const actualizarUsuario = (
  id: number,
  input: UpdateUsuario,
): Promise<Usuario> =>
  api.patch<Usuario>(`/usuarios/${id}`, input).then((r) => r.data);
