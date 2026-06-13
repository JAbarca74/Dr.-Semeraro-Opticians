import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/auth.context';
import type { Rol } from '../models/rol';

/**
 * Restringe la ruta a los roles indicados (RBAC real). Requiere sesión activa
 * y que el rol del usuario esté entre los permitidos.
 */
export const RoleRoute = ({ roles }: { roles: Rol[] }) => {
  const { isAuthenticated, hasRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!hasRole(roles)) {
    return <Navigate to="/admin" replace />;
  }
  return <Outlet />;
};
