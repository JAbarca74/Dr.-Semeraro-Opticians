import { createBrowserRouter, Navigate } from 'react-router-dom';

import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { ReceptionLayout } from './layouts/ReceptionLayout';
import { ProtectedRoute } from './core/guards/ProtectedRoute';
import { RoleRoute } from './core/guards/RoleRoute';
import { Rol } from './core/models/rol';
import { ROLES_RUTA } from './core/models/acceso';
import { ErrorPage } from './shared/ErrorPage';

import { HomePage } from './features/public/HomePage';
import { CatalogoPage } from './features/public/CatalogoPage';
import { PerfilEspecialistaPage } from './features/public/PerfilEspecialistaPage';
import { RegistroPage } from './features/public/RegistroPage';
import { AgendarCitaPage } from './features/public/AgendarCitaPage';
import { SeguimientoPedidosPage } from './features/public/SeguimientoPedidosPage';
import { VerificarRecetaPage } from './features/public/VerificarRecetaPage';
import { PortalPacientePage } from './features/public/PortalPacientePage';
import { LoginPage } from './features/auth/LoginPage';

import { DashboardPage } from './features/admin/DashboardPage';
import { PersonasPage } from './features/admin/PersonasPage';
import { AgendaPage } from './features/admin/AgendaPage';
import { ExpedientesPage } from './features/admin/ExpedientesPage';
import { InventarioPage } from './features/admin/InventarioPage';
import { VentasPage } from './features/admin/VentasPage';
import { MetricasPage } from './features/admin/MetricasPage';
import { UsuariosPage } from './features/admin/UsuariosPage';
import { AuditoriaPage } from './features/admin/AuditoriaPage';
import { CuentaPage } from './features/admin/CuentaPage';

import { LaboratorioPage } from './features/recepcion/LaboratorioPage';

/**
 * Rutas divididas en tres entornos:
 *  - PÚBLICO (portal del paciente)
 *  - /admin (panel administrativo: Administrador y Doctor)
 *  - /recepcion (front desk: Recepción)
 * Todo lo privado está protegido por sesión y RBAC real.
 */
export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage />, errorElement: <ErrorPage /> },
  {
    element: <PublicLayout />,
    errorElement: <ErrorPage />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/catalogo', element: <CatalogoPage /> },
      { path: '/especialista', element: <PerfilEspecialistaPage /> },
      { path: '/registro', element: <RegistroPage /> },
      { path: '/activar-cuenta', element: <RegistroPage /> },
      { path: '/agendar', element: <AgendarCitaPage /> },
      { path: '/validar-receta', element: <PortalPacientePage /> },
      { path: '/verificar/:hash', element: <VerificarRecetaPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          {
            // CU-14 consume `GET /portal/pedidos`, que la API reserva al rol
            // Paciente. Sin este guard el personal entraba y se encontraba un
            // 403: el mismo defecto que se corrigió en las rutas de bodega,
            // ventas y métricas (ver `06-estado-y-hallazgos.md` §3.22 y §3.28).
            element: <RoleRoute roles={[Rol.PACIENTE]} />,
            children: [{ path: '/portal', element: <PortalPacientePage /> }, { path: '/pedidos', element: <SeguimientoPedidosPage /> }],
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    errorElement: <ErrorPage />,
    children: [
      {
        element: <RoleRoute roles={[Rol.ADMINISTRADOR, Rol.DOCTOR]} />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { element: <RoleRoute roles={ROLES_RUTA['/admin']} />, children: [{ path: '/admin', element: <DashboardPage /> }] },
              { element: <RoleRoute roles={ROLES_RUTA['/admin/personas']} />, children: [{ path: '/admin/personas', element: <PersonasPage /> }] },
              { element: <RoleRoute roles={ROLES_RUTA['/admin/cuenta']} />, children: [{ path: '/admin/cuenta', element: <CuentaPage /> }] },
              { element: <RoleRoute roles={ROLES_RUTA['/admin/agenda']} />, children: [{ path: '/admin/agenda', element: <AgendaPage /> }] },
              { element: <RoleRoute roles={ROLES_RUTA['/admin/expedientes']} />, children: [{ path: '/admin/expedientes', element: <ExpedientesPage /> }] },
              { element: <RoleRoute roles={ROLES_RUTA['/admin/laboratorio']} />, children: [{ path: '/admin/laboratorio', element: <LaboratorioPage /> }] },
              { element: <RoleRoute roles={ROLES_RUTA['/admin/inventario']} />, children: [{ path: '/admin/inventario', element: <InventarioPage /> }] },
              { element: <RoleRoute roles={ROLES_RUTA['/admin/ventas']} />, children: [{ path: '/admin/ventas', element: <VentasPage /> }] },
              { element: <RoleRoute roles={ROLES_RUTA['/admin/metricas']} />, children: [{ path: '/admin/metricas', element: <MetricasPage /> }] },
              { element: <RoleRoute roles={ROLES_RUTA['/admin/usuarios']} />, children: [{ path: '/admin/usuarios', element: <UsuariosPage /> }] },
              { element: <RoleRoute roles={ROLES_RUTA['/admin/auditoria']} />, children: [{ path: '/admin/auditoria', element: <AuditoriaPage /> }] },
            ],
          },
        ],
      },
      {
        element: <RoleRoute roles={[Rol.RECEPCION]} />,
        children: [
          {
            element: <ReceptionLayout />,
            children: [
              { path: '/recepcion', element: <Navigate to="/recepcion/agenda" replace /> },
              { path: '/recepcion/cuenta', element: <CuentaPage /> },
              { path: '/recepcion/agenda', element: <AgendaPage /> },
            ],
          },
        ],
      },
    ],
  },
    { path: '*', element: <Navigate to="/" replace /> },
  ],
  {
    // Adopta desde ya el comportamiento de React Router v7. Sin esto la consola
    // avisa en cada arranque («Future Flag Warning»); activarlos también deja el
    // salto a v7 sin cambios de comportamiento sorpresa.
    // `v7_startTransition` no va aquí, sino en el `RouterProvider` de `App.tsx`.
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  },
);
