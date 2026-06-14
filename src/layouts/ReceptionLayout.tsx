import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronRight,
  LogOut,
  Menu,
  Moon,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import { useAuth } from '../core/auth/auth.context';
import { useTheme } from '../core/theme/theme.context';

interface NavItem {
  to: string;
  label: string;
  drawerLabel: string;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/recepcion', label: 'Panel', drawerLabel: 'Panel Central', end: true },
  { to: '/recepcion/pacientes', label: 'Expedientes', drawerLabel: 'Expedientes de Pacientes' },
  { to: '/recepcion/recetas', label: 'Verificar', drawerLabel: 'Verificar Receta' },
  { to: '/recepcion/agenda', label: 'Citas', drawerLabel: 'Agenda Médica' },
  { to: '/recepcion/ventas', label: 'Caja & Ventas', drawerLabel: 'Caja y Cobro Diario' },
  { to: '/recepcion/existencias', label: 'Existencias', drawerLabel: 'Existencias de Bodega' },
  { to: '/recepcion/laboratorio', label: 'Lab', drawerLabel: 'Logística de Taller' },
];

/**
 * Shell del entorno de RECEPCIÓN (front desk).
 * Comparte el mismo navbar editorial que el panel administrativo para una
 * identidad visual unificada entre las tres vistas.
 */
export const ReceptionLayout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const onLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const iniciales = (user?.email ?? 'RE').substring(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-lux-cream font-sans text-lux-blue transition-luxe dark:bg-[#0a0a0a] dark:text-zinc-100">
      {/* NAVBAR CORPORATIVO STICKY (idéntico al panel admin) */}
      <header className="transition-luxe sticky top-0 z-40 border-b border-lux-blue/10 bg-[#fcfbf9]/80 blur-backdrop dark:border-white/10 dark:bg-[#0a0a0a]/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Marca */}
          <button
            onClick={() => navigate('/recepcion')}
            className="flex cursor-pointer items-center gap-3"
          >
            <span className="font-display text-sm font-light uppercase tracking-luxe md:text-base">
              ESSILORLUXOTTICA
            </span>
            <span className="text-xs font-light text-lux-gold/40">|</span>
            <span className="font-serif text-xs italic tracking-normal text-lux-gold md:text-sm">
              Recepción · Dr. Semeraro
            </span>
          </button>

          {/* Navegación central (desktop) */}
          <nav className="hidden items-center gap-6 lg:flex xl:gap-8">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    'relative whitespace-nowrap py-1.5 text-[11px] font-semibold uppercase tracking-wider2 transition-luxe',
                    isActive
                      ? 'text-lux-gold'
                      : 'text-neutral-600 hover:text-lux-blue dark:text-neutral-400 dark:hover:text-white',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{item.label}</span>
                    {isActive ? (
                      <motion.span
                        layoutId="recepNavIndicator"
                        className="absolute inset-x-0 -bottom-0.5 h-px bg-lux-gold"
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                      />
                    ) : null}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Utilidades */}
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[10px] tracking-wider opacity-60 sm:inline-block">
              ES / EN
            </span>
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
            <button
              onClick={() => setMenuOpen(true)}
              className="transition-luxe flex cursor-pointer items-center gap-1.5 border border-lux-blue px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-lux-blue hover:bg-lux-blue hover:text-white dark:border-lux-gold dark:text-lux-gold dark:hover:bg-lux-gold dark:hover:text-black"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lux-gold" />
              <Menu className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Menú</span>
            </button>
          </div>
        </div>
      </header>

      {/* CUERPO con transición de página spring + blur */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6 md:py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12, filter: 'blur(3px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -12, filter: 'blur(3px)' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="transition-luxe border-t border-lux-blue/5 bg-lux-gray py-8 text-center dark:border-white/5 dark:bg-[#070708]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <div className="space-y-1 text-left">
            <span className="block text-[10px] font-medium uppercase tracking-widest text-lux-gold">
              EssilorLuxottica Prestige Network · Recepción
            </span>
            <span className="block text-[9px] uppercase tracking-wider text-neutral-400">
              Front desk · Pérez Zeledón, Costa Rica · Sello de receta SHA-256
            </span>
          </div>
          <span className="font-mono text-[9px] text-neutral-400">
            © {new Date().getFullYear()} Dr. Luigi Semeraro Román · Licencia COPT-4421
          </span>
        </div>
      </footer>

      {/* MEGA MENÚ OFF-CANVAS (idéntico al panel admin) */}
      <AnimatePresence>
        {menuOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-50 cursor-pointer bg-black"
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col justify-between border-l border-lux-blue/10 bg-lux-cream p-8 shadow-2xl dark:border-white/10 dark:bg-[#0a0a0b]"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-lux-gold/20 pb-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-lux-gold">
                      Menú de Recepción
                    </span>
                    <span className="mt-1 font-serif text-lg italic leading-tight">
                      EssilorLuxottica Portal
                    </span>
                  </div>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="transition-luxe cursor-pointer rounded-full border border-neutral-200 p-2 hover:bg-neutral-100 dark:border-white/10 dark:hover:bg-white/5"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <nav className="space-y-1 pt-2">
                  {NAV_ITEMS.map((item) => {
                    const active = item.end
                      ? location.pathname === item.to
                      : location.pathname.startsWith(item.to);
                    return (
                      <button
                        key={item.to}
                        onClick={() => {
                          navigate(item.to);
                          setMenuOpen(false);
                        }}
                        className={[
                          'transition-luxe flex w-full items-center justify-between border-b px-3.5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest',
                          'border-neutral-100 dark:border-white/5',
                          active
                            ? 'bg-lux-gold/5 text-lux-gold'
                            : 'text-neutral-600 hover:bg-neutral-50 hover:text-lux-blue dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-white',
                        ].join(' ')}
                      >
                        <span>{item.drawerLabel}</span>
                        {active ? (
                          <span className="h-1.5 w-1.5 rounded-full bg-lux-gold" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                        )}
                      </button>
                    );
                  })}
                </nav>

                <div className="flex items-center gap-1.5 border border-neutral-100 bg-neutral-50 p-4 text-[9px] font-bold uppercase tracking-widest text-lux-gold dark:border-white/5 dark:bg-white/5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Sesión de recepción · RBAC activo
                </div>
              </div>

              {/* Tarjeta de usuario + logout */}
              <div className="space-y-4 border-t border-lux-gold/20 pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lux-gold font-serif font-bold uppercase text-black">
                    {iniciales}
                  </div>
                  <div className="overflow-hidden">
                    <span className="block max-w-[200px] truncate text-xs font-bold">
                      {user?.email}
                    </span>
                    <span className="mt-1 block font-mono text-[9px] uppercase leading-none tracking-wider text-lux-gold">
                      {user?.rol} · Front desk
                    </span>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="transition-luxe flex w-full cursor-pointer items-center justify-center gap-2 border border-red-200 bg-red-50 p-2.5 text-[10px] font-bold uppercase tracking-widest text-red-700 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Cerrar sesión
                </button>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
