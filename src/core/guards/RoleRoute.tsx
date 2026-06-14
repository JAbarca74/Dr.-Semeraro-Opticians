import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/auth.context';
import { homePathForRole, type Rol } from '../models/rol';

/**
 * Restringe la ruta a los roles indicados (RBAC real). Requiere sesión activa
 * y que el rol del usuario esté entre los permitidos; si no, redirige al
 * inicio del entorno correspondiente a su rol (evita bucles de redirección).
 */
export const RoleRoute = ({ roles }: { roles: Rol[] }) => {
  const { isAuthenticated, hasRole, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!hasRole(roles)) {
    return <Navigate to={homePathForRole(user?.rol)} replace />;
  }
  return <Outlet />;
};
