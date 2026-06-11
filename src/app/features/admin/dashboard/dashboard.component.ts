import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="container">
      <h1>Panel administrativo</h1>
      <nav>
        <ul>
          <li><a routerLink="/admin/personas">Personas</a></li>
          <li><a routerLink="/admin/agenda">Agenda y citas</a></li>
          <li><a routerLink="/admin/expedientes">Expedientes clínicos</a></li>
          <li><a routerLink="/admin/inventario">Inventario</a></li>
          <li><a routerLink="/admin/ventas">Ventas</a></li>
          <li><a routerLink="/admin/metricas">Métricas e indicadores</a></li>
          <li><a routerLink="/admin/usuarios">Usuarios y roles</a></li>
        </ul>
      </nav>
    </main>
  `,
})
export class DashboardComponent {}
