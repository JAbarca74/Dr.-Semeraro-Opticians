import api from '../api/http';
import type { LoginRequest, LoginResponse } from '../models/usuario';

export const loginRequest = async (
  credenciales: LoginRequest,
): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>('/auth/login', credenciales);
  return data;
};

/** Revoca el token en el servidor (best-effort). */
export const logoutRequest = async (): Promise<void> => {
  try {
    await api.post('/auth/logout');
  } catch {
    // Ignorar: el cierre de sesión local se realiza igualmente.
  }
};

export const cambiarPasswordRequest = async (
  actual: string,
  nueva: string,
): Promise<void> => {
  await api.patch('/auth/password', { actual, nueva });
};
