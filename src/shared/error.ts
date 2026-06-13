/** Extrae un mensaje legible de un error de Axios / API. */
export const mensajeDeError = (
  err: unknown,
  fallback = 'Ocurrió un error',
): string => {
  const data = (err as { response?: { data?: { message?: unknown } } })?.response
    ?.data;
  let mensaje: unknown = data?.message;
  if (mensaje && typeof mensaje === 'object' && 'message' in mensaje) {
    mensaje = (mensaje as { message: unknown }).message;
  }
  if (Array.isArray(mensaje)) {
    return mensaje.join(', ');
  }
  if (typeof mensaje === 'string') {
    return mensaje;
  }
  return fallback;
};
