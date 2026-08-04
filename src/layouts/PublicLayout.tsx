import { Link, NavLink, Outlet } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../core/auth/auth.context';
import { useTheme } from '../core/theme/theme.context';
import { homePathForRole } from '../core/models/rol';
import { MarcaOptica } from '../shared/MarcaOptica';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'transition-luxe text-[11px] font-semibold uppercase tracking-wider2',
    isActive
      ? 'text-lux-gold'
      : 'text-neutral-600 hover:text-lux-blue dark:text-neutral-400 dark:hover:text-white',
  ].join(' ');

/** Shell del entorno PÚBLICO (portal del paciente) con la identidad de la óptica. */
export const PublicLayout = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen flex-col bg-lux-cream font-sans text-lux-blue transition-luxe dark:bg-[#0a0a0a] dark:text-zinc-100">
      <header className="transition-luxe sticky top-0 z-30 border-b border-lux-blue/10 bg-[#fcfbf9]/80 blur-backdrop dark:border-white/10 dark:bg-[#0a0a0a]/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <Link to="/">
            <MarcaOptica />
          </Link>
          <nav className="flex items-center gap-5 md:gap-6">
            <NavLink to="/" className={navLinkClass} end>
              Inicio
            </NavLink>
            <NavLink to="/especialista" className={navLinkClass}>
              El Especialista
            </NavLink>
            <NavLink to="/catalogo" className={navLinkClass}>
              Vitrina
            </NavLink>
            <NavLink to="/portal" className={navLinkClass}>
              Mi Expediente
            </NavLink>
            <button
              onClick={toggleTheme}
              title="Tema visual"
              className="transition-luxe cursor-pointer rounded-full p-2 text-lux-gold hover:bg-lux-gold/10"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <Sun className="h-4 w-4" strokeWidth={1.5} />
              )}
            </button>
            {isAuthenticated ? (
              <>
                <Link to={homePathForRole(user?.rol)} className={navLinkClass({ isActive: false })}>
                  Panel
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className={navLinkClass({ isActive: false })}
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
                  className="transition-luxe border border-lux-blue px-4 py-2 text-[11px] font-semibold uppercase tracking-wider2 text-lux-blue hover:bg-lux-blue hover:text-white dark:border-lux-gold dark:text-lux-gold dark:hover:bg-lux-gold dark:hover:text-black"
                >
                  Iniciar sesión
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 md:px-6">
        <Outlet />
      </main>

      <footer className="transition-luxe border-t border-lux-blue/5 bg-lux-gray dark:border-white/5 dark:bg-[#070708]">
        <div className="mx-auto max-w-6xl px-4 py-6 text-[10px] uppercase tracking-widest text-neutral-400 md:px-6">
          © {new Date().getFullYear()} Óptica Dr. Luigi Semeraro — Pérez Zeledón, Costa Rica
        </div>
      </footer>
    </div>
  );
};
