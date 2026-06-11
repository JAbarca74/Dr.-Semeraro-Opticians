import { Component } from '@angular/core';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  template: `
    <main class="container">
      <h1>Catálogo de productos</h1>
      <p>Aquí se mostrarán los aros, lentes y accesorios disponibles.</p>
    </main>
  `,
})
export class CatalogoComponent {}
