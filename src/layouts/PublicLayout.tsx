import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../core/auth/auth.context';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'text-slate-900 font-medium' : 'text-slate-600 hover:text-slate-900';

/** Shell del entorno PÚBLICO (portal del paciente). */
export const PublicLayout = () => {
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-800">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            Óptica Dr. Semeraro
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            <NavLink to="/" className={navLinkClass} end>
              Inicio
            </NavLink>
            <NavLink to="/catalogo" className={navLinkClass}>
              Catálogo
            </NavLink>
            <NavLink to="/especialista" className={navLinkClass}>
              Especialista
            </NavLink>
            {isAuthenticated ? (
              <>
                <Link to="/admin" className="text-slate-600 hover:text-slate-900">
                  Panel
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="text-slate-600 hover:text-slate-900"
                >
                  Salir
                </button>
              </>
            ) : (
              <>
                <NavLink to="/registro" className={navLinkClass}>
                  Crear cuenta
                </NavLink>
                <Link
                  to="/login"
                  className="rounded bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700"
                >
                  Iniciar sesión
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500">
          © {new Date().getFullYear()} Óptica Dr. Semeraro — Pérez Zeledón, Costa Rica.
        </div>
      </footer>
    </div>
  );
};
