import { describe, it, expect, vi } from 'vitest';
import api from './http';
import {
  confirmarClave,
  solicitarRecuperacion,
  estadoInvitacionPersonal,
  invitarPersonal,
} from './acceso-cuenta.service';
vi.mock('./http', () => ({ default: { post: vi.fn(), get: vi.fn() } }));
describe('Enlaces de cuentas', () => {
  it('solicita recuperación sin enviar identidad ni rol', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { mensaje: 'Respuesta neutral' },
    });
    expect(await solicitarRecuperacion('ana@example.test')).toEqual({
      mensaje: 'Respuesta neutral',
    });
    expect(api.post).toHaveBeenCalledWith('/auth/recuperar', {
      correo: 'ana@example.test',
    });
  });
  it.each([true, false])(
    'confirma contraseña con el propósito esperado: personal=%s',
    async (personal) => {
      vi.mocked(api.post).mockResolvedValue({ data: { mensaje: 'Guardada' } });
      expect(await confirmarClave('token', 'clave12345', personal)).toEqual({
        mensaje: 'Guardada',
      });
      expect(api.post).toHaveBeenCalledWith(
        personal ? '/auth/activar-personal' : '/auth/restablecer',
        { token: 'token', password: 'clave12345' },
      );
    },
  );
  it('consulta y reenvía invitaciones del personal', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { estado: 'vencida' } });
    vi.mocked(api.post).mockResolvedValue({ data: { estado: 'enviada' } });
    expect(await estadoInvitacionPersonal(7)).toEqual({ estado: 'vencida' });
    expect(await invitarPersonal(7)).toEqual({ estado: 'enviada' });
    expect(api.get).toHaveBeenCalledWith('/usuarios/7/invitacion');
    expect(api.post).toHaveBeenCalledWith('/usuarios/7/invitacion');
  });
});
