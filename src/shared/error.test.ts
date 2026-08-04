import { describe, expect, it } from 'vitest';
import { mensajeDeError } from './error';

describe('mensajeDeError', () => {
  it('devuelve el mensaje string directo del error de API', () => {
    const err = { response: { data: { message: 'El correo ya está registrado' } } };
    expect(mensajeDeError(err)).toBe('El correo ya está registrado');
  });

  it('une un array de mensajes con " · "', () => {
    const err = { response: { data: { message: ['campo1 inválido', 'campo2 requerido'] } } };
    expect(mensajeDeError(err)).toBe('campo1 inválido · campo2 requerido');
  });

  it('elimina el prefijo de ruta anidada (e.g. refracciones.0.)', () => {
    const err = {
      response: {
        data: {
          message: [
            'refracciones.0.esfera no puede ser menor que -25.',
            'refracciones.1.eje debe ser un número entero.',
          ],
        },
      },
    };
    expect(mensajeDeError(err)).toBe(
      'esfera no puede ser menor que -25. · eje debe ser un número entero.',
    );
  });

  it('desempaqueta mensaje anidado en objeto { message }', () => {
    const err = {
      response: { data: { message: { message: 'Error interno del servidor' } } },
    };
    expect(mensajeDeError(err)).toBe('Error interno del servidor');
  });

  it('devuelve el fallback cuando no hay respuesta', () => {
    expect(mensajeDeError(new Error('network error'))).toBe('Ocurrió un error');
  });

  it('devuelve el fallback personalizado cuando no hay respuesta', () => {
    expect(mensajeDeError({}, 'Error de conexión')).toBe('Error de conexión');
  });

  it('devuelve el fallback cuando el mensaje es null', () => {
    const err = { response: { data: { message: null } } };
    expect(mensajeDeError(err)).toBe('Ocurrió un error');
  });

  it('devuelve el fallback cuando data está vacío', () => {
    const err = { response: { data: {} } };
    expect(mensajeDeError(err)).toBe('Ocurrió un error');
  });

  it('no elimina el prefijo si el mensaje no empieza con ruta anidada', () => {
    const err = { response: { data: { message: 'Credenciales invalidas' } } };
    expect(mensajeDeError(err)).toBe('Credenciales invalidas');
  });

  describe('errores de red (RS-06)', () => {
    const SIN_CONEXION =
      'No se pudo conectar con el servidor. Verifique que la API esté en ejecución e inténtelo de nuevo.';

    it('avisa de la falta de conexión cuando la petición salió pero no hubo respuesta', () => {
      const err = { request: {}, message: 'Network Error' };
      expect(mensajeDeError(err, 'Credenciales inválidas')).toBe(SIN_CONEXION);
    });

    it('reconoce el código ERR_NETWORK de Axios', () => {
      expect(mensajeDeError({ code: 'ERR_NETWORK' })).toBe(SIN_CONEXION);
    });

    it('reconoce un tiempo de espera agotado (ECONNABORTED)', () => {
      expect(mensajeDeError({ code: 'ECONNABORTED' })).toBe(SIN_CONEXION);
    });

    it('reconoce la conexión rechazada (ERR_CONNECTION_REFUSED)', () => {
      expect(mensajeDeError({ code: 'ERR_CONNECTION_REFUSED' })).toBe(
        SIN_CONEXION,
      );
    });

    it('prioriza el mensaje del servidor sobre el aviso de red si hubo respuesta', () => {
      const err = {
        request: {},
        response: { data: { message: 'Credenciales invalidas' } },
      };
      expect(mensajeDeError(err)).toBe('Credenciales invalidas');
    });

    it('no confunde un error corriente sin request con un fallo de red', () => {
      expect(mensajeDeError(new Error('algo falló'), 'Error de datos')).toBe(
        'Error de datos',
      );
    });

    it('tolera valores nulos', () => {
      expect(mensajeDeError(null, 'Sin detalle')).toBe('Sin detalle');
    });
  });
});
