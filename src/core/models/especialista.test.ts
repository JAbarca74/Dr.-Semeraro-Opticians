import { describe, expect, it } from 'vitest';
import {
  construirMensajeEspecialista,
  experienciaLegible,
  type EspecialistaVitrina,
} from './especialista';

const perfil = (
  cambios: Partial<EspecialistaVitrina> = {},
): EspecialistaVitrina => ({
  idPerfilEspecialista: 1,
  nombre: 'Luigi Semeraro Román',
  titulo: 'Optometrista',
  codigoProfesional: '066-120',
  aniosExperiencia: null,
  biografia: null,
  filosofia: null,
  fotoUrl: null,
  especialidades: [],
  ...cambios,
});

describe('construirMensajeEspecialista', () => {
  it('lleva el texto que pide CU-13 paso 6', () => {
    const mensaje = construirMensajeEspecialista(perfil(), 'Óptica Dr. Semeraro');
    expect(mensaje).toContain('me gustaría agendar una cita o consultar sobre mis lentes');
  });

  it('nombra al especialista y a la óptica', () => {
    const mensaje = construirMensajeEspecialista(perfil(), 'Óptica Dr. Semeraro');
    expect(mensaje).toContain('Luigi Semeraro Román');
    expect(mensaje).toContain('Óptica Dr. Semeraro');
  });

  it('sin nombre de óptica usa un genérico, no queda un hueco', () => {
    expect(construirMensajeEspecialista(perfil())).toContain('la óptica');
  });
});

describe('experienciaLegible', () => {
  it('sin dato devuelve null, para que la ficha no pinte la línea', () => {
    expect(experienciaLegible(null)).toBeNull();
  });

  it('cero también es null: nadie dijo que tuviera cero años', () => {
    expect(experienciaLegible(0)).toBeNull();
  });

  it('un valor negativo no se pinta', () => {
    expect(experienciaLegible(-3)).toBeNull();
  });

  it('un año va en singular', () => {
    expect(experienciaLegible(1)).toBe('1 año de experiencia');
  });

  it('varios años van en plural', () => {
    expect(experienciaLegible(12)).toBe('12 años de experiencia');
  });
});
