// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MetricasPage } from './MetricasPage';
import {
  reporteMetricasPdf,
  resumenMetricas,
} from '../../core/api/metricas.service';
import { descargarCsv } from '../../shared/csv';
import { descargarArchivo } from '../../shared/descarga';
import type { ResumenMetricas } from '../../core/models/metricas';

vi.mock('../../core/api/metricas.service');

// Se espía la descarga sin sustituir el armado del CSV: así la prueba sigue
// viendo el contenido real que bajaría el usuario.
vi.mock('../../shared/csv', async () => {
  const real = await vi.importActual<typeof import('../../shared/csv')>(
    '../../shared/csv',
  );
  return { ...real, descargarCsv: vi.fn() };
});
vi.mock('../../shared/descarga', () => ({ descargarArchivo: vi.fn() }));

vi.mock('framer-motion', async () => {
  const react = await import('react');
  const PROPS = ['initial', 'animate', 'exit', 'variants', 'transition', 'whileInView', 'viewport'];
  const strip = (props: any) =>
    Object.fromEntries(Object.entries(props).filter(([k]) => !PROPS.includes(k)));
  return {
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: {
      div: react.forwardRef((p: any, r: any) => <div ref={r} {...strip(p)} />),
      p: react.forwardRef((p: any, r: any) => <p ref={r} {...strip(p)} />),
      header: react.forwardRef((p: any, r: any) => <header ref={r} {...strip(p)} />),
    },
  };
});

const resumen = (cambios: Partial<ResumenMetricas> = {}): ResumenMetricas => ({
  periodo: { desde: '2026-08-01T12:00:00.000Z', hasta: '2026-08-26T12:00:00.000Z' },
  sinDatos: false,
  ventas: { ingresos: 758, cantidad: 4, ticketPromedio: 189.5, anuladas: 11 },
  inventario: {
    productos: 4,
    unidadesEnBodega: 55,
    bajoStock: 0,
    unidadesVendidas: 4,
  },
  agenda: {
    total: 9,
    porEstado: { Solicitada: 0, Confirmada: 7, Cancelada: 1, Reprogramada: 1 },
  },
  topAros: [
    {
      idProducto: 9,
      sku: 'DEMO-1',
      nombre: 'Armazón Ray-Ban Wayfarer',
      marca: 'Ray-Ban',
      unidades: 4,
      ingresos: 758,
    },
  ],
  ...cambios,
});

const mockResumen = resumenMetricas as unknown as ReturnType<typeof vi.fn>;
const mockPdf = reporteMetricasPdf as unknown as ReturnType<typeof vi.fn>;
const mockCsv = descargarCsv as unknown as ReturnType<typeof vi.fn>;
const mockArchivo = descargarArchivo as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockResumen.mockResolvedValue(resumen());
  mockPdf.mockResolvedValue(new Blob(['%PDF'], { type: 'application/pdf' }));
});

afterEach(cleanup);

describe('1. CU-19 · indicadores', () => {
  it('muestra ingresos, ticket promedio y unidades', async () => {
    render(<MetricasPage />);

    expect(await screen.findByText('Ingresos internos')).toBeInTheDocument();
    expect(screen.getByText('Ticket promedio')).toBeInTheDocument();
    expect(screen.getByText('Unidades vendidas')).toBeInTheDocument();
    expect(screen.getByText('Citas del periodo')).toBeInTheDocument();
  });

  it('avisa de las anuladas y aclara que quedan fuera del ingreso', async () => {
    render(<MetricasPage />);
    expect(
      await screen.findByText(/11 anulada\(s\), fuera del ingreso/),
    ).toBeInTheDocument();
  });

  it('sin anulaciones lo dice en vez de mostrar un cero suelto', async () => {
    mockResumen.mockResolvedValue(
      resumen({ ventas: { ingresos: 100, cantidad: 1, ticketPromedio: 100, anuladas: 0 } }),
    );
    render(<MetricasPage />);
    expect(await screen.findByText(/Sin anulaciones en el periodo/)).toBeInTheDocument();
  });

  it('pinta el top de aros con sus unidades e ingresos', async () => {
    render(<MetricasPage />);

    expect(await screen.findByText('Armazón Ray-Ban Wayfarer')).toBeInTheDocument();
    expect(screen.getByText(/4 u ·/)).toBeInTheDocument();
  });

  it('sin salidas de producto lo rotula, no deja la tarjeta vacía', async () => {
    mockResumen.mockResolvedValue(resumen({ topAros: [] }));
    render(<MetricasPage />);
    expect(
      await screen.findByText('No hubo salidas de producto en este periodo.'),
    ).toBeInTheDocument();
  });

  it('la agenda muestra los cuatro estados, incluso los que valen cero', async () => {
    render(<MetricasPage />);

    await screen.findByText('Estado de la agenda');
    for (const estado of ['Solicitada', 'Confirmada', 'Cancelada', 'Reprogramada']) {
      expect(screen.getByText(estado)).toBeInTheDocument();
    }
  });

  it('advierte de que el stock es de hoy, no del periodo', async () => {
    render(<MetricasPage />);
    expect(
      await screen.findByText(/existencias y la alerta de stock son del día de hoy/),
    ).toBeInTheDocument();
  });
});

