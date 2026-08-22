// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LaboratorioPage } from './LaboratorioPage';
import {
  cambiarEstadoOrden,
  crearOrden,
  historialDeOrden,
  listarOrdenes,
  marcarRetraso,
} from '../../core/api/laboratorio.service';
import { EstadoOrden, type OrdenLaboratorio } from '../../core/models/laboratorio';

vi.mock('../../core/api/laboratorio.service');

vi.mock('framer-motion', async () => {
  const react = await import('react');
  const PROPS_ANIMACION = ['initial', 'animate', 'exit', 'variants', 'transition'];
  const stripProps = (props: any) =>
    Object.fromEntries(
      Object.entries(props).filter(([clave]) => !PROPS_ANIMACION.includes(clave)),
    );
  return {
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: {
      div: react.forwardRef((props: any, ref: any) => (
        <div ref={ref} {...stripProps(props)} />
      )),
    },
  };
});

const orden = (cambios: Partial<OrdenLaboratorio> = {}): OrdenLaboratorio => ({
  idOrdenLaboratorio: 42,
  idVenta: 7,
  laboratorioNombre: 'Óptica Lab CR',
  laboratorioContacto: null,
  laboratorioTelefono: null,
  estado: EstadoOrden.EN_PROCESO,
  estadoPrevio: null,
  especificaciones: 'Progresivos antirreflejo',
  fechaEstimadaEntrega: '2026-09-05',
  retrasadaDesde: null,
  createdAt: '2026-08-20T10:00:00.000Z',
  ...cambios,
});

const mockListar = vi.mocked(listarOrdenes);
const mockHistorial = vi.mocked(historialDeOrden);
const mockCambiar = vi.mocked(cambiarEstadoOrden);
const mockRetraso = vi.mocked(marcarRetraso);
const mockCrear = vi.mocked(crearOrden);

beforeEach(() => {
  vi.clearAllMocks();
  mockListar.mockResolvedValue([orden()]);
  mockHistorial.mockResolvedValue([]);
});

afterEach(cleanup);

/** Abre el detalle pulsando la fila de la orden. */
const abrirDetalle = async (usuario: ReturnType<typeof userEvent.setup>) => {
  await waitFor(() => expect(screen.getByText('Óptica Lab CR')).toBeInTheDocument());
  await usuario.click(screen.getByText('Óptica Lab CR'));
  await waitFor(() => expect(mockHistorial).toHaveBeenCalledWith(42));
};

