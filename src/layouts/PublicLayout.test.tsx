// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { cleanup, render, screen } from '../test/rtl';
import { PublicLayout } from './PublicLayout';

const sesion = vi.hoisted(() => ({
  isAuthenticated: false,
  user: null as null | { rol: string },
  logout: vi.fn(),
}));
vi.mock('../core/auth/auth.context', () => ({ useAuth: () => sesion }));
vi.mock('../core/theme/theme.context', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));
vi.mock('../shared/BotonWhatsappFlotante', () => ({
  BotonWhatsappFlotante: () => null,
}));
afterEach(() => {
  cleanup();
  sesion.isAuthenticated = false;
  sesion.user = null;
});
const pintar = (ruta = '/') =>
  render(
    <MemoryRouter initialEntries={[ruta]}>
      <PublicLayout />
    </MemoryRouter>,
  );
const destinos = () =>
  screen.getAllByRole('link').map((enlace) => enlace.getAttribute('href'));

describe('Navegación pública y privada', () => {
  it('ofrece la vitrina y citas sin enlaces públicos a datos del paciente', () => {
    pintar();
    expect(destinos()).toEqual(
      expect.arrayContaining([
        '/',
        '/catalogo',
        '/especialista',
        '/agendar',
        '/login',
      ]),
    );
    for (const ruta of ['/registro', '/portal', '/pedidos', '/mi-cuenta'])
      expect(destinos()).not.toContain(ruta);
  });
  it('ofrece volver al panel sin mostrar pedidos en el inicio público con sesión', () => {
    sesion.isAuthenticated = true;
    sesion.user = { rol: 'Paciente' };
    pintar();
    expect(destinos()).not.toContain('/pedidos');
    expect(destinos().filter((ruta) => ruta === '/portal')).toHaveLength(1);
  });
  it('conserva expediente, pedidos y cuenta en las pantallas privadas', () => {
    sesion.isAuthenticated = true;
    sesion.user = { rol: 'Paciente' };
    pintar('/portal');
    expect(destinos()).toEqual(
      expect.arrayContaining([
        '/portal',
        '/pedidos',
        '/mi-cuenta',
        '/catalogo',
      ]),
    );
  });
});
