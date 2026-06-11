import { Component } from '@angular/core';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  template: `
    <main class="container">
      <h1>Usuarios y roles</h1>
      <p>Gestión de usuarios del sistema y asignación de roles (RBAC).</p>
    </main>
  `,
})
export class UsuariosComponent {}