describe('2. EX-21 · sin registros en el periodo', () => {
  it('usa el literal del caso de uso', async () => {
    mockResumen.mockResolvedValue(resumen({ sinDatos: true }));
    render(<MetricasPage />);

    expect(
      await screen.findByText('No hay registros disponibles para este periodo'),
    ).toBeInTheDocument();
  });

  it('y entonces no pinta los indicadores', async () => {
    mockResumen.mockResolvedValue(resumen({ sinDatos: true }));
    const { container } = render(<MetricasPage />);

    await screen.findByText('No hay registros disponibles para este periodo');
    expect(container.textContent).not.toContain('Ticket promedio');
  });
});

describe('3. CU-19 paso 3 · rango personalizado', () => {
  it('arranca pidiendo el mes actual', async () => {
    render(<MetricasPage />);

    await screen.findByText('Ingresos internos');
    const [filtros] = mockResumen.mock.calls[0];
    expect(filtros.desde).toMatch(/^\d{4}-\d{2}-01$/);
  });

  it('aplicar un rango vuelve a consultar con esas fechas', async () => {
    render(<MetricasPage />);
    await screen.findByText('Ingresos internos');

    const desde = screen.getByLabelText(/desde/i) as HTMLInputElement;
    await userEvent.clear(desde);
    await userEvent.type(desde, '2026-03-01');
    await userEvent.click(screen.getByRole('button', { name: /aplicar/i }));

    const ultima = mockResumen.mock.calls.at(-1)?.[0];
    expect(ultima.desde).toBe('2026-03-01');
  });

  it('un rango invertido bloquea el botón y avisa', async () => {
    render(<MetricasPage />);
    await screen.findByText('Ingresos internos');

    const desde = screen.getByLabelText(/desde/i) as HTMLInputElement;
    await userEvent.clear(desde);
    await userEvent.type(desde, '2027-01-01');

    expect(screen.getByRole('button', { name: /aplicar/i })).toBeDisabled();
    expect(screen.getByText(/no puede ser posterior/)).toBeInTheDocument();
  });

  it('«Mes actual» restablece el rango y recarga', async () => {
    render(<MetricasPage />);
    await screen.findByText('Ingresos internos');

    await userEvent.click(screen.getByRole('button', { name: /mes actual/i }));

    const ultima = mockResumen.mock.calls.at(-1)?.[0];
    expect(ultima.desde).toMatch(/^\d{4}-\d{2}-01$/);
  });
});

describe('4. Errores y estados', () => {
  it('si la API falla lo dice', async () => {
    mockResumen.mockRejectedValue(new Error('403'));
    render(<MetricasPage />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('mientras carga lo indica', () => {
    mockResumen.mockReturnValue(new Promise(() => {}));
    render(<MetricasPage />);

    expect(screen.getByText('Calculando métricas…')).toBeInTheDocument();
  });
});

describe('5. CU-19 flujo alterno · «Descargar Resumen» (`DSO-48`)', () => {
  it('el CSV se arma con lo que está en pantalla, sin volver a la API', async () => {
    render(<MetricasPage />);
    await screen.findByText('Ingresos internos');
    const llamadasPrevias = mockResumen.mock.calls.length;

    await userEvent.click(screen.getByRole('button', { name: /resumen csv/i }));

    const [nombre, contenido] = mockCsv.mock.calls[0];
    expect(nombre).toBe('metricas-2026-08-01_2026-08-26.csv');
    expect(contenido).toContain('Ingresos internos');
    expect(contenido).toContain('Armazón Ray-Ban Wayfarer');
    // RS-18: una descarga no debe costar otra ronda de agregaciones.
    expect(mockResumen.mock.calls).toHaveLength(llamadasPrevias);
  });

  it('el PDF lo pide a la API con el rango de la pantalla', async () => {
    render(<MetricasPage />);
    await screen.findByText('Ingresos internos');

    await userEvent.click(screen.getByRole('button', { name: /resumen pdf/i }));

    expect(mockPdf).toHaveBeenCalledOnce();
    const [nombre] = mockArchivo.mock.calls[0];
    expect(nombre).toBe('metricas-2026-08-01_2026-08-26.pdf');
  });

  it('si el PDF falla lo dice y no descarga nada', async () => {
    mockPdf.mockRejectedValue(new Error('403'));
    render(<MetricasPage />);
    await screen.findByText('Ingresos internos');

    await userEvent.click(screen.getByRole('button', { name: /resumen pdf/i }));

    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(mockArchivo).not.toHaveBeenCalled();
  });

  it('EX-21: con el periodo vacío la descarga sigue disponible y lo hace constar', async () => {
    mockResumen.mockResolvedValue(resumen({ sinDatos: true }));
    render(<MetricasPage />);
    await screen.findByText('No hay registros disponibles para este periodo');

    const boton = screen.getByRole('button', { name: /resumen csv/i });
    expect(boton).toBeEnabled();
    await userEvent.click(boton);

    expect(mockCsv.mock.calls[0][1]).toContain(
      'No hay registros disponibles para este periodo',
    );
  });

  it('mientras carga el resumen no hay nada que exportar', () => {
    mockResumen.mockReturnValue(new Promise(() => {}));
    render(<MetricasPage />);

    expect(screen.getByRole('button', { name: /resumen csv/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /resumen pdf/i })).toBeDisabled();
  });
});
