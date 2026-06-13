import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { LoginRequest, UsuarioSesion } from '../models/usuario';
import type { Rol } from '../models/rol';
import { clearToken, getToken, getUserFromToken, setToken } from './token';
import { loginRequest, logoutRequest } from './auth.service';

interface AuthContextValue {
  user: UsuarioSesion | null;
  isAuthenticated: boolean;
  login: (credenciales: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roles: Rol[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UsuarioSesion | null>(() => {
    const token = getToken();
    return token ? getUserFromToken(token) : null;
  });

  const login = useCallback(async (credenciales: LoginRequest) => {
    const { accessToken } = await loginRequest(credenciales);
    setToken(accessToken);
    setUser(getUserFromToken(accessToken));
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
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
