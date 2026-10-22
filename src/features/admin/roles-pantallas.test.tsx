// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import { render, screen, cleanup, waitFor } from '../../test/rtl';
import { DashboardPage } from './DashboardPage';
import { PersonasPage } from './PersonasPage';
import { listarCitas } from '../../core/api/agenda.service';
import { listarExpedientes } from '../../core/api/expedientes.service';
import { listarPersonas, crearPersona } from '../../core/api/personas.service';
import { Rol } from '../../core/models/rol';
import { AdminLayout } from '../../layouts/AdminLayout';
import { ReceptionLayout } from '../../layouts/ReceptionLayout';

let rol: Rol = Rol.ADMINISTRADOR;
vi.mock('framer-motion', async () => {
  const react = await import('react');
  const omitir = ['initial', 'animate', 'exit', 'variants', 'transition', 'whileInView', 'viewport', 'whileHover', 'whileTap'];
  const componentes: Record<string, any> = {};
  return { AnimatePresence: ({ children }: any) => children, motion: new Proxy({}, {
    get: (_, tag: string) => componentes[tag] ??= react.forwardRef((props: any, ref: any) => react.createElement(tag, {
      ...Object.fromEntries(Object.entries(props).filter(([key]) => !omitir.includes(key))), ref,
    })),
  }) };
});
vi.mock('../../core/auth/auth.context', () => ({ useAuth: () => ({
  user: { rol, email: 'cuenta@optica.local' }, logout: vi.fn(),
  hasRole: (roles: Rol[]) => roles.includes(rol),
}) }));
vi.mock('../../core/theme/theme.context', () => ({ useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }) }));
vi.mock('../../core/api/agenda.service');
vi.mock('../../core/api/expedientes.service');
vi.mock('../../core/api/personas.service');

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(listarPersonas).mockResolvedValue([]);
  vi.mocked(listarCitas).mockResolvedValue([]);
  vi.mocked(listarExpedientes).mockResolvedValue([]);
});
afterEach(cleanup);

describe('pantallas según finalidad de la cuenta', () => {
  it('el panel administrativo no consulta agenda ni expedientes ni ofrece el acceso clínico', async () => {
    rol = Rol.ADMINISTRADOR;
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    await waitFor(() => expect(listarPersonas).toHaveBeenCalled());
    expect(listarCitas).not.toHaveBeenCalled();
    expect(listarExpedientes).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Abrir expedientes' })).not.toBeInTheDocument();
    expect(screen.queryByText('Citas de hoy')).not.toBeInTheDocument();
  });

  it('el panel del doctor consulta su área clínica y no ofrece inventario', async () => {
    rol = Rol.DOCTOR;
    render(<MemoryRouter><DashboardPage /></MemoryRouter>);
    await waitFor(() => expect(listarExpedientes).toHaveBeenCalled());
    expect(listarCitas).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Abrir expedientes' })).toBeInTheDocument();
    expect(screen.queryByText('Personal de clínica')).not.toBeInTheDocument();
  });

  it('el formulario del doctor no ofrece registrar empleados', async () => {
    rol = Rol.DOCTOR;
    render(<PersonasPage />);
    await waitFor(() => expect(listarPersonas).toHaveBeenCalled());
    expect(screen.queryByRole('option', { name: 'Empleado' })).not.toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Paciente' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Pacientes' })).toBeInTheDocument();
  });

  it('el Doctor solo envía campos permitidos al guardar la ficha', async () => {
    rol = Rol.DOCTOR;
    vi.mocked(crearPersona).mockResolvedValue({ idPersona: 5, cedula: '123', nombre: 'Ana', tipo: 'Paciente' });
    render(<PersonasPage />);
    const user = userEvent.setup({ delay: null });
    await user.type(screen.getByLabelText('Cédula'), '123');
    await user.type(screen.getByLabelText('Nombre completo'), 'Ana');
    await user.click(screen.getByRole('button', { name: 'Crear persona' }));
    await waitFor(() => expect(crearPersona).toHaveBeenCalled());
    expect(crearPersona).toHaveBeenCalledWith({ cedula: '123', nombre: 'Ana', tipo: 'Paciente' });
  });

  it.each([Rol.ADMINISTRADOR, Rol.DOCTOR])('el menú %s coincide con las rutas permitidas', (cuenta) => {
    rol = cuenta;
    const { container } = render(<MemoryRouter><AdminLayout /></MemoryRouter>);
    const enlaces = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    const prohibidas = cuenta === Rol.ADMINISTRADOR
      ? ['/admin/expedientes', '/admin/agenda', '/recepcion']
      : ['/admin/ventas', '/admin/inventario', '/admin/laboratorio', '/admin/usuarios', '/admin/auditoria', '/admin/metricas'];
    prohibidas.forEach((ruta) => expect(enlaces).not.toContain(ruta));
    expect(enlaces).toContain(cuenta === Rol.DOCTOR ? '/admin/agenda' : '/admin/ventas');
  });

  it('Recepción no tiene enlaces a otros módulos del mostrador', () => {
    rol = Rol.RECEPCION;
    const { container } = render(<MemoryRouter><ReceptionLayout /></MemoryRouter>);
    const enlaces = Array.from(container.querySelectorAll('a')).map((a) => a.getAttribute('href'));
    expect(enlaces).toContain('/recepcion/agenda');
    for (const ruta of ['/recepcion/pacientes', '/recepcion/recetas', '/recepcion/ventas', '/recepcion/existencias', '/recepcion/laboratorio']) {
      expect(enlaces).not.toContain(ruta);
    }
  });
});
