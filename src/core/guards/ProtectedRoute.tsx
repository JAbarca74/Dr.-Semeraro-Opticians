import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/auth.context';

/**
 * Permite el acceso solo con sesión activa; si no, redirige al login
 * recordando la ruta de origen.
 */
export const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <Outlet />;
};
