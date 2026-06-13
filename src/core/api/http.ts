import axios from 'axios';
import { clearToken, getToken } from '../auth/token';

/**
 * Instancia de Axios con la URL base de la API y los interceptores de:
 *  - request: adjunta el token JWT (Bearer).
 *  - response: ante un 401 limpia la sesión y redirige al login.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearToken();
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  },
);

export default api;
