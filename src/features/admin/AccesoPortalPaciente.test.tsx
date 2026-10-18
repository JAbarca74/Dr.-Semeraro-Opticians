// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '../../test/rtl';
import userEvent from '@testing-library/user-event';
import { AccesoPortalPaciente } from './AccesoPortalPaciente';
import { estadoAcceso, guardarCorreoPortal, reenviarInvitacion } from '../../core/api/activacion.service';
vi.mock('../../core/api/activacion.service', async (original) => ({
  ...await original<typeof import('../../core/api/activacion.service')>(),
  estadoAcceso: vi.fn(), guardarCorreoPortal: vi.fn(), reenviarInvitacion: vi.fn(),
}));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe('Invitaciones desde la ficha de la cita', () => {
  it('agrega correo a la misma ficha sin pedir contraseña al personal', async () => {
    vi.mocked(estadoAcceso).mockResolvedValue({ estado: 'sin_correo' });
    vi.mocked(guardarCorreoPortal).mockResolvedValue({ estado: 'enviada' });
    render(<AccesoPortalPaciente idPersona={8} />);
    await screen.findByText('Ficha sin correo. Puede continuar con la cita.');
    await userEvent.type(screen.getByRole('textbox'), 'ana@example.test');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar correo y enviar invitación' }));
    expect(guardarCorreoPortal).toHaveBeenCalledWith(8, 'ana@example.test');
    expect(await screen.findByText('Invitación enviada. El enlace vence en 24 horas.')).toBeInTheDocument();
    expect(screen.queryByLabelText(/Contraseña/)).not.toBeInTheDocument();
  });
  it('permite reintentar un envío fallido', async () => {
    vi.mocked(estadoAcceso).mockResolvedValue({ estado: 'fallida' });
    vi.mocked(reenviarInvitacion).mockResolvedValue({ estado: 'enviada' });
    render(<AccesoPortalPaciente idPersona={8} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Reenviar invitación' }));
    expect(reenviarInvitacion).toHaveBeenCalledWith(8);
    expect(await screen.findByText('Invitación enviada. El enlace vence en 24 horas.')).toBeInTheDocument();
  });
  it('una cuenta desactivada no ofrece activación ni cambio de correo', async () => {
    vi.mocked(estadoAcceso).mockResolvedValue({ estado: 'desactivada' });
    render(<AccesoPortalPaciente idPersona={8} />);
    expect(await screen.findByText('Cuenta desactivada. Contacte a Administración.')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});
