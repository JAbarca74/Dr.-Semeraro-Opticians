// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { MisExpedientes } from './MisExpedientes';
import { misExpedientes } from '../../core/api/portal.service';
import type { EvaluacionPaciente } from '../../core/models/portal';

vi.mock('../../core/api/portal.service');

const evaluacion = (
  cambios: Partial<EvaluacionPaciente> = {},
): EvaluacionPaciente => ({
  idEvaluacionClinica: 1,
  fecha: '2026-08-04T12:00:00Z',
  doctor: 'Luigi Semeraro Román',
  diagnosticos: ['Miopía leve con astigmatismo'],
  refracciones: [
    { ojo: 'OD', esfera: -1.25, cilindro: -0.5, eje: 180, adicion: 1 },
  ],
  receta: { hash: 'abc123', firmadoEn: '2026-08-04T12:05:00Z' },
  ...cambios,
});

const mockExpedientes = misExpedientes as unknown as ReturnType<typeof vi.fn>;

const pintar = () =>
  render(
    <MemoryRouter>
      <MisExpedientes />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockExpedientes.mockResolvedValue([evaluacion()]);
});

afterEach(cleanup);

describe('CU-12 · lo que el paciente ve de su expediente', () => {
  it('muestra fecha, doctor, diagnóstico y fórmula', async () => {
    pintar();

    expect(await screen.findByText('Luigi Semeraro Román')).toBeInTheDocument();
    expect(screen.getByText('Miopía leve con astigmatismo')).toBeInTheDocument();
    expect(screen.getByText(/Esf -1\.25/)).toBeInTheDocument();
  });

  it('ofrece descargar la receta y verificarla', async () => {
    pintar();

    const descarga = await screen.findByRole('link', { name: /descargar receta/i });
    expect(descarga).toHaveAttribute('href', expect.stringContaining('/recetas/abc123/pdf'));
    expect(screen.getByRole('link', { name: /verificar autenticidad/i })).toHaveAttribute(
      'href',
      '/verificar/abc123',
    );
  });

  it('una evaluación sin receta no ofrece descarga', async () => {
    mockExpedientes.mockResolvedValue([evaluacion({ receta: null })]);
    pintar();

    await screen.findByText('Luigi Semeraro Román');
    expect(screen.queryByRole('link', { name: /descargar receta/i })).toBeNull();
  });

  it('sin diagnósticos no pinta el bloque', async () => {
    mockExpedientes.mockResolvedValue([evaluacion({ diagnosticos: [] })]);
    const { container } = pintar();

    await screen.findByText('Luigi Semeraro Román');
    expect(container.textContent).not.toContain('Impresión diagnóstica');
  });

  it('sin refracciones no pinta la fórmula', async () => {
    mockExpedientes.mockResolvedValue([evaluacion({ refracciones: [] })]);
    const { container } = pintar();

    await screen.findByText('Luigi Semeraro Román');
    expect(container.textContent).not.toContain('Su fórmula');
  });

  it('EX-14: sin registros usa el literal del caso de uso', async () => {
    mockExpedientes.mockResolvedValue([]);
    pintar();

    expect(
      await screen.findByText(
        'Aún no posee registros médicos disponibles para visualización',
      ),
    ).toBeInTheDocument();
  });

  it('si la API falla lo dice', async () => {
    mockExpedientes.mockRejectedValue(new Error('caído'));
    pintar();

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('mientras carga lo indica, no queda en blanco', () => {
    mockExpedientes.mockReturnValue(new Promise(() => {}));
    pintar();

    expect(screen.getByText('Cargando su expediente…')).toBeInTheDocument();
  });

  it('lista varias consultas', async () => {
    mockExpedientes.mockResolvedValue([
      evaluacion(),
      evaluacion({ idEvaluacionClinica: 2, doctor: 'Otro Especialista' }),
    ]);
    pintar();

    expect(await screen.findByText('Luigi Semeraro Román')).toBeInTheDocument();
    expect(screen.getByText('Otro Especialista')).toBeInTheDocument();
  });
});
