import { Rol } from './rol.model';

export interface Usuario {
  idUsuario: number;
  email: string;
  rol: Rol;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
}
