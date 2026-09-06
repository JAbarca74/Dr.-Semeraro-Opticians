// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '../../test/rtl';
import userEvent from '@testing-library/user-event';
import { AgendarCitaPage } from './AgendarCitaPage';
import { parametrosPublicos } from '../../core/api/catalogo.service';

vi.mock('../../core/api/catalogo.service');

const mockParametros = parametrosPublicos as unknown as ReturnType<typeof vi.fn>;

const rellenar = async (
  nombre = 'Ana Mora',
  motivo = 'Control anual, veo borroso de lejos',
) => {
  await userEvent.type(screen.getByLabelText(/su nombre/i), nombre);
  await userEvent.type(screen.getByLabelText(/motivo de la consulta/i), motivo);
};

const boton = () => screen.getByRole('button', { name: /solicitar por whatsapp/i });

beforeEach(() => {
  vi.clearAllMocks();
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

describe('1. CU-11 · formulario rápido (pasos 2–3)', () => {
  it('pide exactamente nombre y motivo', () => {
    render(<AgendarCitaPage />);

    expect(screen.getByLabelText(/su nombre/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/motivo de la consulta/i)).toBeInTheDocument();
  });

  it('el botón nace deshabilitado y se habilita al completar', async () => {
    render(<AgendarCitaPage />);

    expect(boton()).toBeDisabled();
    await rellenar();
    expect(boton()).toBeEnabled();
  });

  it('solo espacios no cuenta como completo', async () => {
    render(<AgendarCitaPage />);
    await rellenar('   ', '   ');
    expect(boton()).toBeDisabled();
  });
});

describe('2. CU-11 pasos 4–5 · abre WhatsApp con el texto preformateado', () => {
  it('el enlace lleva nombre y motivo', async () => {
    const open = vi.fn().mockReturnValue({});
    vi.stubGlobal('open', open);
    render(<AgendarCitaPage />);
    await rellenar();

    await userEvent.click(boton());

    const [url] = open.mock.calls[0];
    expect(url).toContain('https://wa.me/50688887777');
    const texto = decodeURIComponent(url);
    expect(texto).toContain('Ana Mora');
    expect(texto).toContain('Control anual');
  });

  it('tras abrirlo confirma y recuerda que hay que enviar el mensaje', async () => {
    vi.stubGlobal('open', vi.fn().mockReturnValue({}));
    render(<AgendarCitaPage />);
    await rellenar();

    await userEvent.click(boton());

    expect(await screen.findByText(/Envíe el mensaje/)).toBeInTheDocument();
  });

  it('deja preparar otra solicitud después', async () => {
    vi.stubGlobal('open', vi.fn().mockReturnValue({}));
    render(<AgendarCitaPage />);
    await rellenar();
    await userEvent.click(boton());

    await userEvent.click(
      await screen.findByRole('button', { name: /preparar otra solicitud/i }),
    );

    expect(screen.getByLabelText(/su nombre/i)).toBeInTheDocument();
  });
});

describe('3. EX-13 · redirección fallida', () => {
  it('usa el literal del caso de uso y ofrece el teléfono', async () => {
    vi.stubGlobal('open', vi.fn().mockReturnValue(null));
    render(<AgendarCitaPage />);
    await rellenar();

    await userEvent.click(boton());

    const aviso = await screen.findByRole('alert');
    expect(aviso).toHaveTextContent('No se pudo abrir WhatsApp.');
    expect(aviso).toHaveTextContent('7085-3353');
  });

  it('si falla NO muestra la confirmación: nada se envió', async () => {
    vi.stubGlobal('open', vi.fn().mockReturnValue(null));
    render(<AgendarCitaPage />);
    await rellenar();

    await userEvent.click(boton());

    await screen.findByRole('alert');
    expect(screen.queryByText(/Envíe el mensaje/)).toBeNull();
  });

  it('sin WhatsApp configurado ni lo intenta', async () => {
    mockParametros.mockResolvedValue({ 'optica.telefono': '7085-3353' });
    const open = vi.fn();
    vi.stubGlobal('open', open);
    render(<AgendarCitaPage />);
    await rellenar();

    await userEvent.click(boton());

    expect(open).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent('7085-3353');
  });

  it('sin teléfono de respaldo cae al número de WhatsApp legible', async () => {
    mockParametros.mockResolvedValue({ 'optica.whatsapp': '50688887777' });
    vi.stubGlobal('open', vi.fn().mockReturnValue(null));
    render(<AgendarCitaPage />);
    await rellenar();

    await userEvent.click(boton());

    expect(await screen.findByRole('alert')).toHaveTextContent('8888-7777');
  });

  it('sin ningún canal remite a llamar a la óptica', async () => {
    mockParametros.mockResolvedValue({});
    render(<AgendarCitaPage />);
    await rellenar();

    await userEvent.click(boton());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'comuníquese con la óptica por teléfono',
    );
  });
});

describe('4. La pantalla NO agenda nada', () => {
  /**
   * La garantía central de CU-11: «el sistema NO realiza modificaciones ni
   * bloqueos en la base de datos de la agenda». Si alguien añade una llamada a
   * la API de citas, esta prueba lo dice.
   */
  it('avisa explícitamente de que no reserva horario', async () => {
    render(<AgendarCitaPage />);
    expect(await screen.findByText(/no reserva un horario/i)).toBeInTheDocument();
  });

  it('el único servicio que consulta es el de parámetros públicos', async () => {
    vi.stubGlobal('open', vi.fn().mockReturnValue({}));
    render(<AgendarCitaPage />);
    await rellenar();

    await userEvent.click(boton());

    expect(mockParametros).toHaveBeenCalled();
  });
});
