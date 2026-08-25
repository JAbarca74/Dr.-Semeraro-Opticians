import { describe, expect, it, vi, beforeEach } from 'vitest';
import { especialistaPorId, listarEspecialistas } from './especialistas.service';
import type { EspecialistaVitrina } from '../models/especialista';

vi.mock('./http', () => ({ default: { get: vi.fn() } }));

import api from './http';

const mockApi = api as unknown as { get: ReturnType<typeof vi.fn> };

const perfil: EspecialistaVitrina = {
  idPerfilEspecialista: 1,
  nombre: 'Luigi Semeraro Román',
  titulo: 'Optometrista',
  codigoProfesional: '066-120',
  aniosExperiencia: null,
  biografia: 'Dirección clínica de la óptica.',
  filosofia: null,
  fotoUrl: '/dr-luigi-semeraro.jpg',
  especialidades: ['Optometría clínica'],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('listarEspecialistas', () => {
  it('pide el perfil público sin parámetros', async () => {
    mockApi.get.mockResolvedValue({ data: [perfil] });

    await expect(listarEspecialistas()).resolves.toEqual([perfil]);
    expect(mockApi.get).toHaveBeenCalledWith('/especialistas');
  });

  it('propaga el error cuando la API falla', async () => {
    mockApi.get.mockRejectedValue(new Error('sin red'));
    await expect(listarEspecialistas()).rejects.toThrow('sin red');
  });
});

describe('especialistaPorId', () => {
  it('pide el detalle por id', async () => {
    mockApi.get.mockResolvedValue({ data: perfil });

    await expect(especialistaPorId(1)).resolves.toEqual(perfil);
    expect(mockApi.get).toHaveBeenCalledWith('/especialistas/1');
  });
});
