// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '../../test/rtl';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RegistroPage } from './RegistroPage';
import { activarCuenta } from '../../core/api/activacion.service';

vi.mock('../../core/api/activacion.service');

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

beforeEach(() => { vi.clearAllMocks(); window.history.replaceState(null, '', '/activar-cuenta'); });
afterEach(cleanup);
const pintar = (token = '') => {
  window.history.replaceState(null, '', '/activar-cuenta' + (token ? '#token=' + token : ''));
  return render(<MemoryRouter><RegistroPage /></MemoryRouter>);
};
describe('Activacion por invitacion', () => {
  it('sin enlace explica el alta presencial y no ofrece registro publico', () => {
    pintar();
    expect(screen.getByText(/Abra el enlace del correo/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Cédula/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Activar cuenta' })).not.toBeInTheDocument();
  });
  it('retira el fragmento y bloquea contraseñas diferentes', async () => {
    pintar('a'.repeat(64));
    expect(window.location.hash).toBe('');
    await userEvent.type(screen.getByLabelText('Contraseña *'), 'clave12345');
    await userEvent.type(screen.getByLabelText('Repita la contraseña *'), 'diferente');
    expect(screen.getByRole('button', { name: 'Activar cuenta' })).toBeDisabled();
    expect(activarCuenta).not.toHaveBeenCalled();
  });
  it('activa sin reenviar identidad ni rol y permite iniciar sesion', async () => {
    vi.mocked(activarCuenta).mockResolvedValue({ mensaje: 'Cuenta activada' });
    pintar('a'.repeat(64));
    await userEvent.type(screen.getByLabelText('Contraseña *'), 'clave12345');
    await userEvent.type(screen.getByLabelText('Repita la contraseña *'), 'clave12345');
    await userEvent.click(screen.getByRole('button', { name: 'Activar cuenta' }));
    expect(activarCuenta).toHaveBeenCalledWith({ token: 'a'.repeat(64), password: 'clave12345' });
    expect(await screen.findByText('Su cuenta está lista')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Inicie sesión' })).toHaveAttribute('href', '/login');
  });
  it('muestra enlace vencido sin anunciar exito', async () => {
    vi.mocked(activarCuenta).mockRejectedValue({ response: { data: { message: 'El enlace venció' } } });
    pintar('a'.repeat(64));
    await userEvent.type(screen.getByLabelText('Contraseña *'), 'clave12345');
    await userEvent.type(screen.getByLabelText('Repita la contraseña *'), 'clave12345');
    await userEvent.click(screen.getByRole('button', { name: 'Activar cuenta' }));
    expect(await screen.findByText('El enlace venció')).toBeInTheDocument();
    expect(screen.queryByText('Su cuenta está lista')).not.toBeInTheDocument();
  });
});