describe('LaboratorioPage', () => {
  it('arranca mostrando solo las órdenes pendientes (CU-07 paso 2)', async () => {
    render(<LaboratorioPage />);

    await waitFor(() =>
      expect(mockListar).toHaveBeenCalledWith({ pendientes: true }),
    );
    expect(await screen.findByText('Óptica Lab CR')).toBeInTheDocument();
  });

  it('muestra los estados con el vocabulario del caso de uso, sin guion bajo', async () => {
    render(<LaboratorioPage />);

    expect(await screen.findByText('En proceso')).toBeInTheDocument();
    expect(screen.queryByText('En_proceso')).not.toBeInTheDocument();
  });

  it('cambiar de filtro vuelve a consultar con el filtro nuevo', async () => {
    const usuario = userEvent.setup();
    render(<LaboratorioPage />);
    await screen.findByText('Óptica Lab CR');

    await usuario.click(screen.getByRole('button', { name: 'Retrasadas' }));

    await waitFor(() =>
      expect(mockListar).toHaveBeenCalledWith({ estado: EstadoOrden.RETRASADO }),
    );
  });

  it('sin resultados avisa en vez de dejar la tabla muda', async () => {
    mockListar.mockResolvedValue([]);
    render(<LaboratorioPage />);

    expect(
      await screen.findByText('No hay órdenes con este filtro.'),
    ).toBeInTheDocument();
  });

  it('al seleccionar una orden carga su detalle y su bitácora', async () => {
    mockHistorial.mockResolvedValue([
      {
        idHistorialOrden: 1,
        idOrden: 42,
        idUsuario: 1,
        estadoAnterior: EstadoOrden.ENVIADO,
        estadoNuevo: EstadoOrden.EN_PROCESO,
        comentario: null,
        changedAt: '2026-08-21T09:00:00.000Z',
      },
    ]);
    const usuario = userEvent.setup();
    render(<LaboratorioPage />);
    await abrirDetalle(usuario);

    expect(screen.getByText('Progresivos antirreflejo')).toBeInTheDocument();
    expect(screen.getByText(/Enviado a lab/)).toBeInTheDocument();
  });

  it('EX-09: el desplegable no ofrece «Listo» desde «En proceso»', async () => {
    const usuario = userEvent.setup();
    render(<LaboratorioPage />);
    await abrirDetalle(usuario);

    const select = screen.getByLabelText('Cambiar estado');
    const opciones = within(select).getAllByRole('option').map((o) => o.textContent);

    expect(opciones).toContain('Recibido en clínica');
    expect(opciones).not.toContain('Listo para entrega');
  });

  it('avanza el estado por el camino normal', async () => {
    mockCambiar.mockResolvedValue(orden({ estado: EstadoOrden.RECIBIDO }));
    const usuario = userEvent.setup();
    render(<LaboratorioPage />);
    await abrirDetalle(usuario);

    await usuario.selectOptions(
      screen.getByLabelText('Cambiar estado'),
      EstadoOrden.RECIBIDO,
    );
    await usuario.click(screen.getByRole('button', { name: /Confirmar cambio/ }));

    await waitFor(() =>
      expect(mockCambiar).toHaveBeenCalledWith(42, EstadoOrden.RECIBIDO, undefined),
    );
  });

  it('marcar retraso exige motivo antes de dejar confirmar', async () => {
    const usuario = userEvent.setup();
    render(<LaboratorioPage />);
    await abrirDetalle(usuario);

    await usuario.selectOptions(
      screen.getByLabelText('Cambiar estado'),
      EstadoOrden.RETRASADO,
    );

    const boton = screen.getByRole('button', { name: /Confirmar cambio/ });
    expect(boton).toBeDisabled();
    expect(
      screen.getByText('Para marcar la orden como retrasada hay que indicar el motivo.'),
    ).toBeInTheDocument();

    await usuario.type(screen.getByLabelText('Motivo del retraso *'), 'Sin material');
    expect(boton).toBeEnabled();

    mockRetraso.mockResolvedValue(
      orden({ estado: EstadoOrden.RETRASADO, estadoPrevio: EstadoOrden.EN_PROCESO }),
    );
    await usuario.click(boton);

    await waitFor(() => expect(mockRetraso).toHaveBeenCalledWith(42, 'Sin material'));
  });

  it('una orden retrasada avisa de cuántos días lleva parada', async () => {
    const hace3Dias = new Date(Date.now() - 3 * 86_400_000).toISOString();
    mockListar.mockResolvedValue([
      orden({
        estado: EstadoOrden.RETRASADO,
        estadoPrevio: EstadoOrden.EN_PROCESO,
        retrasadaDesde: hace3Dias,
      }),
    ]);
    const usuario = userEvent.setup();
    render(<LaboratorioPage />);
    await abrirDetalle(usuario);

    expect(screen.getByText(/Detenida hace 3 día\(s\)/)).toBeInTheDocument();
  });

  it('una orden «Listo» no ofrece cambios de estado', async () => {
    mockListar.mockResolvedValue([orden({ estado: EstadoOrden.LISTO })]);
    const usuario = userEvent.setup();
    render(<LaboratorioPage />);
    await abrirDetalle(usuario);

    expect(screen.queryByLabelText('Cambiar estado')).not.toBeInTheDocument();
    expect(
      screen.getByText(/ya no admite cambios\s+de estado/),
    ).toBeInTheDocument();
  });

  it('muestra el error del backend tal cual, sin inventar uno propio', async () => {
    mockCambiar.mockRejectedValue({
      response: { data: { message: 'No se puede pasar de «En proceso» a «Listo para entrega».' } },
    });
    const usuario = userEvent.setup();
    render(<LaboratorioPage />);
    await abrirDetalle(usuario);

    await usuario.selectOptions(
      screen.getByLabelText('Cambiar estado'),
      EstadoOrden.RECIBIDO,
    );
    await usuario.click(screen.getByRole('button', { name: /Confirmar cambio/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se puede pasar de «En proceso» a «Listo para entrega».',
    );
  });

  it('abre una orden nueva sin mandar los campos opcionales vacíos', async () => {
    mockCrear.mockResolvedValue(orden({ idOrdenLaboratorio: 43 }));
    const usuario = userEvent.setup();
    render(<LaboratorioPage />);
    await screen.findByText('Óptica Lab CR');

    await usuario.click(screen.getByRole('button', { name: /Nueva orden/ }));
    await usuario.type(screen.getByLabelText('Venta *'), '7');
    await usuario.type(screen.getByLabelText('Laboratorio *'), 'Lab CR');
    await usuario.type(screen.getByLabelText('Especificaciones *'), 'Bifocales');
    await usuario.click(screen.getByRole('button', { name: /Abrir orden/ }));

    await waitFor(() =>
      expect(mockCrear).toHaveBeenCalledWith({
        idVenta: 7,
        laboratorioNombre: 'Lab CR',
        especificaciones: 'Bifocales',
      }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent('Orden #43');
  });

  it('el botón de cerrar oculta el detalle sin recargar la tabla', async () => {
    const usuario = userEvent.setup();
    render(<LaboratorioPage />);
    await abrirDetalle(usuario);
    expect(screen.getByText('Progresivos antirreflejo')).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Cerrar detalle' }));

    expect(screen.queryByText('Progresivos antirreflejo')).not.toBeInTheDocument();
    expect(
      screen.getByText('Seleccione una orden para ver su detalle y su bitácora.'),
    ).toBeInTheDocument();
  });

  it('«Actualizar» vuelve a pedir el listado con el filtro vigente', async () => {
    const usuario = userEvent.setup();
    render(<LaboratorioPage />);
    await screen.findByText('Óptica Lab CR');
    mockListar.mockClear();

    await usuario.click(screen.getByRole('button', { name: /Actualizar/ }));

    await waitFor(() =>
      expect(mockListar).toHaveBeenCalledWith({ pendientes: true }),
    );
  });

  it('cancelar el alta cierra el formulario sin crear nada', async () => {
    const usuario = userEvent.setup();
    render(<LaboratorioPage />);
    await screen.findByText('Óptica Lab CR');

    await usuario.click(screen.getByRole('button', { name: /Nueva orden/ }));
    expect(screen.getByLabelText('Venta *')).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByLabelText('Venta *')).not.toBeInTheDocument();
    expect(mockCrear).not.toHaveBeenCalled();
  });

  it('el alta manda los campos opcionales cuando sí se llenan', async () => {
    mockCrear.mockResolvedValue(orden({ idOrdenLaboratorio: 44 }));
    const usuario = userEvent.setup();
    render(<LaboratorioPage />);
    await screen.findByText('Óptica Lab CR');

    await usuario.click(screen.getByRole('button', { name: /Nueva orden/ }));
    await usuario.type(screen.getByLabelText('Venta *'), '9');
    await usuario.type(screen.getByLabelText('Laboratorio *'), 'Lab CR');
    await usuario.type(screen.getByLabelText('Especificaciones *'), 'Bifocales');
    await usuario.type(screen.getByLabelText('Contacto'), 'Marta');
    await usuario.type(screen.getByLabelText('Teléfono'), '8888-0000');
    await usuario.click(screen.getByRole('button', { name: /Abrir orden/ }));

    await waitFor(() =>
      expect(mockCrear).toHaveBeenCalledWith({
        idVenta: 9,
        laboratorioNombre: 'Lab CR',
        especificaciones: 'Bifocales',
        laboratorioContacto: 'Marta',
        laboratorioTelefono: '8888-0000',
      }),
    );
  });

  it('avisa si el alta es rechazada por el backend', async () => {
    mockCrear.mockRejectedValue({
      response: {
        data: {
          message:
            'No se puede abrir una orden de laboratorio sobre una venta anulada.',
        },
      },
    });
    const usuario = userEvent.setup();
    render(<LaboratorioPage />);
    await screen.findByText('Óptica Lab CR');

    await usuario.click(screen.getByRole('button', { name: /Nueva orden/ }));
    await usuario.type(screen.getByLabelText('Venta *'), '7');
    await usuario.type(screen.getByLabelText('Laboratorio *'), 'Lab CR');
    await usuario.type(screen.getByLabelText('Especificaciones *'), 'x');
    await usuario.click(screen.getByRole('button', { name: /Abrir orden/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se puede abrir una orden de laboratorio sobre una venta anulada.',
    );
  });

  it('avisa si la bitácora no se puede cargar', async () => {
    mockHistorial.mockRejectedValue({
      response: { data: { message: 'La orden #42 no existe.' } },
    });
    const usuario = userEvent.setup();
    render(<LaboratorioPage />);
    await waitFor(() => expect(screen.getByText('Óptica Lab CR')).toBeInTheDocument());
    await usuario.click(screen.getByText('Óptica Lab CR'));

    expect(await screen.findByRole('alert')).toHaveTextContent('La orden #42 no existe.');
  });

  it('muestra el comentario del retraso en la bitácora', async () => {
    mockHistorial.mockResolvedValue([
      {
        idHistorialOrden: 2,
        idOrden: 42,
        idUsuario: 1,
        estadoAnterior: EstadoOrden.EN_PROCESO,
        estadoNuevo: EstadoOrden.RETRASADO,
        comentario: 'El lab no tiene material',
        changedAt: '2026-08-21T09:00:00.000Z',
      },
    ]);
    const usuario = userEvent.setup();
    render(<LaboratorioPage />);
    await abrirDetalle(usuario);

    expect(screen.getByText('«El lab no tiene material»')).toBeInTheDocument();
  });

  it('avisa si el listado falla', async () => {
    mockListar.mockRejectedValue({
      response: { data: { message: 'Token inválido' } },
    });
    render(<LaboratorioPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Token inválido');
  });
});
