// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '../../test/rtl';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PerfilEspecialistaPage } from './PerfilEspecialistaPage';
import { listarEspecialistas } from '../../core/api/especialistas.service';
import { parametrosPublicos } from '../../core/api/catalogo.service';
import type { EspecialistaVitrina } from '../../core/models/especialista';

vi.mock('../../core/api/especialistas.service');
vi.mock('../../core/api/catalogo.service');

vi.mock('framer-motion', async () => {
  const react = await import('react');
  const PROPS_ANIMACION = ['initial', 'animate', 'exit', 'variants', 'transition', 'whileInView', 'viewport'];
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

const perfil = (
  cambios: Partial<EspecialistaVitrina> = {},
): EspecialistaVitrina => ({
  idPerfilEspecialista: 1,
  nombre: 'Luigi Semeraro Román',
  titulo: 'Optometrista',
  codigoProfesional: '066-120',
  aniosExperiencia: null,
  biografia: 'Dirección clínica de la óptica.',
  filosofia: null,
  fotoUrl: '/dr-luigi-semeraro.jpg',
  especialidades: ['Optometría clínica', 'Diagnóstico refractivo'],
  ...cambios,
});

const mockListar = listarEspecialistas as unknown as ReturnType<typeof vi.fn>;
const mockParametros = parametrosPublicos as unknown as ReturnType<typeof vi.fn>;

const pintar = () =>
  render(
    <MemoryRouter>
      <PerfilEspecialistaPage />
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockListar.mockResolvedValue([perfil()]);
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

describe('1. Los datos salen de la base, no del componente', () => {
  it('muestra nombre, título y código profesional del perfil recibido', async () => {
    pintar();

    expect(await screen.findByText('Luigi Semeraro Román')).toBeInTheDocument();
    expect(screen.getByText(/Cód\. 066-120/)).toBeInTheDocument();
    expect(screen.getAllByText('Optometrista').length).toBeGreaterThan(0);
  });

  it('pinta las especialidades que vienen de la API', async () => {
    pintar();

    expect(await screen.findByText('Optometría clínica')).toBeInTheDocument();
    expect(screen.getByText('Diagnóstico refractivo')).toBeInTheDocument();
  });

  /**
   * Blindaje del hallazgo §3.9: la página llevaba «Licencia médica COPT-4421»
   * escrito a mano junto a la foto real del doctor. Si alguien lo reintroduce,
   * esta prueba lo dice.
   */
  it('NO contiene el código inventado que tenía escrito a mano', async () => {
    const { container } = pintar();

    await screen.findByText('Luigi Semeraro Román');
    expect(container.textContent).not.toContain('COPT-4421');
  });

  it('sin código profesional, la línea de colegiatura no se pinta', async () => {
    mockListar.mockResolvedValue([perfil({ codigoProfesional: null })]);
    const { container } = pintar();

    await screen.findByText('Luigi Semeraro Román');
    expect(container.textContent).not.toContain('Cód.');
  });

  it('sin frase propia no aparece ninguna cita entrecomillada', async () => {
    const { container } = pintar();

    await screen.findByText('Luigi Semeraro Román');
    expect(container.textContent).not.toContain('“');
  });

  it('con frase propia sí la muestra entrecomillada', async () => {
    mockListar.mockResolvedValue([perfil({ filosofia: 'Cada dioptría cuenta.' })]);
    pintar();

    expect(await screen.findByText(/Cada dioptría cuenta\./)).toBeInTheDocument();
  });

  it('sin años de experiencia no inventa un «0 años»', async () => {
    const { container } = pintar();

    await screen.findByText('Luigi Semeraro Román');
    expect(container.textContent).not.toContain('años de experiencia');
  });

  it('con años de experiencia los muestra', async () => {
    mockListar.mockResolvedValue([perfil({ aniosExperiencia: 12 })]);
    pintar();

    expect(await screen.findByText('12 años de experiencia')).toBeInTheDocument();
  });

  it('sin fotografía muestra el marcador, no una imagen rota', async () => {
    mockListar.mockResolvedValue([perfil({ fotoUrl: null })]);
    pintar();

    expect(await screen.findByText('Sin fotografía')).toBeInTheDocument();
  });
});

describe('2. CU-13 pasos 4–6 · canal de WhatsApp', () => {
  it('el botón está visible', async () => {
    pintar();

    expect(
      await screen.findByRole('button', { name: /agendar o consultar por whatsapp/i }),
    ).toBeInTheDocument();
  });

  it('al pulsarlo abre wa.me con el mensaje predefinido', async () => {
    const open = vi.fn().mockReturnValue({});
    vi.stubGlobal('open', open);
    pintar();

    await userEvent.click(
      await screen.findByRole('button', { name: /agendar o consultar/i }),
    );

    expect(open).toHaveBeenCalledTimes(1);
    const [url] = open.mock.calls[0];
    expect(url).toContain('https://wa.me/50688887777');
    expect(decodeURIComponent(url)).toContain(
      'me gustaría agendar una cita o consultar sobre mis lentes',
    );
  });
});

describe('3. EX-15 · enlace de WhatsApp no disponible', () => {
  it('si el navegador bloquea la ventana, muestra el teléfono del consultorio', async () => {
    vi.stubGlobal('open', vi.fn().mockReturnValue(null));
    pintar();

    await userEvent.click(
      await screen.findByRole('button', { name: /agendar o consultar/i }),
    );

    const aviso = await screen.findByRole('alert');
    expect(aviso).toHaveTextContent('Canal no disponible.');
    expect(aviso).toHaveTextContent('7085-3353');
  });

  it('si no hay WhatsApp configurado, ni siquiera intenta abrirlo', async () => {
    mockParametros.mockResolvedValue({
      'optica.nombre': 'Óptica Dr. Semeraro',
      'optica.telefono': '7085-3353',
    });
    const open = vi.fn();
    vi.stubGlobal('open', open);
    pintar();

    await userEvent.click(
      await screen.findByRole('button', { name: /agendar o consultar/i }),
    );

    expect(open).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Canal no disponible. Llámenos al 7085-3353.',
    );
  });

  it('sin teléfono de respaldo, cae al número de WhatsApp legible', async () => {
    mockParametros.mockResolvedValue({ 'optica.whatsapp': '50688887777' });
    vi.stubGlobal('open', vi.fn().mockReturnValue(null));
    pintar();

    await userEvent.click(
      await screen.findByRole('button', { name: /agendar o consultar/i }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent('8888-7777');
  });

  it('sin ningún canal configurado, remite a llamar a la óptica', async () => {
    mockParametros.mockResolvedValue({});
    pintar();

    await userEvent.click(
      await screen.findByRole('button', { name: /agendar o consultar/i }),
    );

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'comuníquese con la óptica por teléfono',
    );
  });

  it('si los parámetros públicos fallan, la ficha se sigue viendo', async () => {
    mockParametros.mockRejectedValue(new Error('sin red'));
    pintar();

    expect(await screen.findByText('Luigi Semeraro Román')).toBeInTheDocument();
  });
});

describe('4. Flujos alternos y estados vacíos', () => {
  it('ofrece iniciar sesión y activar la cuenta mediante invitación', async () => {
    pintar();

    await screen.findByText('Luigi Semeraro Román');
    expect(screen.getByRole('link', { name: /inicie sesión/i })).toHaveAttribute(
      'href',
      '/login',
    );
    expect(screen.getByRole('link', { name: /active su cuenta mediante la invitación/i })).toHaveAttribute(
      'href',
      '/registro',
    );
  });

  it('sin ningún perfil publicado lo dice, no deja la página en blanco', async () => {
    mockListar.mockResolvedValue([]);
    pintar();

    expect(
      await screen.findByText('El perfil del especialista aún no está publicado.'),
    ).toBeInTheDocument();
  });

  it('si la API falla, muestra el error', async () => {
    mockListar.mockRejectedValue(new Error('caído'));
    pintar();

    await waitFor(() =>
      expect(screen.getByRole('alert')).toBeInTheDocument(),
    );
  });

  it('un perfil sin especialidades no pinta la rejilla', async () => {
    mockListar.mockResolvedValue([perfil({ especialidades: [] })]);
    const { container } = pintar();

    await screen.findByText('Luigi Semeraro Román');
    expect(container.textContent).not.toContain('Optometría clínica');
  });

  it('un perfil sin biografía no rompe el encabezado', async () => {
    mockListar.mockResolvedValue([perfil({ biografia: null })]);
    pintar();

    expect(await screen.findByText('Luigi Semeraro Román')).toBeInTheDocument();
  });
});
