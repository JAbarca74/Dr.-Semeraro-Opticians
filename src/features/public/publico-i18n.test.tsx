// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import { IdiomaProvider } from '../../core/i18n/idioma.context';
import type { Idioma } from '../../core/i18n/idioma';
import { AgendarCitaPage } from './AgendarCitaPage';
import { RegistroPage } from './RegistroPage';
import { HomePage } from './HomePage';
import { SeguimientoPedidosPage } from './SeguimientoPedidosPage';

/**
 * El sitio público en los tres idiomas (`DSO-54`).
 *
 * ⚠️ **Compilar no basta.** El tipado garantiza que la clave existe y que está
 * traducida en los tres catálogos, pero no que la pantalla use la clave
 * correcta: `t('catalogo.titulo')` donde tocaba `t('catalogo.kicker')` compila
 * igual de bien. Esto comprueba lo único que el compilador no ve: que el texto
 * **que se ve** cambia al cambiar de idioma.
 */

vi.mock('../../core/api/contacto', () => ({
  useCanalContacto: () => ({
    nombreOptica: 'Óptica',
    aviso: '',
    abrirWhatsapp: () => true,
    limpiarAviso: () => {},
  }),
}));
vi.mock('../../core/api/portal.service', () => ({ misPedidos: vi.fn().mockResolvedValue([]) }));
vi.mock('../../core/api/catalogo.service', () => ({
  parametrosPublicos: vi.fn().mockResolvedValue({}),
}));
vi.mock('framer-motion', async () => {
  const react = await import('react');
  const PROPS = ['initial', 'animate', 'exit', 'variants', 'transition', 'whileInView', 'viewport'];
  const limpiar = (props: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(props).filter(([k]) => !PROPS.includes(k)));
  const etiqueta = (Tag: string) =>
    react.forwardRef((p: Record<string, unknown>, r: unknown) =>
      react.createElement(Tag, { ...limpiar(p), ref: r }),
    );
  return {
    AnimatePresence: ({ children }: { children: unknown }) => children,
    motion: new Proxy({}, { get: (_, tag: string) => etiqueta(tag) }),
  };
});

const pintar = (pagina: ReactElement, idioma: Idioma) => {
  localStorage.setItem('optica_idioma', idioma);
  return render(
    <MemoryRouter>
      <IdiomaProvider>{pagina}</IdiomaProvider>
    </MemoryRouter>,
  );
};

beforeEach(() => localStorage.clear());
afterEach(cleanup);

/** Cada caso: la pantalla y un texto suyo en cada idioma. */
const CASOS: [string, () => ReactElement, Record<Idioma, string>][] = [
  [
    'Agendar cita (CU-11)',
    () => <AgendarCitaPage />,
    { es: 'Agendar cita', en: 'Book an appointment', it: 'Prenota una visita' },
  ],
  [
    'Registro de paciente (CU-10)',
    () => <RegistroPage />,
    {
      es: 'Activar cuenta de paciente',
      en: 'Activate patient account',
      it: 'Attiva account paziente',
    },
  ],
  [
    'Portada',
    () => <HomePage />,
    { es: 'Aliados oficiales:', en: 'Official partners:', it: 'Partner ufficiali:' },
  ],
  [
    'Seguimiento de pedidos (CU-14)',
    () => <SeguimientoPedidosPage />,
    { es: 'Seguimiento de pedidos', en: 'Order tracking', it: 'Stato degli ordini' },
  ],
];

describe.each(CASOS)('%s', (_nombre, pagina, textos) => {
  /**
   * Se mira el texto del contenedor y no `findByText` a propósito: esa consulta
   * exige que el texto sea **todo** el contenido de un elemento, y varias de
   * estas pantallas parten la frase entre etiquetas para resaltar una palabra.
   * Lo que se quiere afirmar es más simple: que el texto visible cambia.
   */
  const texto = (c: HTMLElement) => c.textContent ?? '';

  it('se pinta en español', () => {
    const { container } = pintar(pagina(), 'es');
    expect(texto(container)).toContain(textos.es);
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

describe('EX-14 y EX-21: los literales del TFM se traducen, pero el español no se toca', () => {
  it('el vacío de pedidos conserva el literal exacto en español', async () => {
    pintar(<SeguimientoPedidosPage />, 'es');
    expect(
      await screen.findByText('No tiene pedidos registrados actualmente'),
    ).toBeInTheDocument();
  });

  it('y en inglés dice lo mismo en su idioma', async () => {
    pintar(<SeguimientoPedidosPage />, 'en');
    expect(
      await screen.findByText('You have no orders on record right now'),
    ).toBeInTheDocument();
  });

  it('las cuatro etapas de CU-14 se traducen por posición, no por el texto de la API', () => {
    // `pedido.etapa` llega siempre en español desde `PortalService`: si se
    // tradujera ese texto en vez de la posición, esto seguiría en español.
    const { container } = pintar(<SeguimientoPedidosPage />, 'it');
    expect(container.textContent).not.toContain('En fabricación');
  });
});
