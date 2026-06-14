import { describe, expect, it } from 'vitest';
import { Rol, homePathForRole, rolLabel } from './rol';

describe('homePathForRole', () => {
  it('envía a Recepción al rol Recepcion', () => {
    expect(homePathForRole(Rol.RECEPCION)).toBe('/recepcion');
  });

  it('envía a /admin al Administrador y al Doctor', () => {
    expect(homePathForRole(Rol.ADMINISTRADOR)).toBe('/admin');
    expect(homePathForRole(Rol.DOCTOR)).toBe('/admin');
  });

  it('usa /admin por defecto cuando no hay rol', () => {
    expect(homePathForRole(null)).toBe('/admin');
    expect(homePathForRole(undefined)).toBe('/admin');
  });
});

describe('rolLabel', () => {
  it('muestra "Recepción" con tilde para el rol Recepcion', () => {
    expect(rolLabel(Rol.RECEPCION)).toBe('Recepción');
  });

  it('devuelve el valor del enum para los demás roles', () => {
    expect(rolLabel(Rol.ADMINISTRADOR)).toBe('Administrador');
    expect(rolLabel(Rol.DOCTOR)).toBe('Doctor');
    expect(rolLabel(Rol.PACIENTE)).toBe('Paciente');
  });

  it('devuelve cadena vacía cuando no hay rol', () => {
    expect(rolLabel(null)).toBe('');
    expect(rolLabel(undefined)).toBe('');
  });
});
