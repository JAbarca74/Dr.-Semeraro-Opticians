import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity,
  Calendar,
  Clock,
  Layers,
  LogOut,
  Menu,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../core/auth/auth.context';

interface RecepItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const ITEMS: RecepItem[] = [
  { to: '/recepcion', label: 'Panel Central', icon: Activity, end: true },
  { to: '/recepcion/agenda', label: 'Agenda Médica', icon: Calendar },
  { to: '/recepcion/pacientes', label: 'Expedientes', icon: Users },
  { to: '/recepcion/recetas', label: 'Verificar Receta', icon: ShieldCheck },
  { to: '/recepcion/ventas', label: 'Caja & Ventas', icon: ShoppingBag },
  { to: '/recepcion/existencias', label: 'Existencias', icon: Layers },
  { to: '/recepcion/laboratorio', label: 'Logística Taller', icon: ShieldAlert },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'group relative flex w-full items-center gap-3.5 overflow-hidden py-3.5 text-[11px] font-medium uppercase tracking-widest transition-all duration-300',
    isActive
      ? 'border-l-2 border-lux-gold bg-[#14263f] pl-5 font-bold text-white'
      : 'pl-4 text-neutral-400 hover:text-white',
  ].join(' ');

/** Contenido del sidebar (reutilizado en desktop y en el drawer móvil). */
const SidebarBody = ({
  email,
  onNavigate,
  onLogout,
}: {
  email?: string;
  onNavigate?: () => void;
  onLogout: () => void;
}) => (
  <div className="flex h-full flex-col justify-between">
    {/* Marca */}
    <div>
      <div className="border-b border-[#152945] p-8">
        <span className="block font-serif text-[11px] font-light uppercase tracking-[0.3em] text-neutral-400">
          Óptica
        </span>
        <span className="mt-1 block font-serif text-2xl font-bold uppercase tracking-[0.2em] text-white">
          Semeraro<span className="font-light text-lux-gold">|REC</span>
        </span>
        <div className="mt-4 flex w-fit items-center gap-2 border border-[#1e3452] bg-neutral-900/30 px-2.5 py-1.5">
          <span className="h-1.5 w-1.5 animate-pulse bg-lux-gold" />
          <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-[#a8c5e6]">
            Sesión: Recepción
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-6">
        <div className="mb-4 px-5 text-[9px] font-bold uppercase tracking-[0.25em] text-[#5d7a9e]">
          Módulos Administrativos
        </div>
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate} className={linkClass}>
              {({ isActive }) => (
                <>
                  {!isActive ? (
                    <span className="absolute inset-0 -z-10 -translate-x-full bg-[#10233c] transition-transform duration-300 ease-out group-hover:translate-x-0" />
                  ) : null}
                  <Icon
                    className={[
                      'h-4 w-4 transition-transform duration-300 group-hover:scale-110',
                      isActive ? 'text-lux-gold' : 'text-neutral-500 group-hover:text-neutral-300',
                    ].join(' ')}
                  />
                  <span className="relative transition-transform duration-300 group-hover:translate-x-1.5">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>

    {/* Operador + logout */}
    <div className="border-t border-[#152945] bg-neutral-950/20 p-6">
      <div className="mb-5 flex items-center gap-3 border border-[#152945] bg-[#10233c]/40 p-3">
        <div className="flex h-10 w-10 items-center justify-center border border-lux-gold/30 bg-lux-gold/20 font-serif text-sm font-medium tracking-widest text-lux-gold">
          {(email ?? 'RE').substring(0, 2).toUpperCase()}
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="truncate font-sans text-xs font-bold uppercase tracking-wide text-neutral-100">
            {email ?? 'Recepción'}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#7192ba]">
            Front desk
          </span>
        </div>
      </div>
      <div className="mb-4 flex items-center gap-2 pl-1 font-mono text-[10px] uppercase tracking-widest text-[#7192ba]">
        <Clock className="h-3.5 w-3.5 text-lux-gold" />
        <span>Pérez Zeledón, CR</span>
      </div>
      <button
        onClick={onLogout}
        className="flex w-full cursor-pointer items-center justify-center gap-2 border border-[#1e3452] py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400 transition-all duration-300 hover:border-lux-gold hover:bg-lux-gold hover:text-lux-dark"
      >
        <LogOut className="h-3.5 w-3.5" />
        Cerrar sesión
      </button>
    </div>
  </div>
);

/** Shell del entorno de RECEPCIÓN (front desk) con sidebar navy editorial. */
export const ReceptionLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const onLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-[#fdfdfd] font-sans text-[#1a1a1a] dark:bg-[#111315] dark:text-[#e0e0e0]">
      {/* Sidebar desktop */}
      <aside className="sticky top-0 z-10 hidden h-screen w-72 shrink-0 flex-col border-r border-[#152945] bg-lux-dark text-neutral-100 shadow-xl lg:flex">
        <SidebarBody email={user?.email} onLogout={onLogout} />
      </aside>

      {/* Drawer móvil */}
      <AnimatePresence>
        {menuOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              className="fixed inset-0 z-40 cursor-pointer bg-black lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="fixed inset-y-0 left-0 z-50 w-72 border-r border-[#152945] bg-lux-dark text-neutral-100 shadow-2xl lg:hidden"
            >
              <SidebarBody
                email={user?.email}
                onNavigate={() => setMenuOpen(false)}
                onLogout={onLogout}
              />
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      {/* Contenido */}
      <div className="flex flex-1 flex-col">
        {/* Barra superior móvil */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3 dark:border-neutral-800 lg:hidden">
          <button
            onClick={() => setMenuOpen(true)}
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-lux-dark dark:text-white"
          >
            <Menu className="h-4 w-4" /> Menú
          </button>
          <span className="font-serif text-lg font-bold uppercase tracking-widest text-lux-dark dark:text-white">
            Semeraro<span className="text-lux-gold">|REC</span>
          </span>
        </div>

        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="flex flex-col items-center justify-between gap-2 border-t border-stone-200 px-6 py-6 font-mono text-[9px] uppercase tracking-widest text-neutral-400 dark:border-neutral-800 sm:flex-row">
          <div className="flex flex-wrap justify-center gap-4">
            <span>Situación: Online</span>
            <span>Autenticación: JWT</span>
            <span>Sello receta: SHA-256</span>
          </div>
          <button
            onClick={() => navigate('/')}
            className="transition-luxe hover:text-lux-blue"
          >
            Portal público →
          </button>
        </footer>
      </div>
    </div>
  );
};
