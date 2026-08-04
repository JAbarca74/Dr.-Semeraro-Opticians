/** Quita prefijos técnicos de ruta como "refracciones.0." de los mensajes anidados. */
const limpiar = (m: string): string => m.replace(/^[A-Za-z]+\.\d+\./, '').trim();

/**
 * Mensaje para cuando la petición nunca llegó al servidor (RS-06). Sin esto, un
 * backend caído se confunde con un fallo de datos del usuario: en el login, por
 * ejemplo, se mostraba «Credenciales inválidas» aunque la API estuviera apagada.
 */
const SIN_CONEXION =
  'No se pudo conectar con el servidor. Verifique que la API esté en ejecución e inténtelo de nuevo.';

/** Detecta un fallo de red de Axios: no hay `response` pero sí una `request` emitida. */
const esErrorDeRed = (err: unknown): boolean => {
  const e = err as { response?: unknown; request?: unknown; code?: string };
  if (!e || typeof e !== 'object' || e.response) return false;
  return (
    !!e.request ||
    e.code === 'ERR_NETWORK' ||
    e.code === 'ECONNABORTED' ||
    e.code === 'ERR_CONNECTION_REFUSED'
  );
};

/** Extrae un mensaje legible de un error de Axios / API. */
export const mensajeDeError = (
  err: unknown,
  fallback = 'Ocurrió un error',
): string => {
  if (esErrorDeRed(err)) {
    return SIN_CONEXION;
  }
  const data = (err as { response?: { data?: { message?: unknown } } })?.response
    ?.data;
  let mensaje: unknown = data?.message;
  if (mensaje && typeof mensaje === 'object' && 'message' in mensaje) {
    mensaje = (mensaje as { message: unknown }).message;
  }
  if (Array.isArray(mensaje)) {
    return mensaje.map((m) => limpiar(String(m))).join(' · ');
  }
  if (typeof mensaje === 'string') {
    return limpiar(mensaje);
  }
  return fallback;
};
