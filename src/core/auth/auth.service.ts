import api from '../api/http';
import type { LoginRequest, LoginResponse } from '../models/usuario';

export const loginRequest = async (
  credenciales: LoginRequest,
): Promise<LoginResponse> => {
  const { data } = await api.post<LoginResponse>('/auth/login', credenciales);
  return data;
};
