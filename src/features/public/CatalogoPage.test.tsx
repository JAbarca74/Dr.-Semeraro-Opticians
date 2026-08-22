// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CatalogoPage } from './CatalogoPage';
import {
  listarCatalogo,
  marcasDelCatalogo,
  parametrosPublicos,
} from '../../core/api/catalogo.service';
import { CategoriaProducto } from '../../core/models/inventario';
import type { ProductoVitrina } from '../../core/models/catalogo';

vi.mock('../../core/api/catalogo.service');

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

const vitrina = (cambios: Partial<ProductoVitrina> = {}): ProductoVitrina => ({
  idProducto: 1,
  sku: 'RB-2140-51',
  nombre: 'Ray-Ban Wayfarer',
  marca: 'Ray-Ban',
  categoria: CategoriaProducto.ARO,
  precio: 189.5,
  color: 'Negro',
  material: 'Acetato',
  calibre: null,
  indiceRefraccion: null,
  filtro: null,
  tratamiento: null,
  imagenUrl: null,
  ...cambios,
});

const mockCatalogo = vi.mocked(listarCatalogo);
const mockMarcas = vi.mocked(marcasDelCatalogo);
const mockParametros = vi.mocked(parametrosPublicos);

let abrirVentana: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockCatalogo.mockResolvedValue([vitrina()]);
  mockMarcas.mockResolvedValue(['Ray-Ban', 'Oakley']);
  mockParametros.mockResolvedValue({
    'optica.nombre': 'Óptica Dr. Semeraro',
    'optica.whatsapp': '50688887777',
  });
  abrirVentana = vi.fn(() => ({}) as Window);
  vi.stubGlobal('open', abrirVentana);
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

/** Agrega el primer producto y completa los datos del solicitante. */
const armarApartado = async (usuario: ReturnType<typeof userEvent.setup>) => {
  await usuario.click(await screen.findByRole('button', { name: /Agregar al apartado/ }));
  await usuario.type(screen.getByLabelText('Su nombre *'), 'Ana Rojas');
  await usuario.type(screen.getByLabelText('Su teléfono *'), '8888-1111');
};

