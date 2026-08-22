// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VentasPage } from './VentasPage';
import { listarProductos } from '../../core/api/inventario.service';
import { listarPersonas } from '../../core/api/personas.service';
import {
  anularVenta,
  listarVentas,
  registrarVenta,
} from '../../core/api/ventas.service';
import { CategoriaProducto, type Producto } from '../../core/models/inventario';
import { TipoPersona, type Persona } from '../../core/models/persona';
import { EstadoVenta, type Venta } from '../../core/models/venta';

vi.mock('../../core/api/inventario.service');
vi.mock('../../core/api/personas.service');
vi.mock('../../core/api/ventas.service');

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
      p: react.forwardRef((props: any, ref: any) => (
        <p ref={ref} {...stripProps(props)} />
      )),
      header: react.forwardRef((props: any, ref: any) => (
        <header ref={ref} {...stripProps(props)} />
      )),
    },
  };
});

const producto = (cambios: Partial<Producto> = {}): Producto => ({
  idProducto: 1,
  sku: 'RB-2140-51',
  nombre: 'Ray-Ban Wayfarer',
  marca: 'Ray-Ban',
  categoria: CategoriaProducto.ARO,
  stock: 10,
  umbralMinimo: 3,
  bajoStock: false,
  precio: 100,
  color: null,
  material: null,
  calibre: null,
  indiceRefraccion: null,
  filtro: null,
  tratamiento: null,
  formasRostroCompatibles: null,
  esPublico: false,
  imagenUrl: null,
  ...cambios,
});

const venta = (cambios: Partial<Venta> = {}): Venta => ({
  idVenta: 7,
  idPaciente: null,
  nombrePaciente: null,
  idUsuario: 1,
  total: 300,
  estado: EstadoVenta.ACTIVA,
  fecha: '2026-08-22T10:00:00.000Z',
  detalles: [
    {
      idDetalleVenta: 100,
      idProducto: 1,
      sku: 'RB-2140-51',
      nombre: 'Ray-Ban Wayfarer',
      cantidad: 3,
      precioUnitario: 100,
      subtotal: 300,
    },
  ],
  ...cambios,
});

const paciente: Persona = {
  idPersona: 5,
  cedula: '1-1111-1111',
  nombre: 'Ana Rojas',
  tipo: TipoPersona.PACIENTE,
} as Persona;

const mockProductos = vi.mocked(listarProductos);
const mockPersonas = vi.mocked(listarPersonas);
const mockVentas = vi.mocked(listarVentas);
const mockRegistrar = vi.mocked(registrarVenta);
const mockAnular = vi.mocked(anularVenta);

beforeEach(() => {
  vi.clearAllMocks();
  mockProductos.mockResolvedValue([producto()]);
  mockPersonas.mockResolvedValue([paciente]);
  mockVentas.mockResolvedValue([venta()]);
});

afterEach(cleanup);

/** Busca en bodega y agrega el primer resultado al carrito. */
const agregarAlCarrito = async (usuario: ReturnType<typeof userEvent.setup>) => {
  await usuario.type(screen.getByLabelText('Buscar en bodega'), 'ray');
  await usuario.click(screen.getByRole('button', { name: /^Buscar$/ }));
  await waitFor(() => expect(mockProductos).toHaveBeenCalled());
  await usuario.click(await screen.findByRole('button', { name: 'Agregar' }));
};

