// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '../../test/rtl';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RegistroPage } from './RegistroPage';
import { registrarPacienteRequest } from '../../core/auth/auth.service';
import { Rol } from '../../core/models/rol';

vi.mock('../../core/auth/auth.service');

const navegar = vi.fn();
vi.mock('react-router-dom', async () => {
  const real = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom',
  );
  return { ...real, useNavigate: () => navegar };
});

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

const mockRegistrar = registrarPacienteRequest as unknown as ReturnType<typeof vi.fn>;

const pintar = () =>
  render(
    <MemoryRouter>
      <RegistroPage />
    </MemoryRouter>,
  );

/** Rellena el formulario con datos válidos; `cambios` sobreescribe campos. */
const rellenar = async (cambios: Record<string, string> = {}) => {
  const valores: Record<string, string> = {
    cedula: '1-4000-0001',
    nombre: 'Ana Lucía Mora',
    correo: 'ana@example.com',
    password: 'clave12345',
    confirmacion: 'clave12345',
    ...cambios,
  };
  for (const [id, valor] of Object.entries(valores)) {
    if (!valor) continue;
    await userEvent.type(document.getElementById(id) as HTMLElement, valor);
  }
};

const botonCrear = () => screen.getByRole('button', { name: /crear cuenta/i });

beforeEach(() => {
  vi.clearAllMocks();
  mockRegistrar.mockResolvedValue({
    idUsuario: 11,
    email: 'ana@example.com',
    rol: Rol.PACIENTE,
  });
});

afterEach(cleanup);

describe('1. Formulario (CU-10 pasos 2–3)', () => {
  it('pide los cuatro campos que enumera el caso de uso', () => {
    pintar();

    expect(screen.getByLabelText(/cédula/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^contraseña/i)).toBeInTheDocument();
  });

  it('el botón nace deshabilitado, con el formulario vacío', () => {
    pintar();
    expect(botonCrear()).toBeDisabled();
  });

  it('con los datos completos se habilita', async () => {
    pintar();
    await rellenar();
    expect(botonCrear()).toBeEnabled();
  });

  it('el teléfono es opcional: sin él se puede enviar', async () => {
    pintar();
    await rellenar();

    await userEvent.click(botonCrear());

    expect(mockRegistrar).toHaveBeenCalledWith(
      expect.not.objectContaining({ telefono: expect.anything() }),
    );
  });

  it('el teléfono viaja cuando se escribe', async () => {
    pintar();
    await rellenar();
    await userEvent.type(document.getElementById('telefono') as HTMLElement, '8888-7777');

    await userEvent.click(botonCrear());

    expect(mockRegistrar).toHaveBeenCalledWith(
      expect.objectContaining({ telefono: '8888-7777' }),
    );
  });

  it('recorta los espacios de los campos de texto', async () => {
    pintar();
    await rellenar({ nombre: '  Ana Lucía Mora  ' });

    await userEvent.click(botonCrear());

    expect(mockRegistrar).toHaveBeenCalledWith(
      expect.objectContaining({ nombre: 'Ana Lucía Mora' }),
    );
  });
});

describe('2. Validación en pantalla', () => {
  it('una contraseña corta se avisa y bloquea el envío', async () => {
    pintar();
    await rellenar({ password: 'corta', confirmacion: 'corta' });

    expect(screen.getByText(/al menos 8 caracteres/i)).toBeInTheDocument();
    expect(botonCrear()).toBeDisabled();
  });

  it('contraseñas distintas se avisan y bloquean el envío', async () => {
    pintar();
    await rellenar({ confirmacion: 'otraclave123' });

    expect(screen.getByText(/no coinciden/i)).toBeInTheDocument();
    expect(botonCrear()).toBeDisabled();
  });

  it('sin cédula no se envía', async () => {
    pintar();
    await rellenar({ cedula: '' });
    expect(botonCrear()).toBeDisabled();
  });
});

describe('3. EX-12 · identidad duplicada', () => {
  it('muestra el literal del caso de uso cuando la API responde 409', async () => {
    mockRegistrar.mockRejectedValue({
      response: {
        data: {
          message: {
            message: 'Identificación o correo en uso. Intente recuperar clave',
          },
        },
      },
    });
    pintar();
    await rellenar();

    await userEvent.click(botonCrear());

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Identificación o correo en uso. Intente recuperar clave',
    );
  });

  it('tras el error la persona sigue en el formulario, sin perder lo escrito', async () => {
    mockRegistrar.mockRejectedValue(new Error('cualquiera'));
    pintar();
    await rellenar();

    await userEvent.click(botonCrear());

    await screen.findByRole('alert');
    expect(screen.getByLabelText(/nombre completo/i)).toHaveValue('Ana Lucía Mora');
    expect(botonCrear()).toBeEnabled();
  });
});

describe('4. Cuenta creada (CU-10 paso 6)', () => {
  it('confirma el alta y ofrece iniciar sesión', async () => {
    pintar();
    await rellenar();

    await userEvent.click(botonCrear());

    expect(await screen.findByText('Su cuenta está lista')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /iniciar sesión/i }),
    ).toBeInTheDocument();
  });

  it('el botón de confirmación lleva al login', async () => {
    pintar();
    await rellenar();
    await userEvent.click(botonCrear());

    await userEvent.click(
      await screen.findByRole('button', { name: /iniciar sesión/i }),
    );

    expect(navegar).toHaveBeenCalledWith('/login');
  });

  /**
   * La respuesta del backend trae `idUsuario`, `email` y `rol`, **no un token**.
   * Si algún día empieza a traerlo, hay que decidirlo a conciencia: sería
   * iniciar sesión automáticamente desde un endpoint público.
   */
  it('no guarda ninguna sesión: el registro no autentica', async () => {
    pintar();
    await rellenar();

    await userEvent.click(botonCrear());

    await screen.findByText('Su cuenta está lista');
    expect(localStorage.getItem('optica_token')).toBeNull();
  });
});
