// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InventarioPage } from './InventarioPage';
import {
  actualizarProducto,
  ajustarStock,
  crearProducto,
  listarProductos,
  movimientosDeProducto,
  registrarEntrada,
} from '../../core/api/inventario.service';
import {
  CategoriaProducto,
  TipoMovimiento,
  type MovimientoInventario,
  type Producto,
} from '../../core/models/inventario';

vi.mock('../../core/api/inventario.service');

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
  precio: 189.5,
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

const asiento = (cambios: Partial<MovimientoInventario> = {}): MovimientoInventario => ({
  idMovimientoInventario: 99,
  idProducto: 1,
  idUsuario: 7,
  tipo: TipoMovimiento.ENTRADA,
  cantidad: 6,
  stockAntes: 10,
  stockDespues: 16,
  referencia: 'FAC-001',
  createdAt: '2026-08-21T10:00:00.000Z',
  ...cambios,
});

const mockListar = vi.mocked(listarProductos);
const mockKardex = vi.mocked(movimientosDeProducto);
const mockEntrada = vi.mocked(registrarEntrada);
const mockAjuste = vi.mocked(ajustarStock);
const mockCrear = vi.mocked(crearProducto);
const mockActualizar = vi.mocked(actualizarProducto);

beforeEach(() => {
  vi.clearAllMocks();
  mockListar.mockResolvedValue([producto()]);
  mockKardex.mockResolvedValue([]);
});

afterEach(cleanup);

const abrirDetalle = async (usuario: ReturnType<typeof userEvent.setup>) => {
  await waitFor(() => expect(screen.getByText('Ray-Ban Wayfarer')).toBeInTheDocument());
  await usuario.click(screen.getByText('Ray-Ban Wayfarer'));
  await waitFor(() => expect(mockKardex).toHaveBeenCalledWith(1));
};

