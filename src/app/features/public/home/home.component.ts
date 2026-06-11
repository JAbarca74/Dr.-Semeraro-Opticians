import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="container">
      <h1>Óptica Dr. Semeraro</h1>
      <p>Salud visual integral en Pérez Zeledón.</p>
      <nav>
        <ul>
          <li><a routerLink="/catalogo">Catálogo de productos</a></li>
          <li><a routerLink="/especialista">Perfil del especialista</a></li>
          <li><a routerLink="/pedidos">Seguimiento de pedidos</a></li>
          <li><a routerLink="/registro">Crear cuenta</a></li>
          <li><a routerLink="/login">Iniciar sesión</a></li>
        </ul>
      </nav>
    </main>
  `,
})
export class HomeComponent {}