describe('CatalogoPage', () => {
  it('carga el catálogo público al entrar', async () => {
    render(<CatalogoPage />);

    await waitFor(() => expect(mockCatalogo).toHaveBeenCalledWith({}));
    expect(await screen.findByText('Ray-Ban Wayfarer')).toBeInTheDocument();
  });

  it('muestra el precio pero nunca existencias', async () => {
    render(<CatalogoPage />);

    expect(await screen.findByText(/189[,.]50/)).toBeInTheDocument();
    expect(screen.queryByText(/en bodega/)).not.toBeInTheDocument();
    expect(screen.queryByText(/stock/i)).not.toBeInTheDocument();
  });

  it('EX-11: sin coincidencias muestra el mensaje del caso de uso', async () => {
    mockCatalogo.mockResolvedValue([]);
    render(<CatalogoPage />);

    expect(await screen.findByText('No hay productos que coincidan')).toBeInTheDocument();
  });

  it('filtra por marca', async () => {
    const usuario = userEvent.setup();
    render(<CatalogoPage />);
    await screen.findByText('Ray-Ban Wayfarer');

    await usuario.selectOptions(screen.getByLabelText('Marca'), 'Oakley');

    await waitFor(() => expect(mockCatalogo).toHaveBeenCalledWith({ marca: 'Oakley' }));
  });

  it('filtra por tipo de producto', async () => {
    const usuario = userEvent.setup();
    render(<CatalogoPage />);
    await screen.findByText('Ray-Ban Wayfarer');

    await usuario.selectOptions(screen.getByLabelText('Tipo'), CategoriaProducto.LENTE);

    await waitFor(() =>
      expect(mockCatalogo).toHaveBeenCalledWith({ categoria: CategoriaProducto.LENTE }),
    );
  });

  it('busca por texto al enviar el formulario', async () => {
    const usuario = userEvent.setup();
    render(<CatalogoPage />);
    await screen.findByText('Ray-Ban Wayfarer');

    await usuario.type(screen.getByLabelText('Buscar modelo'), 'wayfarer');
    await usuario.click(screen.getByRole('button', { name: /Buscar/ }));

    await waitFor(() => expect(mockCatalogo).toHaveBeenCalledWith({ q: 'wayfarer' }));
  });

  it('un producto sin foto lo dice, no deja un hueco', async () => {
    render(<CatalogoPage />);
    expect(await screen.findByText('Sin fotografía')).toBeInTheDocument();
  });

  it('un producto con foto la muestra con alt descriptivo', async () => {
    mockCatalogo.mockResolvedValue([vitrina({ imagenUrl: 'https://ejemplo/aro.jpg' })]);
    render(<CatalogoPage />);

    const img = await screen.findByAltText('Ray-Ban Wayfarer de Ray-Ban');
    expect(img).toHaveAttribute('src', 'https://ejemplo/aro.jpg');
  });

  it('el apartado arranca vacío con una indicación', async () => {
    render(<CatalogoPage />);
    expect(
      await screen.findByText(/Agregue los modelos que le interesen/),
    ).toBeInTheDocument();
  });

  it('agregar dos veces el mismo modelo suma la cantidad', async () => {
    const usuario = userEvent.setup();
    render(<CatalogoPage />);
    const boton = await screen.findByRole('button', { name: /Agregar al apartado/ });

    await usuario.click(boton);
    await usuario.click(boton);

    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('el botón de solicitar está bloqueado hasta dar nombre y teléfono', async () => {
    const usuario = userEvent.setup();
    render(<CatalogoPage />);
    await usuario.click(await screen.findByRole('button', { name: /Agregar al apartado/ }));

    const boton = screen.getByRole('button', { name: /Solicitar por WhatsApp/ });
    expect(boton).toBeDisabled();

    await usuario.type(screen.getByLabelText('Su nombre *'), 'Ana Rojas');
    await usuario.type(screen.getByLabelText('Su teléfono *'), '8888-1111');
    expect(boton).toBeEnabled();
  });

  it('abre WhatsApp con el mensaje completo y los datos del cliente', async () => {
    const usuario = userEvent.setup();
    render(<CatalogoPage />);
    await armarApartado(usuario);

    await usuario.click(screen.getByRole('button', { name: /Solicitar por WhatsApp/ }));

    expect(abrirVentana).toHaveBeenCalledTimes(1);
    const url = decodeURIComponent(abrirVentana.mock.calls[0][0] as string);
    expect(url).toContain('wa.me/50688887777');
    expect(url).toContain('Ana Rojas');
    expect(url).toContain('8888-1111');
    expect(url).toContain('Ray-Ban Wayfarer');
    expect(url).toContain('Óptica Dr. Semeraro');
  });

  it('EX-13: si el navegador bloquea la ventana, da el número para llamar', async () => {
    abrirVentana.mockReturnValue(null);
    const usuario = userEvent.setup();
    render(<CatalogoPage />);
    await armarApartado(usuario);

    await usuario.click(screen.getByRole('button', { name: /Solicitar por WhatsApp/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo abrir WhatsApp. Por favor contáctenos al 8888-7777.',
    );
  });

  it('sin número configurado avisa en vez de abrir una URL rota', async () => {
    mockParametros.mockResolvedValue({ 'optica.nombre': 'Óptica Dr. Semeraro' });
    const usuario = userEvent.setup();
    render(<CatalogoPage />);
    await armarApartado(usuario);

    await usuario.click(screen.getByRole('button', { name: /Solicitar por WhatsApp/ }));

    expect(abrirVentana).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No hay un número de WhatsApp configurado',
    );
  });

  it('quitar la última unidad saca la línea del apartado', async () => {
    const usuario = userEvent.setup();
    render(<CatalogoPage />);
    await usuario.click(await screen.findByRole('button', { name: /Agregar al apartado/ }));

    await usuario.click(screen.getByRole('button', { name: /Quitar una unidad/ }));

    expect(screen.getByText(/Agregue los modelos que le interesen/)).toBeInTheDocument();
  });

  it('el bote de basura vacía la línea completa', async () => {
    const usuario = userEvent.setup();
    render(<CatalogoPage />);
    const boton = await screen.findByRole('button', { name: /Agregar al apartado/ });
    await usuario.click(boton);
    await usuario.click(boton);

    await usuario.click(screen.getByRole('button', { name: /del apartado/ }));

    expect(screen.getByText(/Agregue los modelos que le interesen/)).toBeInTheDocument();
  });

  it('el detalle muestra las fichas técnicas que el producto sí tiene', async () => {
    mockCatalogo.mockResolvedValue([
      vitrina({ calibre: 51, filtro: 'Polarizado', material: 'Acetato' }),
    ]);
    const usuario = userEvent.setup();
    render(<CatalogoPage />);

    await usuario.click(await screen.findByRole('button', { name: /Ver detalle/ }));

    const dialogo = await screen.findByRole('dialog');
    expect(dialogo).toHaveTextContent('51 mm');
    expect(dialogo).toHaveTextContent('Polarizado');
    // Los campos vacíos no se pintan: una ficha con «—» por todo lado no informa.
    expect(dialogo).not.toHaveTextContent('Índice de refracción');
  });

  it('desde el detalle se agrega y se cierra el modal', async () => {
    const usuario = userEvent.setup();
    render(<CatalogoPage />);
    await usuario.click(await screen.findByRole('button', { name: /Ver detalle/ }));

    const dialogo = await screen.findByRole('dialog');
    await usuario.click(
      within(dialogo).getByRole('button', { name: /Agregar al apartado/ }),
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('avisa si el catálogo no se puede cargar', async () => {
    mockCatalogo.mockRejectedValue({
      response: { data: { message: 'Servicio no disponible' } },
    });
    render(<CatalogoPage />);

    expect(await screen.findByText('Servicio no disponible')).toBeInTheDocument();
  });

  it('que fallen marcas o parámetros no impide ver la vitrina', async () => {
    mockMarcas.mockRejectedValue(new Error('sin marcas'));
    mockParametros.mockRejectedValue(new Error('sin parámetros'));
    render(<CatalogoPage />);

    expect(await screen.findByText('Ray-Ban Wayfarer')).toBeInTheDocument();
  });
});
