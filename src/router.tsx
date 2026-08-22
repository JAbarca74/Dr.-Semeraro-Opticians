import { createBrowserRouter, Navigate } from 'react-router-dom';

import { PublicLayout } from './layouts/PublicLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { ReceptionLayout } from './layouts/ReceptionLayout';
import { ProtectedRoute } from './core/guards/ProtectedRoute';
import { RoleRoute } from './core/guards/RoleRoute';
import { Rol } from './core/models/rol';
import { ErrorPage } from './shared/ErrorPage';

import { HomePage } from './features/public/HomePage';
import { CatalogoPage } from './features/public/CatalogoPage';
import { PerfilEspecialistaPage } from './features/public/PerfilEspecialistaPage';
import { RegistroPage } from './features/public/RegistroPage';
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

import { OverviewPage } from './features/recepcion/OverviewPage';
import { PacientesPage as PacientesRecepcionPage } from './features/recepcion/PacientesPage';
import { RecetasPage as RecetasRecepcionPage } from './features/recepcion/RecetasPage';
import {
  VentasRecepcionPage,
  ExistenciasRecepcionPage,
} from './features/recepcion/StubPages';
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
      { path: '/portal', element: <PortalPacientePage /> },
      { path: '/verificar/:hash', element: <VerificarRecetaPage /> },
      {
        element: <ProtectedRoute />,
        children: [{ path: '/pedidos', element: <SeguimientoPedidosPage /> }],
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
              { path: '/admin', element: <DashboardPage /> },
              { path: '/admin/personas', element: <PersonasPage /> },
              { path: '/admin/agenda', element: <AgendaPage /> },
              { path: '/admin/inventario', element: <InventarioPage /> },
              { path: '/admin/ventas', element: <VentasPage /> },
              { path: '/admin/metricas', element: <MetricasPage /> },
              // El mismo tablero que ve Recepción, no una copia: CU-07 nombra a
              // «Doctor/Recepción», y el guard de `/recepcion` deja fuera al
              // Doctor. Sin esta ruta, el caso de uso quedaría a medias.
              { path: '/admin/laboratorio', element: <LaboratorioPage /> },
              { path: '/admin/cuenta', element: <CuentaPage /> },
              { path: '/admin/expedientes', element: <ExpedientesPage /> },
              {
                element: <RoleRoute roles={[Rol.ADMINISTRADOR]} />,
                children: [
                  { path: '/admin/usuarios', element: <UsuariosPage /> },
                  { path: '/admin/auditoria', element: <AuditoriaPage /> },
                ],
              },
            ],
          },
        ],
      },
      {
        element: <RoleRoute roles={[Rol.RECEPCION, Rol.ADMINISTRADOR]} />,
        children: [
          {
            element: <ReceptionLayout />,
            children: [
              { path: '/recepcion', element: <OverviewPage /> },
              { path: '/recepcion/pacientes', element: <PacientesRecepcionPage /> },
              { path: '/recepcion/recetas', element: <RecetasRecepcionPage /> },
              // `CuentaPage` no depende del entorno: solo cambia la contraseña
              // de quien tiene la sesión abierta, sea cual sea su rol.
              { path: '/recepcion/cuenta', element: <CuentaPage /> },
              // La misma agenda que ve el consultorio, no una copia: CU-05 es
              // el módulo de Recepción. `AgendaPage` se adapta al rol y le
              // muestra solo la pestaña de citas, porque configurar los
              // horarios (CU-06) es del Doctor.
              { path: '/recepcion/agenda', element: <AgendaPage /> },
              { path: '/recepcion/ventas', element: <VentasRecepcionPage /> },
              { path: '/recepcion/existencias', element: <ExistenciasRecepcionPage /> },
              { path: '/recepcion/laboratorio', element: <LaboratorioPage /> },
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
