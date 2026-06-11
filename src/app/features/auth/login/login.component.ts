import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <main class="container">
      <h1>Iniciar sesión</h1>
      <form (ngSubmit)="onSubmit()">
        <label>
          Correo
          <input type="email" name="email" [(ngModel)]="email" required />
        </label>
        <label>
          Contraseña
          <input
            type="password"
            name="password"
            [(ngModel)]="password"
            required
          />
        </label>
        <button type="submit">Ingresar</button>
      </form>
      @if (error) {
        <p class="error">{{ error }}</p>
      }
    </main>
  `,
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  onSubmit(): void {
    this.error = '';
    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: () => this.router.navigate(['/admin']),
      error: () => (this.error = 'Credenciales inválidas'),
    });
  }
}
