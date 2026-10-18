import api from './http';
export interface EstadoAcceso {
  estado: 'sin_correo' | 'sin_cuenta' | 'pendiente' | 'enviada' | 'fallida' | 'vencida' | 'activa' | 'desactivada';
  venceEn?: string;
}
export const activarCuenta = (datos: { token: string; password: string; ocupacion?: string; direccion?: string }) => api.post<{ mensaje: string }>('/auth/activar', datos).then((r) => r.data);
export const estadoAcceso = (id: number) => api.get<EstadoAcceso>(`/personas/${id}/acceso-portal`).then((r) => r.data);
export const reenviarInvitacion = (id: number) => api.post<EstadoAcceso>(`/personas/${id}/invitacion`).then((r) => r.data);
export const guardarCorreoPortal = (id: number, correo: string) => api.patch<EstadoAcceso>(`/personas/${id}/contacto-portal`, { correo }).then((r) => r.data);

const CLAVES = {
  sin_correo: 'activacion.estado.sinCorreo', sin_cuenta: 'activacion.estado.sinCuenta',
  pendiente: 'activacion.estado.pendiente', enviada: 'activacion.estado.enviada',
  fallida: 'activacion.estado.fallida', vencida: 'activacion.estado.vencida',
  activa: 'activacion.estado.activa', desactivada: 'activacion.estado.desactivada',
} as const;
export const claveEstadoAcceso = (estado: EstadoAcceso['estado']) => CLAVES[estado];
