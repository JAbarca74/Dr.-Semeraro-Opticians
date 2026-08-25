import api from '../api/http';
import type {
  CuentaCreada,
  LoginRequest,
  LoginResponse,
  RegistroPaciente,
} from '../models/usuario';

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

/** Alta de cuenta de paciente por autoservicio (CU-10). **No requiere sesión**. */
export const registrarPacienteRequest = async (
  datos: RegistroPaciente,
): Promise<CuentaCreada> => {
  const { data } = await api.post<CuentaCreada>('/auth/registro', datos);
  return data;
};

export const cambiarPasswordRequest = async (
  actual: string,
  nueva: string,
): Promise<void> => {
  await api.patch('/auth/password', { actual, nueva });
};
