import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  actualizarDisponibilidad,
  cambiarEstadoCita,
  crearCita,
  crearDisponibilidad,
  cuposDe,
  desactivarDisponibilidad,
  historialDeCita,
  listarCitas,
  listarDisponibilidad,
  reprogramarCita,
} from './agenda.service';
import { EstadoCita, type Cita, type Cupo, type DisponibilidadMedica } from '../models/agenda';

vi.mock('./http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from './http';

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const bloque: DisponibilidadMedica = {
  idDisponibilidadMedica: 1,
  idEmpleado: 7,
  diaSemana: 1,
  horaInicio: '08:00:00',
  horaFin: '10:00:00',
  duracionMin: 30,
  activo: true,
};

const cita: Cita = {
  idCita: 10,
  idPaciente: 5,
  idDisponibilidad: 1,
  fechaHora: '2026-08-24T09:00:00',
  estado: EstadoCita.CONFIRMADA,
  telefono: '8710-1122',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('agenda.service — disponibilidad', () => {
  it('lista todos los bloques sin filtro', async () => {
    mockApi.get.mockResolvedValue({ data: [bloque] });
    await expect(listarDisponibilidad()).resolves.toEqual([bloque]);
    expect(mockApi.get).toHaveBeenCalledWith('/disponibilidad', { params: undefined });
  });

  it('filtra por empleado cuando se indica', async () => {
    mockApi.get.mockResolvedValue({ data: [] });
    await listarDisponibilidad(7);
    expect(mockApi.get).toHaveBeenCalledWith('/disponibilidad', {
      params: { idEmpleado: 7 },
    });
  });

  it('crea un bloque', async () => {
    mockApi.post.mockResolvedValue({ data: bloque });
    const input = { idEmpleado: 7, diaSemana: 1, horaInicio: '08:00', horaFin: '10:00' };
    await expect(crearDisponibilidad(input)).resolves.toEqual(bloque);
    expect(mockApi.post).toHaveBeenCalledWith('/disponibilidad', input);
  });

  it('actualiza un bloque', async () => {
    mockApi.patch.mockResolvedValue({ data: bloque });
    await actualizarDisponibilidad(1, { horaFin: '11:00' });
    expect(mockApi.patch).toHaveBeenCalledWith('/disponibilidad/1', { horaFin: '11:00' });
  });

  it('desactiva un bloque', async () => {
    mockApi.delete.mockResolvedValue({ data: { ...bloque, activo: false } });
    const result = await desactivarDisponibilidad(1);
    expect(result.activo).toBe(false);
    expect(mockApi.delete).toHaveBeenCalledWith('/disponibilidad/1');
  });
});

describe('agenda.service — cupos', () => {
  it('pide los cupos del bloque para una fecha', async () => {
    const cupos: Cupo[] = [{ hora: '08:00', ocupado: false, idCita: null }];
    mockApi.get.mockResolvedValue({ data: cupos });
    await expect(cuposDe(1, '2026-08-24')).resolves.toEqual(cupos);
    expect(mockApi.get).toHaveBeenCalledWith('/disponibilidad/1/cupos', {
      params: { fecha: '2026-08-24' },
    });
  });
});

describe('agenda.service — citas', () => {
  it('lista las citas de una fecha', async () => {
    mockApi.get.mockResolvedValue({ data: [cita] });
    await expect(listarCitas({ fecha: '2026-08-24' })).resolves.toEqual([cita]);
    expect(mockApi.get).toHaveBeenCalledWith('/citas', {
      params: { fecha: '2026-08-24' },
    });
  });

  it('sin filtros pide la agenda completa', async () => {
    mockApi.get.mockResolvedValue({ data: [] });
    await listarCitas();
    expect(mockApi.get).toHaveBeenCalledWith('/citas', { params: {} });
  });

  it('crea una cita', async () => {
    mockApi.post.mockResolvedValue({ data: cita });
    const input = {
      idPaciente: 5,
      idDisponibilidad: 1,
      fechaHora: '2026-08-24T09:00:00',
      telefono: '8710-1122',
    };
    await expect(crearCita(input)).resolves.toEqual(cita);
    expect(mockApi.post).toHaveBeenCalledWith('/citas', input);
  });

  it('cambia el estado de una cita', async () => {
    mockApi.patch.mockResolvedValue({ data: { ...cita, estado: EstadoCita.CANCELADA } });
    await cambiarEstadoCita(10, EstadoCita.CANCELADA, 'El paciente no puede');
    expect(mockApi.patch).toHaveBeenCalledWith('/citas/10/estado', {
      estado: EstadoCita.CANCELADA,
      motivoCambio: 'El paciente no puede',
    });
  });

  it('reprograma mandando siempre el cupo destino', async () => {
    mockApi.patch.mockResolvedValue({ data: cita });
    await reprogramarCita(10, {
      nuevaFechaHora: '2026-08-24T08:30:00',
      idDisponibilidad: 2,
    });
    expect(mockApi.patch).toHaveBeenCalledWith('/citas/10/estado', {
      estado: 'Reprogramada',
      nuevaFechaHora: '2026-08-24T08:30:00',
      idDisponibilidad: 2,
    });
  });

  it('devuelve el historial de una cita', async () => {
    mockApi.get.mockResolvedValue({ data: [] });
    await historialDeCita(10);
    expect(mockApi.get).toHaveBeenCalledWith('/citas/10/historial');
  });
});
