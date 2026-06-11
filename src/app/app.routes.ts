import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { Rol } from './core/models/rol.model';

/**
 * Rutas de la aplicacion divididas en dos entornos:
 *  - Publico (portal del paciente)
 *  - Privado /admin (panel administrativo, protegido por RBAC)
 */
export const routes: Routes = [
  // --- Entorno publico (paciente) ---
  {
    path: '',
    loadComponent: () =>
      import('./features/public/home/home.component').then(
        (m) => m.HomeComponent,
      ),
  },
  {
    path: 'catalogo',
    loadComponent: () =>
      import('./features/public/catalogo/catalogo.component').then(
        (m) => m.CatalogoComponent,
      ),
  },
  {
    path: 'especialista',
    loadComponent: () =>
      import(
        './features/public/perfil-especialista/perfil-especialista.component'
      ).then((m) => m.PerfilEspecialistaComponent),
  },
  {
    path: 'registro',
    loadComponent: () =>
      import('./features/public/registro/registro.component').then(
        (m) => m.RegistroComponent,
      ),
  },
  {
    path: 'pedidos',
    canActivate: [authGuard],
    loadComponent: () =>
      import(
        './features/public/seguimiento-pedidos/seguimiento-pedidos.component'
      ).then((m) => m.SeguimientoPedidosComponent),
  },

  // --- Autenticacion ---
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent,
      ),
  },

  // --- Entorno privado (panel administrativo) ---
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent,
      ),
  },
  {
    path: 'admin/personas',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/personas/personas.component').then(
        (m) => m.PersonasComponent,
      ),
  },
  {
    path: 'admin/agenda',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/agenda/agenda.component').then(
        (m) => m.AgendaComponent,
      ),
  },
  {
    path: 'admin/expedientes',
    canActivate: [roleGuard([Rol.DOCTOR, Rol.ADMINISTRADOR])],
    loadComponent: () =>
      import('./features/admin/expedientes/expedientes.component').then(
        (m) => m.ExpedientesComponent,
      ),
  },
  {
    path: 'admin/inventario',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/inventario/inventario.component').then(
        (m) => m.InventarioComponent,
      ),
  },
  {
    path: 'admin/ventas',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/ventas/ventas.component').then(
        (m) => m.VentasComponent,
      ),
  },
  {
    path: 'admin/metricas',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/admin/metricas/metricas.component').then(
        (m) => m.MetricasComponent,
      ),
  },
  {
    path: 'admin/usuarios',
    canActivate: [roleGuard([Rol.ADMINISTRADOR])],
    loadComponent: () =>
      import('./features/admin/usuarios/usuarios.component').then(
        (m) => m.UsuariosComponent,
      ),
  },

  // --- Comodin ---
  { path: '**', redirectTo: '' },
];
