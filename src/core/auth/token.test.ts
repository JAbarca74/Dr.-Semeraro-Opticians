import { describe, expect, it } from 'vitest';
import { decodeToken, getUserFromToken } from './token';
import { Rol } from '../models/rol';

/** Construye un JWT de prueba (firma irrelevante: jwtDecode no la valida). */
const makeToken = (payload: Record<string, unknown>): string => {
  const encode = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.firma`;
};

describe('utilidades de token', () => {
  it('deriva el usuario de un token válido y vigente', () => {
    const token = makeToken({
      sub: 7,
      email: 'doc@optica.local',
      rol: Rol.DOCTOR,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    expect(getUserFromToken(token)).toEqual({
      idUsuario: 7,
      email: 'doc@optica.local',
      rol: Rol.DOCTOR,
    });
  });

  it('considera inválido un token expirado', () => {
    const token = makeToken({
      sub: 1,
      email: 'admin@optica.local',
      rol: Rol.ADMINISTRADOR,
      exp: Math.floor(Date.now() / 1000) - 10,
    });

    expect(getUserFromToken(token)).toBeNull();
  });

  it('devuelve null ante un token malformado', () => {
    expect(decodeToken('no-es-un-jwt')).toBeNull();
    expect(getUserFromToken('basura')).toBeNull();
  });
});
