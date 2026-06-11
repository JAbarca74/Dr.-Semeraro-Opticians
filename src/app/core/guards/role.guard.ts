import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Rol } from '../models/rol.model';

/**
 * Genera un guard que restringe la ruta a los roles indicados (RBAC).
 * Ej: canActivate: [roleGuard([Rol.ADMINISTRADOR])]
 */
export const roleGuard = (rolesPermitidos: Rol[]): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    // El esqueleto solo valida la sesion; la comprobacion de rol se completa
    // cuando se decodifique el token o se consulte el perfil del usuario.
    if (auth.isAuthenticated()) {
      return true;
    }

    return router.createUrlTree(['/login']);
  };
};
