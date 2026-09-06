// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup, screen } from '../../test/rtl';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import type { Idioma } from '../../core/i18n/idioma';
import { MetricasPage } from './MetricasPage';
import { InventarioPage } from './InventarioPage';
import { AuditoriaPage } from './AuditoriaPage';

/**
 * Las pantallas privadas en los tres idiomas (`DSO-55`).
 *
 * ⚠️ **El tipado garantiza que la clave existe y está traducida; no garantiza
 * que la pantalla use la clave correcta.** `t('metricas.titulo')` donde tocaba
 * `t('metricas.kicker')` compila igual de bien. Esto comprueba lo único que el
 * compilador no ve: que el texto visible cambia con el idioma.
 */

vi.mock('../../core/api/metricas.service', () => ({
  resumenMetricas: vi.fn().mockResolvedValue({ sinDatos: true, periodo: { desde: '', hasta: '' } }),
  reporteMetricasPdf: vi.fn(),
}));
vi.mock('../../core/api/inventario.service', () => ({
  listarProductos: vi.fn().mockResolvedValue([]),
  movimientosDeProducto: vi.fn().mockResolvedValue([]),
  crearProducto: vi.fn(),
  actualizarProducto: vi.fn(),
  registrarEntrada: vi.fn(),
  ajustarStock: vi.fn(),
}));
vi.mock('../../core/api/auditoria.service', async () => {
  const real = await vi.importActual<typeof import('../../core/api/auditoria.service')>(
    '../../core/api/auditoria.service',
  );
  return {
    ...real,
    listarLogs: vi.fn().mockResolvedValue({ datos: [], total: 0 }),
    listarAccesos: vi.fn().mockResolvedValue({ datos: [], total: 0 }),
    listarTablasAuditadas: vi.fn().mockResolvedValue([]),
  };
});
vi.mock('framer-motion', async () => {
  const react = await import('react');
  const PROPS = ['initial', 'animate', 'exit', 'variants', 'transition', 'whileInView', 'viewport'];
  const limpiar = (p: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(p).filter(([k]) => !PROPS.includes(k)));
  return {
    AnimatePresence: ({ children }: { children: unknown }) => children,
    motion: new Proxy(
      {},
      {
        get:
          (_, tag: string) =>
            react.forwardRef((p: Record<string, unknown>, r: unknown) =>
              react.createElement(tag, { ...limpiar(p), ref: r }),
            ),
      },
    ),
  };
});

const pintar = (pagina: ReactElement, idioma: Idioma) => {
  localStorage.setItem('optica_idioma', idioma);
  return render(<MemoryRouter>{pagina}</MemoryRouter>);
};

beforeEach(() => localStorage.clear());
afterEach(cleanup);

const CASOS: [string, () => ReactElement, Record<Idioma, string>][] = [
  [
    'Métricas (CU-19)',
    () => <MetricasPage />,
    { es: 'Métricas e indicadores', en: 'Metrics and indicators', it: 'Metriche e indicatori' },
  ],
  [
    'Bodega e inventario (CU-03)',
    () => <InventarioPage />,
    { es: 'Bodega e inventario', en: 'Warehouse and stock', it: 'Magazzino e giacenze' },
  ],
  [
    'Auditoría (CU-08)',
    () => <AuditoriaPage />,
    { es: 'Auditoría del sistema', en: 'System audit log', it: 'Registro attività di sistema' },
  ],
];

describe.each(CASOS)('%s', (_nombre, pagina, textos) => {
  const texto = (c: HTMLElement) => c.textContent ?? '';

  it('se pinta en español', () => {
    expect(texto(pintar(pagina(), 'es').container)).toContain(textos.es);
  });

  it('se pinta en inglés, y no deja el español asomando', () => {
    const { container } = pintar(pagina(), 'en');
    expect(texto(container)).toContain(textos.en);
    expect(texto(container)).not.toContain(textos.es);
  });

  it('se pinta en italiano, y no deja el español asomando', () => {
    const { container } = pintar(pagina(), 'it');
    expect(texto(container)).toContain(textos.it);
    expect(texto(container)).not.toContain(textos.es);
  });
});

describe('EX-21 se traduce sin tocar el literal del TFM en español', () => {
  it('en español dice exactamente lo que dice el caso de uso', async () => {
    // El resumen llega por promesa: hay que esperar a que el vacío se pinte.
    pintar(<MetricasPage />, 'es');
    expect(
      await screen.findByText('No hay registros disponibles para este periodo'),
    ).toBeInTheDocument();
  });

  it('y en italiano lo dice en italiano', async () => {
    pintar(<MetricasPage />, 'it');
    expect(
      await screen.findByText('Nessun dato disponibile per questo periodo'),
    ).toBeInTheDocument();
  });
});
