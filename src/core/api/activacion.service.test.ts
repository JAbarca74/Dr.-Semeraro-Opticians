import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './http';
import { activarCuenta, estadoAcceso, reenviarInvitacion, guardarCorreoPortal, claveEstadoAcceso, type EstadoAcceso } from './activacion.service';
vi.mock('./http', () => ({ default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
describe('Activación por invitación', () => {
  it('envía la contraseña y el token por POST, sin identidad elegible', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { mensaje: 'Cuenta activada' } });
    expect(await activarCuenta({ token: 'a'.repeat(64), password: 'clave12345' })).toEqual({ mensaje: 'Cuenta activada' });
    expect(api.post).toHaveBeenCalledWith('/auth/activar', { token: 'a'.repeat(64), password: 'clave12345' });
  });
  it('consulta estado y reenvía usando el ID de la ficha', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { estado: 'enviada' } });
    vi.mocked(api.post).mockResolvedValue({ data: { estado: 'enviada' } });
    expect(await estadoAcceso(7)).toEqual({ estado: 'enviada' });
    expect(await reenviarInvitacion(7)).toEqual({ estado: 'enviada' });
    expect(api.get).toHaveBeenCalledWith('/personas/7/acceso-portal');
    expect(api.post).toHaveBeenCalledWith('/personas/7/invitacion');
  });
  it('guarda solo el correo de invitación y propaga errores', async () => {
    vi.mocked(api.patch).mockResolvedValue({ data: { estado: 'enviada' } });
    expect(await guardarCorreoPortal(7, 'ana@example.test')).toEqual({ estado: 'enviada' });
    expect(api.patch).toHaveBeenCalledWith('/personas/7/contacto-portal', { correo: 'ana@example.test' });
    vi.mocked(api.post).mockRejectedValue(new Error('Enlace vencido'));
    await expect(activarCuenta({ token: 'a', password: 'clave12345' })).rejects.toThrow('Enlace vencido');
  });
  it('todos los estados tienen una clave de traducción', () => {
    const estados: EstadoAcceso['estado'][] = ['sin_correo', 'sin_cuenta', 'pendiente', 'enviada', 'fallida', 'vencida', 'activa', 'desactivada'];
    estados.forEach((estado) => expect(claveEstadoAcceso(estado)).toMatch(/^activacion\.estado\.[a-zA-Z]+$/));
  });
});
