// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { render, screen, cleanup } from '../../test/rtl';
import { AccesoCuentaPage } from './AccesoCuentaPage';
import {
  solicitarRecuperacion,
  confirmarClave,
} from '../../core/api/acceso-cuenta.service';
vi.mock('../../core/api/acceso-cuenta.service');
vi.mock('../../core/auth/auth.context', () => ({
  useAuth: () => ({ cerrarSesionLocal: vi.fn() }),
}));
beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(null, '', '/');
});
afterEach(cleanup);
describe('Contraseñas elegidas por su dueño', () => {
  it('solicita recuperación y muestra una respuesta neutral', async () => {
    vi.mocked(solicitarRecuperacion).mockResolvedValue({ mensaje: 'neutral' });
    render(
      <MemoryRouter>
        <AccesoCuentaPage modo="recuperar" />
      </MemoryRouter>,
    );
    await userEvent.type(screen.getByRole('textbox'), 'empleado@example.test');
    await userEvent.click(
      screen.getByRole('button', { name: 'Enviar enlace' }),
    );
    expect(solicitarRecuperacion).toHaveBeenCalledWith('empleado@example.test');
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Si existe una cuenta habilitada',
    );
  });
  it('sin enlace no ofrece establecer una contraseña', () => {
    render(
      <MemoryRouter>
        <AccesoCuentaPage modo="personal" />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText(/Abra el enlace del correo/)).toBeInTheDocument();
  });
  it.each(['personal', 'restablecer'] as const)(
    'confirma %s sin permitir seleccionar un rol',
    async (modo) => {
      vi.mocked(confirmarClave).mockResolvedValue({ mensaje: 'Guardada' });
      window.history.replaceState(null, '', '/#token=' + 'a'.repeat(64));
      render(
        <MemoryRouter>
          <AccesoCuentaPage modo={modo} />
        </MemoryRouter>,
      );
      expect(window.location.hash).toBe('');
      await userEvent.type(screen.getByLabelText('Contraseña *'), 'clave12345');
      await userEvent.type(
        screen.getByLabelText('Repita la contraseña *'),
        'clave12345',
      );
      await userEvent.click(
        screen.getByRole('button', { name: 'Guardar contraseña' }),
      );
      expect(confirmarClave).toHaveBeenCalledWith(
        'a'.repeat(64),
        'clave12345',
        modo === 'personal',
      );
      expect(await screen.findByRole('status')).toHaveTextContent(
        'Contraseña guardada',
      );
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    },
  );
  it('bloquea contraseñas diferentes y muestra el error de enlace vencido', async () => {
    vi.mocked(confirmarClave).mockRejectedValue({
      response: { data: { message: 'El enlace venció' } },
    });
    window.history.replaceState(null, '', '/#token=' + 'a'.repeat(64));
    render(
      <MemoryRouter>
        <AccesoCuentaPage modo="restablecer" />
      </MemoryRouter>,
    );
    await userEvent.type(screen.getByLabelText('Contraseña *'), 'clave12345');
    await userEvent.type(
      screen.getByLabelText('Repita la contraseña *'),
      'otra',
    );
    expect(
      screen.getByRole('button', { name: 'Guardar contraseña' }),
    ).toBeDisabled();
    await userEvent.clear(screen.getByLabelText('Repita la contraseña *'));
    await userEvent.type(
      screen.getByLabelText('Repita la contraseña *'),
      'clave12345',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Guardar contraseña' }),
    );
    expect(await screen.findByText('El enlace venció')).toBeInTheDocument();
  });
});
