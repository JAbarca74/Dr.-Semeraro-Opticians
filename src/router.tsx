import { createBrowserRouter, Navigate } from 'react-router-dom';

import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { ProtectedRoute } from './core/guards/ProtectedRoute';
import { RoleRoute } from './core/guards/RoleRoute';
import { Rol } from './core/models/rol';

import { HomePage } from './features/public/HomePage';
import { CatalogoPage } from './features/public/CatalogoPage';
import { PerfilEspecialistaPage } from './features/public/PerfilEspecialistaPage';
import { RegistroPage } from './features/public/RegistroPage';
import { SeguimientoPedidosPage } from './features/public/SeguimientoPedidosPage';
import { VerificarRecetaPage } from './features/public/VerificarRecetaPage';
import { LoginPage } from './features/auth/LoginPage';

import { DashboardPage } from './features/admin/DashboardPage';
import { PersonasPage } from './features/admin/PersonasPage';
import { AgendaPage } from './features/admin/AgendaPage';
import { ExpedientesPage } from './features/admin/ExpedientesPage';
import { InventarioPage } from './features/admin/InventarioPage';
import { VentasPage } from './features/admin/VentasPage';
import { MetricasPage } from './features/admin/MetricasPage';
import { UsuariosPage } from './features/admin/UsuariosPage';
import { CuentaPage } from './features/admin/CuentaPage';

/**
 * Rutas divididas en dos entornos:
 *  - PÚBLICO (portal del paciente)
 *  - PRIVADO /admin (panel administrativo, protegido por sesión y RBAC)
 */
export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/catalogo', element: <CatalogoPage /> },
      { path: '/especialista', element: <PerfilEspecialistaPage /> },
      { path: '/registro', element: <RegistroPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/verificar/:hash', element: <VerificarRecetaPage /> },
      {
        element: <ProtectedRoute />,
        children: [{ path: '/pedidos', element: <SeguimientoPedidosPage /> }],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/admin', element: <DashboardPage /> },
          { path: '/admin/personas', element: <PersonasPage /> },
          { path: '/admin/agenda', element: <AgendaPage /> },
          { path: '/admin/inventario', element: <InventarioPage /> },
          { path: '/admin/ventas', element: <VentasPage /> },
          { path: '/admin/metricas', element: <MetricasPage /> },
          { path: '/admin/cuenta', element: <CuentaPage /> },
          {
            element: <RoleRoute roles={[Rol.DOCTOR, Rol.ADMINISTRADOR]} />,
            children: [
              { path: '/admin/expedientes', element: <ExpedientesPage /> },
            ],
          },
          {
            element: <RoleRoute roles={[Rol.ADMINISTRADOR]} />,
            children: [{ path: '/admin/usuarios', element: <UsuariosPage /> }],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
