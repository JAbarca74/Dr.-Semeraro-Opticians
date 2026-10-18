// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { MemoryRouter, Routes, Route, matchRoutes } from 'react-router-dom';
import { render, screen, cleanup } from '../../test/rtl';
import { Rol } from '../models/rol';
import { ROLES_RUTA, puedeAccederRuta } from '../models/acceso';
import { RoleRoute } from './RoleRoute';
import { router } from '../../router';

let rol: Rol = Rol.RECEPCION;
vi.mock('../auth/auth.context', () => ({ useAuth: () => ({
  user: { rol }, isAuthenticated: true, hasRole: (permitidos: Rol[]) => permitidos.includes(rol),
}) }));
afterEach(cleanup);

describe('rutas privadas frente a la política de la API', () => {
  const casos: [Rol, string[], string[]][] = [
    [Rol.DOCTOR, ['/admin/agenda', '/admin/expedientes', '/admin/personas'], ['/admin/inventario', '/admin/ventas', '/admin/laboratorio', '/admin/usuarios', '/recepcion/agenda']],
    [Rol.ADMINISTRADOR, ['/admin/inventario', '/admin/ventas', '/admin/laboratorio', '/admin/usuarios'], ['/admin/expedientes', '/admin/agenda', '/recepcion/agenda']],
    [Rol.RECEPCION, ['/recepcion/agenda', '/recepcion/cuenta'], ['/admin', '/admin/ventas', '/admin/expedientes', '/recepcion/ventas', '/recepcion/pacientes']],
    [Rol.PACIENTE, ['/portal', '/pedidos'], ['/admin', '/recepcion/agenda', '/admin/expedientes']],
  ];
  for (const [usuario, permitidas, prohibidas] of casos) {
    it(`${usuario} solo tiene las rutas acordadas`, () => {
      permitidas.forEach((ruta) => expect(puedeAccederRuta(ruta, usuario)).toBe(true));
      prohibidas.forEach((ruta) => expect(puedeAccederRuta(ruta, usuario)).toBe(false));
    });
    for (const ruta of [...permitidas, ...prohibidas.filter((p) => ROLES_RUTA[p])]) {
      it(`${usuario} no puede saltarse el guard escribiendo ${ruta}`, () => {
        const coincidencias = matchRoutes(router.routes, ruta)!;
        const guardias = coincidencias.map((m) => (m.route as { element?: any }).element)
          .filter((elemento: any) => elemento?.type === RoleRoute) as any[];
        expect(guardias.length).toBeGreaterThan(0);
        expect(guardias.every((g) => g.props.roles.includes(usuario))).toBe(permitidas.includes(ruta));
      });
    }
  }

  it('Recepción no conserva rutas antiguas de mostrador', () => {
    for (const ruta of ['/recepcion/pacientes', '/recepcion/recetas', '/recepcion/ventas', '/recepcion/existencias', '/recepcion/laboratorio']) {
      expect(matchRoutes(router.routes, ruta)?.slice(-1)[0]?.route.path).toBe('*');
    }
  });

  it('el guard redirige a Recepción a su inicio cuando intenta entrar a ventas', async () => {
    rol = Rol.RECEPCION;
    render(<MemoryRouter initialEntries={['/admin/ventas']}><Routes>
      <Route element={<RoleRoute roles={[Rol.ADMINISTRADOR]} />}>
        <Route path="/admin/ventas" element={<p>Contenido de ventas</p>} />
      </Route>
      <Route path="/recepcion" element={<p>Inicio de recepción</p>} />
    </Routes></MemoryRouter>);
    expect(await screen.findByText('Inicio de recepción')).toBeInTheDocument();
    expect(screen.queryByText('Contenido de ventas')).not.toBeInTheDocument();
  });
});
