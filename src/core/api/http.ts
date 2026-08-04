import axios from 'axios';
import { clearToken, getToken } from '../auth/token';

/** Valor por defecto cuando no hay `VITE_API_URL` (desarrollo local). */
const API_BASE_POR_DEFECTO = 'http://localhost:3000/api';

/** Resuelve la URL base de la API. Aislada para poder probar ambos casos. */
export const resolverApiBase = (url?: string): string =>
  url ?? API_BASE_POR_DEFECTO;

/**
 * URL base de la API. Úsela también para construir enlaces directos (PDF,
 * descargas): antes estaba copiada en cada página que los ofrecía.
 */
export const API_BASE = resolverApiBase(import.meta.env.VITE_API_URL);

/**
 * Instancia de Axios con la URL base de la API y los interceptores de:
 *  - request: adjunta el token JWT (Bearer).
 *  - response: ante un 401 limpia la sesión y redirige al login.
 */
const api = axios.create({ baseURL: API_BASE });

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
