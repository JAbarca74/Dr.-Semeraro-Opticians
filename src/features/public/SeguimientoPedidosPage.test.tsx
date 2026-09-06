// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '../../test/rtl';
import userEvent from '@testing-library/user-event';
import { SeguimientoPedidosPage } from './SeguimientoPedidosPage';
import { misPedidos } from '../../core/api/portal.service';
import { parametrosPublicos } from '../../core/api/catalogo.service';
import type { PedidoPaciente } from '../../core/models/portal';

vi.mock('../../core/api/portal.service');
vi.mock('../../core/api/catalogo.service');

const pedido = (cambios: Partial<PedidoPaciente> = {}): PedidoPaciente => ({
  idOrdenLaboratorio: 7,
  idVenta: 12,
  fechaSolicitud: '2026-08-20T10:00:00Z',
  laboratorio: 'Óptica Lab CR',
  especificaciones: 'Monofocal antirreflejo',
  etapa: 'En fabricación',
  indiceEtapa: 1,
  fechaEstimadaEntrega: '2026-09-11',
  retrasado: false,
  actualizadoAl: '2026-08-24T18:00:00Z',
  ...cambios,
});

const mockPedidos = misPedidos as unknown as ReturnType<typeof vi.fn>;
const mockParametros = parametrosPublicos as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockPedidos.mockResolvedValue([pedido()]);
  mockParametros.mockResolvedValue({
    'optica.nombre': 'Óptica Dr. Semeraro',
    'optica.whatsapp': '50688887777',
    'optica.telefono': '7085-3353',
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('1. CU-14 · las cuatro etapas', () => {
  it('pinta las cuatro etapas del caso de uso', async () => {
    render(<SeguimientoPedidosPage />);

    expect(await screen.findByText('Recibido')).toBeInTheDocument();
    expect(screen.getAllByText('En fabricación').length).toBeGreaterThan(0);
    expect(screen.getByText('Listo para retirar')).toBeInTheDocument();
    expect(screen.getByText('Entregado')).toBeInTheDocument();
  });

  it('NO muestra el vocabulario interno de CU-07', async () => {
    const { container } = render(<SeguimientoPedidosPage />);

    await screen.findByText('Óptica Lab CR');
    expect(container.textContent).not.toContain('Enviado a lab');
    expect(container.textContent).not.toContain('En proceso');
    expect(container.textContent).not.toContain('Recibido en clínica');
  });

  it('muestra el detalle que pide el paso 4', async () => {
    render(<SeguimientoPedidosPage />);

    expect(await screen.findByText('Óptica Lab CR')).toBeInTheDocument();
    expect(screen.getByText('Monofocal antirreflejo')).toBeInTheDocument();
    /**
     * ⚠️ **La fecha pasó de `11/09/2026` a `11 sept 2026` con `DSO-54`, y es a
     * propósito.** Con tres idiomas, el formato numérico es una trampa: un
     * inglés lee `11/09/2026` como el 9 de noviembre y un costarricense como el
     * 11 de setiembre. El mes escrito no admite esa lectura doble.
     */
    expect(screen.getByText(/11 sept.* 2026/)).toBeInTheDocument();
  });

  it('EX-16: dice a qué momento corresponde la información', async () => {
    render(<SeguimientoPedidosPage />);
    expect(
      await screen.findByText(/Información actualizada al/),
    ).toBeInTheDocument();
  });

  it('avisa del retraso sin inventar una quinta etapa', async () => {
    mockPedidos.mockResolvedValue([pedido({ retrasado: true })]);
    render(<SeguimientoPedidosPage />);

    expect(await screen.findByText(/reportó un retraso/)).toBeInTheDocument();
    expect(screen.queryByText('Retrasado')).not.toBeInTheDocument();
  });
});

describe('2. EX-17 · pedido cancelado', () => {
  it('lo rotula como cancelado y no lo mete en la barra de etapas', async () => {
    mockPedidos.mockResolvedValue([
      pedido({ etapa: 'Cancelado', indiceEtapa: null }),
    ]);
    render(<SeguimientoPedidosPage />);

    expect(await screen.findByText('Cancelado')).toBeInTheDocument();
    expect(screen.getByText(/está cancelado/)).toBeInTheDocument();
    expect(screen.queryByText('Listo para retirar')).not.toBeInTheDocument();
  });

  it('un pedido cancelado conserva su botón de WhatsApp', async () => {
    mockPedidos.mockResolvedValue([
      pedido({ etapa: 'Cancelado', indiceEtapa: null }),
    ]);
    render(<SeguimientoPedidosPage />);

    expect(
      await screen.findByRole('button', { name: /consultar por whatsapp/i }),
    ).toBeInTheDocument();
  });
});

describe('3. Consultar por WhatsApp', () => {
  it('abre wa.me con el número de pedido incluido', async () => {
    const open = vi.fn().mockReturnValue({});
    vi.stubGlobal('open', open);
    render(<SeguimientoPedidosPage />);

    await userEvent.click(
      await screen.findByRole('button', { name: /consultar por whatsapp/i }),
    );

    const [url] = open.mock.calls[0];
    expect(url).toContain('https://wa.me/50688887777');
    expect(decodeURIComponent(url)).toContain('n.º 7');
  });

  it('si el navegador bloquea la ventana, ofrece el teléfono', async () => {
    vi.stubGlobal('open', vi.fn().mockReturnValue(null));
    render(<SeguimientoPedidosPage />);

    await userEvent.click(
      await screen.findByRole('button', { name: /consultar por whatsapp/i }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('7085-3353');
  });

  it('sin WhatsApp configurado ni siquiera intenta abrirlo', async () => {
    mockParametros.mockResolvedValue({ 'optica.telefono': '7085-3353' });
    const open = vi.fn();
    vi.stubGlobal('open', open);
    render(<SeguimientoPedidosPage />);

    await userEvent.click(
      await screen.findByRole('button', { name: /consultar por whatsapp/i }),
    );

    expect(open).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent('Canal no disponible');
  });

  it('sin ningún canal remite a llamar a la óptica', async () => {
    mockParametros.mockResolvedValue({});
    render(<SeguimientoPedidosPage />);

    await userEvent.click(
      await screen.findByRole('button', { name: /consultar por whatsapp/i }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'comuníquese con la óptica por teléfono',
    );
  });

  it('sin teléfono de respaldo cae al WhatsApp legible', async () => {
    mockParametros.mockResolvedValue({ 'optica.whatsapp': '50688887777' });
    vi.stubGlobal('open', vi.fn().mockReturnValue(null));
    render(<SeguimientoPedidosPage />);

    await userEvent.click(
      await screen.findByRole('button', { name: /consultar por whatsapp/i }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('8888-7777');
  });

  it('si los parámetros públicos fallan, los pedidos se siguen viendo', async () => {
    mockParametros.mockRejectedValue(new Error('sin red'));
    render(<SeguimientoPedidosPage />);

    expect(await screen.findByText('Óptica Lab CR')).toBeInTheDocument();
  });
});

describe('4. Estados vacíos y errores', () => {
  it('sin pedidos usa el literal del flujo alterno', async () => {
    mockPedidos.mockResolvedValue([]);
    render(<SeguimientoPedidosPage />);

    expect(
      await screen.findByText('No tiene pedidos registrados actualmente'),
    ).toBeInTheDocument();
  });

  it('si la API falla lo dice, no deja la página muda', async () => {
    mockPedidos.mockRejectedValue(new Error('caído'));
    render(<SeguimientoPedidosPage />);

    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });

  it('y entonces NO afirma además que no hay pedidos', async () => {
    mockPedidos.mockRejectedValue(new Error('caído'));
    render(<SeguimientoPedidosPage />);
    await screen.findByRole('alert');

    // Con la carga fallida la lista se queda en `[]`, y antes eso hacía que
    // encima del error apareciera un vacío que el sistema no puede afirmar:
    // no sabe si el paciente tiene pedidos o no.
    expect(
      screen.queryByText('No tiene pedidos registrados actualmente'),
    ).not.toBeInTheDocument();
  });

  it('lista varios pedidos, activos e históricos', async () => {
    mockPedidos.mockResolvedValue([
      pedido(),
      pedido({ idOrdenLaboratorio: 8, laboratorio: 'CristalTec', etapa: 'Entregado', indiceEtapa: 3 }),
    ]);
    render(<SeguimientoPedidosPage />);

    expect(await screen.findByText('Óptica Lab CR')).toBeInTheDocument();
    expect(screen.getByText('CristalTec')).toBeInTheDocument();
  });
});
