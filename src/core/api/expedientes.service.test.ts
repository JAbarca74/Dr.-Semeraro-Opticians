import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  listarExpedientes,
  expedientePorPaciente,
  crearEvaluacion,
  emitirReceta,
  verificarReceta,
} from './expedientes.service';
import type { Expediente, ExpedienteDetalle, Evaluacion, Receta, VerificacionReceta } from '../models/expediente';

vi.mock('./http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import api from './http';

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

const mockExpediente: Expediente = {
  idExpediente: 100,
  idPaciente: 5,
  paciente: { idPersona: 5, cedula: '1-1234-5678', nombre: 'Ana Mora', tipo: 'Paciente' },
};

const mockEvaluacion: Evaluacion = {
  idEvaluacionClinica: 1,
  idExpediente: 100,
  idDoctor: 10,
  diagnosticos: ['Miopía bilateral'],
  notas: 'Control anual.',
  fecha: '2026-06-13T10:00:00Z',
  refracciones: [{ ojo: 'OD', esfera: -2.0, cilindro: -0.5, eje: 180 }],
};

const mockDetalle: ExpedienteDetalle = {
  expediente: mockExpediente,
  evaluaciones: [mockEvaluacion],
};

const mockReceta: Receta = {
  idRecetaCriptografica: 1,
  idEvaluacion: 1,
  hashSha256: 'abc123hash',
  urlArchivo: 'http://localhost:5173/verificar/abc123hash',
  codigoQr: 'data:image/png;base64,MOCKEDQR==',
  firmadoEn: '2026-06-13T10:00:00Z',
};

beforeEach(() => vi.clearAllMocks());

describe('listarExpedientes', () => {
  it('hace GET /expedientes y devuelve la lista', async () => {
    mockApi.get.mockResolvedValue({ data: [mockExpediente] });

    const result = await listarExpedientes();

    expect(mockApi.get).toHaveBeenCalledWith('/expedientes');
    expect(result).toEqual([mockExpediente]);
  });
});

describe('expedientePorPaciente', () => {
  it('hace GET /expedientes/paciente/:id y devuelve el detalle completo', async () => {
    mockApi.get.mockResolvedValue({ data: mockDetalle });

    const result = await expedientePorPaciente(5);

    expect(mockApi.get).toHaveBeenCalledWith('/expedientes/paciente/5');
    expect(result.expediente).toEqual(mockExpediente);
    expect(result.evaluaciones).toHaveLength(1);
  });
});

describe('crearEvaluacion', () => {
  it('hace POST /expedientes/evaluaciones con el input correcto', async () => {
    mockApi.post.mockResolvedValue({ data: mockEvaluacion });

    const input = {
      idPaciente: 5,
      diagnosticos: ['Miopía bilateral'],
      notas: 'Control anual.',
      refracciones: [{ ojo: 'OD' as const, esfera: -2.0, cilindro: -0.5, eje: 180 }],
    };
    const result = await crearEvaluacion(input);

    expect(mockApi.post).toHaveBeenCalledWith('/expedientes/evaluaciones', input);
    expect(result).toEqual(mockEvaluacion);
  });
});

describe('emitirReceta', () => {
  it('hace POST /expedientes/evaluaciones/:id/receta y devuelve la receta', async () => {
    mockApi.post.mockResolvedValue({ data: mockReceta });

    const result = await emitirReceta(1);

    expect(mockApi.post).toHaveBeenCalledWith('/expedientes/evaluaciones/1/receta');
    expect(result.hashSha256).toBe('abc123hash');
  });
});

describe('verificarReceta', () => {
  it('hace GET /recetas/verificar/:hash y devuelve el resultado de verificación', async () => {
    const verificacion: VerificacionReceta = {
      valida: true,
      hash: 'abc123hash',
      firmadoEn: '2026-06-13T10:00:00Z',
      paciente: 'Ana Mora',
      doctor: 'Dr. Semeraro',
    };
    mockApi.get.mockResolvedValue({ data: verificacion });

    const result = await verificarReceta('abc123hash');

    expect(mockApi.get).toHaveBeenCalledWith('/recetas/verificar/abc123hash');
    expect(result.valida).toBe(true);
    expect(result.paciente).toBe('Ana Mora');
  });

  it('devuelve { valida: false } para un hash inexistente', async () => {
    mockApi.get.mockResolvedValue({ data: { valida: false } });

    const result = await verificarReceta('hash_invalido');

    expect(result.valida).toBe(false);
  });
});
