import api from './http';
export const solicitarRecuperacion = (correo: string) =>
  api
    .post<{ mensaje: string }>('/auth/recuperar', { correo })
    .then((r) => r.data);
export const confirmarClave = (
  token: string,
  password: string,
  personal: boolean,
) =>
  api
    .post<{
      mensaje: string;
    }>(personal ? '/auth/activar-personal' : '/auth/restablecer', { token, password })
    .then((r) => r.data);
export const estadoInvitacionPersonal = (id: number) =>
  api
    .get<{ estado: string; venceEn?: string }>(`/usuarios/${id}/invitacion`)
    .then((r) => r.data);
export const invitarPersonal = (id: number) =>
  api
    .post<{ estado: string }>(`/usuarios/${id}/invitacion`)
    .then((r) => r.data);
