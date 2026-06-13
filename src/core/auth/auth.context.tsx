import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { LoginRequest, Usuario } from '../models/usuario';
import type { Rol } from '../models/rol';
import { clearToken, getToken, getUserFromToken, setToken } from './token';
import { loginRequest } from './auth.service';

interface AuthContextValue {
  user: Usuario | null;
  isAuthenticated: boolean;
  login: (credenciales: LoginRequest) => Promise<void>;
  logout: () => void;
  hasRole: (roles: Rol[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Usuario | null>(() => {
    const token = getToken();
    return token ? getUserFromToken(token) : null;
  });

  const login = useCallback(async (credenciales: LoginRequest) => {
    const { accessToken } = await loginRequest(credenciales);
    setToken(accessToken);
    setUser(getUserFromToken(accessToken));
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (roles: Rol[]) => (user ? roles.includes(user.rol) : false),
    [user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, login, logout, hasRole }),
    [user, login, logout, hasRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return ctx;
};