describe('VentasPage', () => {
  it('carga las ventas recientes al entrar', async () => {
    render(<VentasPage />);

    await waitFor(() => expect(mockVentas).toHaveBeenCalledWith({ limite: 20 }));
    expect(await screen.findByText('#7')).toBeInTheDocument();
  });

  it('el carrito arranca vacío con una indicación', async () => {
    render(<VentasPage />);

    expect(
      await screen.findByText('Busque un producto y agréguelo para iniciar la venta.'),
    ).toBeInTheDocument();
  });

  it('busca en bodega y muestra el stock disponible', async () => {
    const usuario = userEvent.setup();
    render(<VentasPage />);

    await usuario.type(screen.getByLabelText('Buscar en bodega'), 'ray');
    await usuario.click(screen.getByRole('button', { name: /^Buscar$/ }));

    await waitFor(() => expect(mockProductos).toHaveBeenCalledWith({ q: 'ray' }));
    expect(await screen.findByText(/10 en bodega/)).toBeInTheDocument();
  });

  it('un producto sin existencias no se puede agregar', async () => {
    mockProductos.mockResolvedValue([producto({ stock: 0 })]);
    const usuario = userEvent.setup();
    render(<VentasPage />);

    await usuario.type(screen.getByLabelText('Buscar en bodega'), 'ray');
    await usuario.click(screen.getByRole('button', { name: /^Buscar$/ }));

    expect(await screen.findByRole('button', { name: /Sin stock/ })).toBeDisabled();
  });

  it('agregar dos veces el mismo producto consolida la línea', async () => {
    const usuario = userEvent.setup();
    render(<VentasPage />);
    await agregarAlCarrito(usuario);
    await usuario.click(screen.getByRole('button', { name: 'Agregar' }));

    // Una sola línea, con cantidad 2: es lo que hace el backend antes de validar.
    expect(screen.getAllByRole('button', { name: /Quitar Ray-Ban Wayfarer del carrito/ })).toHaveLength(1);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('los botones de cantidad suman y restan', async () => {
    const usuario = userEvent.setup();
    render(<VentasPage />);
    await agregarAlCarrito(usuario);

    await usuario.click(screen.getByRole('button', { name: /Agregar una unidad/ }));
    expect(screen.getByText('2')).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: /Quitar una unidad/ }));
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('bajar la cantidad a cero saca la línea del carrito', async () => {
    const usuario = userEvent.setup();
    render(<VentasPage />);
    await agregarAlCarrito(usuario);

    await usuario.click(screen.getByRole('button', { name: /Quitar una unidad/ }));

    expect(
      screen.getByText('Busque un producto y agréguelo para iniciar la venta.'),
    ).toBeInTheDocument();
  });

  it('el bote de basura vacía la línea completa', async () => {
    const usuario = userEvent.setup();
    render(<VentasPage />);
    await agregarAlCarrito(usuario);

    await usuario.click(screen.getByRole('button', { name: /del carrito/ }));

    expect(
      screen.getByText('Busque un producto y agréguelo para iniciar la venta.'),
    ).toBeInTheDocument();
  });

  it('avisa y bloquea el cobro si el carrito pide más de lo que hay', async () => {
    mockProductos.mockResolvedValue([producto({ stock: 1 })]);
    const usuario = userEvent.setup();
    render(<VentasPage />);
    await agregarAlCarrito(usuario);

    await usuario.click(screen.getByRole('button', { name: /Agregar una unidad/ }));

    expect(screen.getByText(/Solo hay 1 en bodega/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Confirmar venta y entrega/ })).toBeDisabled();
  });

  it('registra la venta mandando solo producto y cantidad', async () => {
    mockRegistrar.mockResolvedValue(venta());
    const usuario = userEvent.setup();
    render(<VentasPage />);
    await agregarAlCarrito(usuario);

    await usuario.click(screen.getByRole('button', { name: /Confirmar venta y entrega/ }));

    await waitFor(() =>
      expect(mockRegistrar).toHaveBeenCalledWith({
        idPaciente: undefined,
        detalles: [{ idProducto: 1, cantidad: 1 }],
      }),
    );
  });

  it('confirma con el total del servidor, no con el del carrito', async () => {
    // El carrito mostraría ₡100 (1 × 100); el servidor responde 300.
    mockRegistrar.mockResolvedValue(venta({ total: 300 }));
    const usuario = userEvent.setup();
    render(<VentasPage />);
    await agregarAlCarrito(usuario);

    await usuario.click(screen.getByRole('button', { name: /Confirmar venta y entrega/ }));

    const aviso = await screen.findByRole('status');
    expect(aviso).toHaveTextContent('Venta #7');
    expect(aviso.textContent).toMatch(/300/);
  });

  it('vacía el carrito después de cobrar', async () => {
    mockRegistrar.mockResolvedValue(venta());
    const usuario = userEvent.setup();
    render(<VentasPage />);
    await agregarAlCarrito(usuario);

    await usuario.click(screen.getByRole('button', { name: /Confirmar venta y entrega/ }));

    expect(
      await screen.findByText('Busque un producto y agréguelo para iniciar la venta.'),
    ).toBeInTheDocument();
  });

  it('vincula la venta al paciente elegido', async () => {
    mockRegistrar.mockResolvedValue(venta({ idPaciente: 5, nombrePaciente: 'Ana Rojas' }));
    const usuario = userEvent.setup();
    render(<VentasPage />);
    await agregarAlCarrito(usuario);

    await usuario.selectOptions(screen.getByLabelText('Paciente (opcional)'), '5');
    await usuario.click(screen.getByRole('button', { name: /Confirmar venta y entrega/ }));

    await waitFor(() =>
      expect(mockRegistrar).toHaveBeenCalledWith(
        expect.objectContaining({ idPaciente: 5 }),
      ),
    );
  });

  it('EX-05: muestra el mensaje del backend cuando falta stock', async () => {
    mockRegistrar.mockRejectedValue({
      response: {
        data: {
          message:
            'El producto seleccionado no tiene existencias suficientes para esta venta. RB-2140-51: quedan 2 unidad(es) y se piden 5.',
        },
      },
    });
    const usuario = userEvent.setup();
    render(<VentasPage />);
    await agregarAlCarrito(usuario);

    await usuario.click(screen.getByRole('button', { name: /Confirmar venta y entrega/ }));

    expect(
      await screen.findByText(/no tiene existencias suficientes para esta venta/),
    ).toBeInTheDocument();
  });

  it('al elegir una venta muestra sus líneas y el total cobrado', async () => {
    const usuario = userEvent.setup();
    render(<VentasPage />);

    await usuario.click(await screen.findByText('#7'));

    expect(screen.getByText(/3 × Ray-Ban Wayfarer/)).toBeInTheDocument();
    expect(screen.getByText('Total cobrado')).toBeInTheDocument();
  });

  it('anular exige motivo de al menos tres caracteres', async () => {
    const usuario = userEvent.setup();
    render(<VentasPage />);
    await usuario.click(await screen.findByText('#7'));

    const boton = screen.getByRole('button', { name: /Revertir venta/ });
    expect(boton).toBeDisabled();

    await usuario.type(screen.getByLabelText('Motivo de la anulación *'), 'Devolución');
    expect(boton).toBeEnabled();
  });

  it('revierte la venta y avisa que el stock volvió', async () => {
    mockAnular.mockResolvedValue(venta({ estado: EstadoVenta.ANULADA }));
    const usuario = userEvent.setup();
    render(<VentasPage />);
    await usuario.click(await screen.findByText('#7'));

    await usuario.type(screen.getByLabelText('Motivo de la anulación *'), 'Devolución');
    await usuario.click(screen.getByRole('button', { name: /Revertir venta/ }));

    await waitFor(() =>
      expect(mockAnular).toHaveBeenCalledWith(7, { motivo: 'Devolución' }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent('El stock volvió al inventario');
  });

  it('una venta anulada ya no ofrece revertirse', async () => {
    mockVentas.mockResolvedValue([venta({ estado: EstadoVenta.ANULADA })]);
    const usuario = userEvent.setup();
    render(<VentasPage />);

    await usuario.click(await screen.findByText('#7'));

    expect(screen.queryByRole('button', { name: /Revertir venta/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Esta venta está anulada/)).toBeInTheDocument();
  });

  it('muestra el 409 del backend si la venta tiene orden de laboratorio viva', async () => {
    mockAnular.mockRejectedValue({
      response: {
        data: {
          message:
            'No se puede anular la venta #7: su orden de laboratorio #3 está «En proceso». Cancele primero la orden.',
        },
      },
    });
    const usuario = userEvent.setup();
    render(<VentasPage />);
    await usuario.click(await screen.findByText('#7'));

    await usuario.type(screen.getByLabelText('Motivo de la anulación *'), 'Devolución');
    await usuario.click(screen.getByRole('button', { name: /Revertir venta/ }));

    expect(
      await screen.findByText(/su orden de laboratorio #3 está «En proceso»/),
    ).toBeInTheDocument();
  });

  it('el botón de cerrar oculta el detalle', async () => {
    const usuario = userEvent.setup();
    render(<VentasPage />);
    await usuario.click(await screen.findByText('#7'));

    await usuario.click(screen.getByRole('button', { name: 'Cerrar detalle' }));

    expect(screen.queryByText('Total cobrado')).not.toBeInTheDocument();
  });

  it('avisa si el listado de ventas falla', async () => {
    mockVentas.mockRejectedValue({ response: { data: { message: 'Token inválido' } } });
    render(<VentasPage />);

    expect(await screen.findByText('Token inválido')).toBeInTheDocument();
  });

  it('avisa si la búsqueda en bodega falla', async () => {
    mockProductos.mockRejectedValue({ response: { data: { message: 'Sin conexión' } } });
    const usuario = userEvent.setup();
    render(<VentasPage />);

    await usuario.click(screen.getByRole('button', { name: /^Buscar$/ }));

    expect(await screen.findByText('Sin conexión')).toBeInTheDocument();
  });

  it('que no haya lista de pacientes no impide cobrar de mostrador', async () => {
    mockPersonas.mockRejectedValue(new Error('sin permiso'));
    mockRegistrar.mockResolvedValue(venta());
    const usuario = userEvent.setup();
    render(<VentasPage />);
    await agregarAlCarrito(usuario);

    await usuario.click(screen.getByRole('button', { name: /Confirmar venta y entrega/ }));

    await waitFor(() => expect(mockRegistrar).toHaveBeenCalled());
  });
});