describe('InventarioPage', () => {
  it('carga el inventario al entrar', async () => {
    render(<InventarioPage />);

    await waitFor(() => expect(mockListar).toHaveBeenCalledWith({}));
    expect(await screen.findByText('RB-2140-51')).toBeInTheDocument();
  });

  it('muestra el precio en colones, no un número suelto', async () => {
    render(<InventarioPage />);

    const celda = await screen.findByText(/189[.,]50/);
    expect(celda.textContent).toMatch(/[₡]|CRC/);
  });

  it('marca los productos por debajo del umbral', async () => {
    mockListar.mockResolvedValue([producto({ stock: 2, bajoStock: true })]);
    render(<InventarioPage />);

    expect(await screen.findByText('Bajo')).toBeInTheDocument();
    expect(
      screen.getByText(/1 producto\(s\) en o por debajo de su umbral mínimo/),
    ).toBeInTheDocument();
  });

  it('el filtro de bajo stock lo resuelve la API, no la pantalla', async () => {
    const usuario = userEvent.setup();
    render(<InventarioPage />);
    await screen.findByText('RB-2140-51');

    await usuario.click(screen.getByLabelText('Solo bajo stock'));

    await waitFor(() => expect(mockListar).toHaveBeenCalledWith({ bajoStock: true }));
  });

  it('filtra por categoría', async () => {
    const usuario = userEvent.setup();
    render(<InventarioPage />);
    await screen.findByText('RB-2140-51');

    await usuario.selectOptions(screen.getByLabelText('Categoría'), CategoriaProducto.LENTE);

    await waitFor(() =>
      expect(mockListar).toHaveBeenCalledWith({ categoria: CategoriaProducto.LENTE }),
    );
  });

  it('busca por texto libre al enviar el formulario', async () => {
    const usuario = userEvent.setup();
    render(<InventarioPage />);
    await screen.findByText('RB-2140-51');

    await usuario.type(screen.getByLabelText('Buscar'), 'ray');
    await usuario.click(screen.getByRole('button', { name: /Buscar/ }));

    await waitFor(() => expect(mockListar).toHaveBeenCalledWith({ q: 'ray' }));
  });

  it('sin resultados avisa en vez de dejar la tabla muda', async () => {
    mockListar.mockResolvedValue([]);
    render(<InventarioPage />);

    expect(
      await screen.findByText('No hay productos con estos filtros.'),
    ).toBeInTheDocument();
  });

  it('al seleccionar un producto carga su kardex', async () => {
    mockKardex.mockResolvedValue([asiento({ referencia: 'ALTA-PRODUCTO' })]);
    const usuario = userEvent.setup();
    render(<InventarioPage />);
    await abrirDetalle(usuario);

    expect(screen.getByText('+6')).toBeInTheDocument();
    expect(screen.getByText('10 → 16')).toBeInTheDocument();
    expect(screen.getByText('ALTA-PRODUCTO')).toBeInTheDocument();
  });

  it('registra una entrada de mercadería', async () => {
    mockEntrada.mockResolvedValue(asiento());
    const usuario = userEvent.setup();
    render(<InventarioPage />);
    await abrirDetalle(usuario);

    await usuario.type(screen.getByLabelText('Cantidad entrante *'), '6');
    await usuario.type(screen.getByLabelText('Referencia'), 'FAC-001');
    await usuario.click(screen.getByRole('button', { name: /Registrar movimiento/ }));

    await waitFor(() =>
      expect(mockEntrada).toHaveBeenCalledWith(1, {
        cantidad: 6,
        referencia: 'FAC-001',
      }),
    );
    expect(await screen.findByRole('status')).toHaveTextContent('10 → 16');
  });

  it('una entrada sin referencia no manda cadena vacía', async () => {
    mockEntrada.mockResolvedValue(asiento({ referencia: null }));
    const usuario = userEvent.setup();
    render(<InventarioPage />);
    await abrirDetalle(usuario);

    await usuario.type(screen.getByLabelText('Cantidad entrante *'), '2');
    await usuario.click(screen.getByRole('button', { name: /Registrar movimiento/ }));

    await waitFor(() =>
      expect(mockEntrada).toHaveBeenCalledWith(1, {
        cantidad: 2,
        referencia: undefined,
      }),
    );
  });

  it('el ajuste pide el conteo físico real, no la diferencia', async () => {
    mockAjuste.mockResolvedValue(
      asiento({ tipo: TipoMovimiento.AJUSTE, cantidad: -3, stockDespues: 7 }),
    );
    const usuario = userEvent.setup();
    render(<InventarioPage />);
    await abrirDetalle(usuario);

    await usuario.click(screen.getByRole('button', { name: /Ajuste/ }));
    const campo = screen.getByLabelText('Conteo físico real *');
    expect(campo).toHaveValue(10);

    await usuario.clear(campo);
    await usuario.type(campo, '7');
    await usuario.type(screen.getByLabelText('Motivo *'), 'Conteo de agosto');
    await usuario.click(screen.getByRole('button', { name: /Registrar movimiento/ }));

    await waitFor(() =>
      expect(mockAjuste).toHaveBeenCalledWith(1, {
        stockFinal: 7,
        motivo: 'Conteo de agosto',
      }),
    );
  });

  it('EX-04: muestra el mensaje del backend cuando el SKU está repetido', async () => {
    mockCrear.mockRejectedValue({
      response: { data: { message: 'Ya existe un producto con el SKU «RB-2140-51».' } },
    });
    const usuario = userEvent.setup();
    render(<InventarioPage />);
    await screen.findByText('RB-2140-51');

    await usuario.click(screen.getByRole('button', { name: /Nuevo producto/ }));
    await usuario.type(screen.getByLabelText('SKU *'), 'rb-2140-51');
    await usuario.type(screen.getByLabelText('Nombre *'), 'Wayfarer');
    await usuario.type(screen.getByLabelText('Marca *'), 'Ray-Ban');
    await usuario.type(screen.getByLabelText('Precio (₡) *'), '189.5');
    await usuario.click(screen.getByRole('button', { name: /Dar de alta/ }));

    expect(await screen.findByText('Ya existe un producto con el SKU «RB-2140-51».')).toBeInTheDocument();
  });

  it('el SKU se normaliza a mayúsculas antes de guardarlo', async () => {
    mockCrear.mockResolvedValue(producto({ stock: 4 }));
    const usuario = userEvent.setup();
    render(<InventarioPage />);
    await screen.findByText('RB-2140-51');

    await usuario.click(screen.getByRole('button', { name: /Nuevo producto/ }));
    await usuario.type(screen.getByLabelText('SKU *'), '  ok-1 ');
    await usuario.type(screen.getByLabelText('Nombre *'), 'Wayfarer');
    await usuario.type(screen.getByLabelText('Marca *'), 'Ray-Ban');
    await usuario.type(screen.getByLabelText('Precio (₡) *'), '100');
    await usuario.click(screen.getByRole('button', { name: /Dar de alta/ }));

    await waitFor(() =>
      expect(mockCrear).toHaveBeenCalledWith(
        expect.objectContaining({ sku: 'OK-1', precio: 100 }),
      ),
    );
    expect(await screen.findByRole('status')).toHaveTextContent('4 unidad(es)');
  });

  it('cancelar el alta cierra el formulario sin crear nada', async () => {
    const usuario = userEvent.setup();
    render(<InventarioPage />);
    await screen.findByText('RB-2140-51');

    await usuario.click(screen.getByRole('button', { name: /Nuevo producto/ }));
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByLabelText('SKU *')).not.toBeInTheDocument();
    expect(mockCrear).not.toHaveBeenCalled();
  });

  it('el botón de cerrar oculta el detalle', async () => {
    const usuario = userEvent.setup();
    render(<InventarioPage />);
    await abrirDetalle(usuario);

    await usuario.click(screen.getByRole('button', { name: 'Cerrar detalle' }));

    expect(
      screen.getByText('Seleccione un producto para mover existencias y ver su kardex.'),
    ).toBeInTheDocument();
  });

  it('CU-03: se pueden corregir los datos maestros, incluido el umbral', async () => {
    mockActualizar.mockResolvedValue(producto({ precio: 210, umbralMinimo: 8 }));
    const usuario = userEvent.setup();
    render(<InventarioPage />);
    await abrirDetalle(usuario);

    await usuario.click(screen.getByRole('button', { name: 'Editar datos del producto' }));

    const precio = screen.getByLabelText('Precio (₡) *');
    await usuario.clear(precio);
    await usuario.type(precio, '210');
    const umbral = screen.getByLabelText('Umbral mínimo');
    await usuario.clear(umbral);
    await usuario.type(umbral, '8');
    await usuario.click(screen.getByRole('button', { name: /Guardar cambios/ }));

    await waitFor(() =>
      expect(mockActualizar).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ precio: 210, umbralMinimo: 8 }),
      ),
    );
    expect(await screen.findByRole('status')).toHaveTextContent('actualizado');
  });

  it('la edición NUNCA manda stock: eso rompería el kardex', async () => {
    mockActualizar.mockResolvedValue(producto());
    const usuario = userEvent.setup();
    render(<InventarioPage />);
    await abrirDetalle(usuario);

    await usuario.click(screen.getByRole('button', { name: 'Editar datos del producto' }));
    // El formulario ni siquiera ofrece el campo.
    expect(screen.queryByLabelText(/^Existencias/)).not.toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: /Guardar cambios/ }));

    await waitFor(() => expect(mockActualizar).toHaveBeenCalled());
    expect(mockActualizar.mock.calls[0][1]).not.toHaveProperty('stock');
  });

  it('vaciar la imagen manda cadena vacía, que el backend lee como «bórrala»', async () => {
    mockListar.mockResolvedValue([producto({ imagenUrl: 'https://ejemplo/aro.jpg' })]);
    mockActualizar.mockResolvedValue(producto({ imagenUrl: null }));
    const usuario = userEvent.setup();
    render(<InventarioPage />);
    await abrirDetalle(usuario);

    await usuario.click(screen.getByRole('button', { name: 'Editar datos del producto' }));
    await usuario.clear(screen.getByLabelText('Imagen (URL)'));
    await usuario.click(screen.getByRole('button', { name: /Guardar cambios/ }));

    await waitFor(() =>
      expect(mockActualizar).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ imagenUrl: '' }),
      ),
    );
  });

  it('cancelar la edición no guarda nada', async () => {
    const usuario = userEvent.setup();
    render(<InventarioPage />);
    await abrirDetalle(usuario);

    await usuario.click(screen.getByRole('button', { name: 'Editar datos del producto' }));
    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByLabelText('Precio (₡) *')).not.toBeInTheDocument();
    expect(mockActualizar).not.toHaveBeenCalled();
  });

  it('EX-04 también al corregir el SKU', async () => {
    mockActualizar.mockRejectedValue({
      response: { data: { message: 'Ya existe un producto con el SKU «OK-1».' } },
    });
    const usuario = userEvent.setup();
    render(<InventarioPage />);
    await abrirDetalle(usuario);

    await usuario.click(screen.getByRole('button', { name: 'Editar datos del producto' }));
    await usuario.click(screen.getByRole('button', { name: /Guardar cambios/ }));

    expect(
      await screen.findByText('Ya existe un producto con el SKU «OK-1».'),
    ).toBeInTheDocument();
  });

  it('avisa si el inventario no se puede cargar', async () => {
    mockListar.mockRejectedValue({ response: { data: { message: 'Token inválido' } } });
    render(<InventarioPage />);

    expect(await screen.findByText('Token inválido')).toBeInTheDocument();
  });

  it('avisa si el kardex no se puede cargar', async () => {
    mockKardex.mockRejectedValue({
      response: { data: { message: 'Producto no encontrado.' } },
    });
    const usuario = userEvent.setup();
    render(<InventarioPage />);
    await waitFor(() => expect(screen.getByText('Ray-Ban Wayfarer')).toBeInTheDocument());
    await usuario.click(screen.getByText('Ray-Ban Wayfarer'));

    expect(await screen.findByText('Producto no encontrado.')).toBeInTheDocument();
  });

  it('avisa si el movimiento es rechazado', async () => {
    mockEntrada.mockRejectedValue({
      response: { data: { message: 'La cantidad de la entrada debe ser al menos 1.' } },
    });
    const usuario = userEvent.setup();
    render(<InventarioPage />);
    await abrirDetalle(usuario);

    await usuario.type(screen.getByLabelText('Cantidad entrante *'), '1');
    await usuario.click(screen.getByRole('button', { name: /Registrar movimiento/ }));

    expect(
      await screen.findByText('La cantidad de la entrada debe ser al menos 1.'),
    ).toBeInTheDocument();
  });
});
