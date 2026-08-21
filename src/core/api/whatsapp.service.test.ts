import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  generarRecordatorios,
  listarComunicaciones,
  marcarRecordatorioEnviado,
} from './whatsapp.service';
import {
  EstadoEnvio,
  TipoComunicacion,
  type ComunicacionWhatsapp,
} from '../models/whatsapp';

vi.mock('./http', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

import api from './http';

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
};

const recordatorio: ComunicacionWhatsapp = {
  idComunicacionWhatsapp: 1,
  idPaciente: 5,
  idCita: 10,
  idInteraccionIa: null,
  tipo: TipoComunicacion.RECORDATORIO,
  mensaje: 'Le recordamos su cita…',
  estadoEnvio: EstadoEnvio.PENDIENTE,
  enviadoEn: null,
  urlWhatsapp: 'https://wa.me/87101122?text=Le%20recordamos',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('whatsapp.service', () => {
  it('lista la bitácora de comunicaciones', async () => {
    mockApi.get.mockResolvedValue({ data: [recordatorio] });
    await expect(listarComunicaciones()).resolves.toEqual([recordatorio]);
    expect(mockApi.get).toHaveBeenCalledWith('/whatsapp/comunicaciones');
  });

  it('genera los recordatorios y devuelve su enlace de WhatsApp', async () => {
    mockApi.post.mockResolvedValue({ data: [recordatorio] });
    const generados = await generarRecordatorios();
    expect(generados[0].urlWhatsapp).toContain('wa.me');
    expect(mockApi.post).toHaveBeenCalledWith('/whatsapp/recordatorios/generar');
  });

  it('marca un recordatorio como enviado', async () => {
    mockApi.patch.mockResolvedValue({
      data: { ...recordatorio, estadoEnvio: EstadoEnvio.ENVIADO },
    });
    const result = await marcarRecordatorioEnviado(1);
    expect(result.estadoEnvio).toBe(EstadoEnvio.ENVIADO);
    expect(mockApi.patch).toHaveBeenCalledWith('/whatsapp/comunicaciones/1/enviada');
  });
});
