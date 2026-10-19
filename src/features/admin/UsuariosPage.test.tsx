// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '../../test/rtl';
import userEvent from '@testing-library/user-event';
import { UsuariosPage } from './UsuariosPage';
import { listarUsuarios, crearUsuario } from '../../core/api/usuarios.service';
import { listarPersonas } from '../../core/api/personas.service';
import {
  estadoInvitacionPersonal,
  invitarPersonal,
} from '../../core/api/acceso-cuenta.service';
import { Rol } from '../../core/models/rol';
import { TipoPersona } from '../../core/models/persona';
vi.mock('../../core/api/usuarios.service');
vi.mock('../../core/api/personas.service');
vi.mock('../../core/api/acceso-cuenta.service');
vi.mock('../../core/auth/auth.context', () => ({
  useAuth: () => ({ user: { idUsuario: 99, rol: 'Administrador' } }),
}));
const pendiente = {
  idUsuario: 7,
  idPersona: 4,
  email: 'empleado@example.test',
  rol: Rol.RECEPCION,
  activo: true,
  activado: false,
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listarUsuarios).mockResolvedValue([pendiente]);
  vi.mocked(listarPersonas).mockResolvedValue([
    {
      idPersona: 4,
      cedula: 'empleado',
      nombre: 'Empleado',
      tipo: TipoPersona.EMPLEADO,
    },
    {
      idPersona: 5,
      cedula: 'paciente',
      nombre: 'Paciente',
      tipo: TipoPersona.PACIENTE,
    },
  ]);
});
afterEach(cleanup);
describe('Administración invita al personal sin definir contraseñas', () => {
  it('registra un empleado nuevo desde Usuarios en una sola solicitud', async () => {
    vi.mocked(crearUsuario).mockResolvedValue({
      ...pendiente,
      accesoCuenta: { estado: 'enviada' },
    });
    render(<UsuariosPage />);
    await userEvent.click(
      screen.getByRole('button', { name: 'Registrar nuevo empleado' }),
    );
    await userEvent.type(screen.getByLabelText('Cédula'), '123456');
    await userEvent.type(
      screen.getByLabelText('Nombre completo'),
      'Ana Empleada',
    );
    await userEvent.type(
      screen.getByRole('textbox', { name: 'Correo' }),
      'empleado@example.test',
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Crear usuario' }),
    );
    expect(crearUsuario).toHaveBeenCalledWith({
      cedula: '123456',
      nombre: 'Ana Empleada',
      email: 'empleado@example.test',
      rol: Rol.RECEPCION,
    });
    expect(
      await screen.findByText(
        'Invitación enviada. El enlace vence en 24 horas.',
      ),
    ).toBeInTheDocument();
  });
  it('selecciona empleados y conserva la cuenta pendiente si falla el correo', async () => {
    vi.mocked(crearUsuario).mockResolvedValue({
      ...pendiente,
      accesoCuenta: { estado: 'fallida' },
    });
    render(<UsuariosPage />);
    await screen.findByRole('option', { name: 'Empleado (empleado)' });
    expect(
      screen.queryByRole('option', { name: 'Paciente (paciente)' }),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/contraseña/i)).not.toBeInTheDocument();
    await userEvent.selectOptions(screen.getAllByRole('combobox')[0], '4');
    await userEvent.type(screen.getByRole('textbox'), 'empleado@example.test');
    await userEvent.click(
      screen.getByRole('button', { name: 'Crear usuario' }),
    );
    expect(crearUsuario).toHaveBeenCalledWith({
      idPersona: 4,
      email: 'empleado@example.test',
      rol: Rol.RECEPCION,
    });
    expect(
      await screen.findByText(
        /La cuenta quedó pendiente, pero no se pudo enviar/,
      ),
    ).toBeInTheDocument();
  });
  it('consulta estado y reenvía invitación sin crear otra cuenta', async () => {
    vi.mocked(estadoInvitacionPersonal).mockResolvedValue({
      estado: 'vencida',
    });
    vi.mocked(invitarPersonal).mockResolvedValue({ estado: 'enviada' });
    render(<UsuariosPage />);
    await userEvent.click(
      await screen.findByRole('button', { name: 'Consultar invitación' }),
    );
    expect(estadoInvitacionPersonal).toHaveBeenCalledWith(7);
    expect(
      await screen.findByText('Invitación vencida. Envíe un nuevo enlace.'),
    ).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: 'Reenviar invitación' }),
    );
    expect(invitarPersonal).toHaveBeenCalledWith(7);
    expect(
      await screen.findByText(
        'Invitación enviada. El enlace vence en 24 horas.',
      ),
    ).toBeInTheDocument();
    expect(crearUsuario).not.toHaveBeenCalled();
  });
});
