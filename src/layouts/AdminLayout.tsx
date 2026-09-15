import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Moon,
  Sun,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../core/auth/auth.context';
import { SelectorIdioma } from '../shared/SelectorIdioma';
import { useIdioma } from '../core/i18n/idioma.context';
import type { ClaveTexto } from '../core/i18n/catalogos/es';
import { useTheme } from '../core/theme/theme.context';
import { Rol, rolLabel } from '../core/models/rol';
import { MarcaOptica } from '../shared/MarcaOptica';

interface NavItem {
  to: string;
  label: ClaveTexto;
  drawerLabel: ClaveTexto;
  roles?: Rol[];
  end?: boolean;
  /**
   * Se queda fuera de la barra superior y vive **solo en el cajón «Menú»**.
   *
   * La barra tiene un ancho finito y la lista creció a diez entradas en el
   * sprint 8: pasada de ese punto, el rótulo de la marca choca con el primer
   * enlace y los controles de sesión se salen de la pantalla. Se marcan así las
   * pantallas de administración que no se usan a diario; el cajón las sigue
   * ofreciendo todas, así que no se pierde ningún destino.
   */
  soloCajon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  // `/admin` renderiza el DashboardPage; las métricas viven en `/admin/metricas`.
  // Rotularlo «Métricas» mandaba a la gente al sitio equivocado.
  { to: '/admin', label: 'nav.admin.panel', drawerLabel: 'nav.admin.panelCajon', end: true },
  {
    to: '/admin/personas',
    label: 'nav.admin.personas',
    drawerLabel: 'nav.admin.personasCajon',
  },
  {
    to: '/admin/expedientes',
    label: 'nav.admin.expedientes',
    drawerLabel: 'nav.admin.expedientesCajon',
    roles: [Rol.DOCTOR, Rol.ADMINISTRADOR],
  },
  // El listado de productos sí lo puede leer cualquiera, pero el detalle y el
  // kardex son `[ADMINISTRADOR, RECEPCION]`: al Doctor la tabla le cargaba y
  // luego fallaba al abrir un producto.
  {
    to: '/admin/inventario',
    label: 'nav.admin.bodega',
    drawerLabel: 'nav.admin.bodegaCajon',
    roles: [Rol.ADMINISTRADOR],
  },
  // ⚠️ `roles` aquí no es cosmética: sin ella el Doctor veía el enlace, lo
  // pulsaba y el router lo devolvía al panel. La API de ventas es
  // `[ADMINISTRADOR, RECEPCION]` y bajo `/admin` solo llega el Administrador.
  {
    to: '/admin/ventas',
    label: 'nav.admin.ventas',
    drawerLabel: 'nav.admin.ventasCajon',
    roles: [Rol.ADMINISTRADOR],
  },
  {
    to: '/admin/agenda',
    label: 'nav.admin.citas',
    drawerLabel: 'nav.admin.citasCajon',
  },
  {
    to: '/admin/laboratorio',
    label: 'nav.admin.laboratorio',
    drawerLabel: 'nav.admin.laboratorioCajon',
  },
  {
    to: '/admin/usuarios',
    label: 'nav.admin.usuarios',
    drawerLabel: 'nav.admin.usuariosCajon',
    roles: [Rol.ADMINISTRADOR],
    soloCajon: true,
  },
  {
    to: '/admin/auditoria',
    label: 'nav.admin.auditoria',
    drawerLabel: 'nav.admin.auditoriaCajon',
    roles: [Rol.ADMINISTRADOR],
    soloCajon: true,
  },
  // Estaba huérfana: existía la ruta pero no había un solo enlace a ella.
  // `roles` por la precondición de CU-19: «Dashboard exclusivo para la
  // administración». El Doctor no ve la facturación de la óptica.
  {
    to: '/admin/metricas',
    label: 'nav.admin.metricas',
    drawerLabel: 'nav.admin.metricasCajon',
    roles: [Rol.ADMINISTRADOR],
    soloCajon: true,
  },
];

/** Shell del entorno PRIVADO con la identidad de Óptica Dr. Luigi Semeraro. */
export const AdminLayout = () => {
  const { user, logout, hasRole } = useAuth();
  const { t } = useIdioma();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  /** Todo lo que el rol puede ver: alimenta el cajón «Menú». */
  const visibleItems = NAV_ITEMS.filter((i) => !i.roles || hasRole(i.roles));
  /** Lo que cabe en la barra superior sin desbordarla. */
  const barraItems = visibleItems.filter((i) => !i.soloCajon);

  const onLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate('/login', { replace: true });
  };

  const iniciales = (user?.email ?? 'OP').substring(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-lux-cream font-sans text-lux-blue transition-luxe dark:bg-[#0a0a0a] dark:text-zinc-100">
      {/* NAVBAR CORPORATIVO STICKY */}
      <header className="transition-luxe sticky top-0 z-40 border-b border-lux-blue/10 bg-[#fcfbf9]/80 blur-backdrop dark:border-white/10 dark:bg-[#0a0a0a]/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Marca */}
          <button
            onClick={() => navigate('/admin')}
            className="flex cursor-pointer items-center gap-3"
          >
            <MarcaOptica />
          </button>

          {/* Navegación central (escritorio ancho).
              Enciende en `xl` (1280 px) y no en `lg`: entre 1024 y 1280 la
              barra no cabe junto a la marca y los controles de sesión, y el
              encabezado se desbordaba en horizontal. Por debajo manda el
              cajón, que lleva la lista completa. */}
          <nav className="hidden items-center gap-6 xl:flex 2xl:gap-8">
            {barraItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    'relative whitespace-nowrap py-1.5 text-[11px] font-semibold uppercase tracking-wider2 transition-luxe',
                    isActive
                      ? 'text-lux-tinta'
                      : 'text-neutral-600 hover:text-lux-blue dark:text-neutral-400 dark:hover:text-white',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <>
                    <span>{t(item.label)}</span>
                    {isActive ? (
                      <motion.span
                        layoutId="navIndicator"
                        className="absolute inset-x-0 -bottom-0.5 h-px bg-lux-tinta"
                        transition={{
                          type: 'spring',
                          stiffness: 350,
                          damping: 25,
                        }}
                      />
                    ) : null}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Utilidades */}
          <div className="flex items-center gap-3">
            <SelectorIdioma className="hidden sm:flex" />
            <button
              onClick={toggleTheme}
              title={t('comun.tema.titulo')}
              className="transition-luxe cursor-pointer rounded-full p-2 text-lux-tinta hover:bg-lux-tinta/10"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <Sun className="h-4 w-4" strokeWidth={1.5} />
              )}
            </button>
            <button
              onClick={() => setMenuOpen(true)}
              className="transition-luxe flex cursor-pointer items-center gap-1.5 border border-lux-blue px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-lux-blue hover:bg-lux-blue hover:text-white dark:border-lux-tinta-claro dark:text-lux-tinta-claro dark:hover:bg-lux-tinta-claro dark:hover:text-black"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lux-tinta" />
              <Menu className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('publico.menu.etiqueta')}</span>
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
            <span className="block text-[10px] font-medium uppercase tracking-widest text-lux-tinta">
              Óptica Dr. Luigi Semeraro
            </span>
            <span className="block text-[9px] uppercase tracking-wider text-neutral-400">
              Pérez Zeledón, Costa Rica · Coordinación de cristales vía
              OptiCenter Lab
            </span>
          </div>
          <span className="font-mono text-[9px] text-neutral-400">
            © {new Date().getFullYear()} Dr. Luigi Semeraro Román · Licencia
            COPT-4421
          </span>
        </div>
      </footer>

      {/* MEGA MENÚ OFF-CANVAS.

          ⚠️ Siempre montado, y abierto/cerrado con una **transición CSS**, no
          con `AnimatePresence` ni con `animate` de framer. La razón es que el
          estado visible no puede depender de que una animación llegue a su
          final: framer anima con `requestAnimationFrame`, que el navegador
          **congela en una pestaña en segundo plano**, y ahí la salida nunca
          termina. Con `AnimatePresence` eso deja la capa oscura montada a
          pantalla completa con `pointer-events: auto` —invisible y tragándose
          todos los clics—. Con CSS, el estado final se aplica siempre.

          `pointer-events-none` y `aria-hidden` al cerrar cierran el asunto: la
          interactividad de la página depende del estado de React y de nada más.
          Ver `06-estado-y-hallazgos.md` §3.22. */}
      <div
        onClick={() => setMenuOpen(false)}
        aria-hidden
        className={[
          'fixed inset-0 z-50 bg-black transition-opacity duration-300',
          menuOpen
            ? 'cursor-pointer opacity-60'
            : 'pointer-events-none opacity-0',
        ].join(' ')}
      />
      <aside
        aria-hidden={!menuOpen}
        className={[
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col justify-between border-l border-lux-blue/10 bg-lux-cream p-8 shadow-2xl transition-transform duration-300 ease-out dark:border-white/10 dark:bg-[#0a0a0b]',
          menuOpen ? 'translate-x-0' : 'pointer-events-none translate-x-full',
        ].join(' ')}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-lux-tinta/20 pb-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-lux-tinta">{t('nav.admin.menuOperaciones')}</span>
              <MarcaOptica tamano="sm" />
            </div>
            <button
              onClick={() => setMenuOpen(false)}
              className="transition-luxe cursor-pointer rounded-full border border-neutral-200 p-2 hover:bg-neutral-100 dark:border-white/10 dark:hover:bg-white/5"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="space-y-1 pt-2">
            {visibleItems.map((item) => {
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
                      ? 'bg-lux-tinta/5 text-lux-tinta'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-lux-blue dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-white',
                  ].join(' ')}
                >
                  <span>{t(item.drawerLabel)}</span>
                  {active ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-lux-tinta" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                  )}
                </button>
              );
            })}
            <button
              onClick={() => {
                navigate('/admin/cuenta');
                setMenuOpen(false);
              }}
              className="transition-luxe flex w-full items-center justify-between border-b border-neutral-100 px-3.5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-neutral-600 hover:bg-neutral-50 hover:text-lux-blue dark:border-white/5 dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-white"
            >
              <span>{t('nav.admin.cuenta')}</span>
              <ChevronRight className="h-3.5 w-3.5 opacity-40" />
            </button>
            {/* El Administrador tiene permiso sobre el front desk
                      (`RoleRoute [RECEPCION, ADMINISTRADOR]`), pero hasta ahora
                      solo se llegaba escribiendo la URL: una ruta huérfana. */}
            {hasRole([Rol.ADMINISTRADOR]) ? (
              <button
                onClick={() => {
                  navigate('/recepcion');
                  setMenuOpen(false);
                }}
                className="transition-luxe flex w-full items-center justify-between border-b border-neutral-100 px-3.5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-neutral-600 hover:bg-neutral-50 hover:text-lux-blue dark:border-white/5 dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-white"
              >
                <span>{t('nav.admin.irRecepcion')}</span>
                <ChevronRight className="h-3.5 w-3.5 opacity-40" />
              </button>
            ) : null}
          </nav>

          <div className="flex items-center gap-1.5 border border-neutral-100 bg-neutral-50 p-4 text-[9px] font-bold uppercase tracking-widest text-lux-tinta dark:border-white/5 dark:bg-white/5">
            <Sparkles className="h-3.5 w-3.5" />{t('nav.admin.sesionRbac')}</div>
        </div>

        {/* Tarjeta de usuario + logout */}
        <div className="space-y-4 border-t border-lux-tinta/20 pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lux-tinta font-serif font-bold uppercase text-white">
              {iniciales}
            </div>
            <div className="overflow-hidden">
              <span className="block max-w-[200px] truncate text-xs font-bold">
                {user?.email}
              </span>
              <span className="mt-1 block font-mono text-[9px] uppercase leading-none tracking-wider text-lux-tinta">
                {rolLabel(user?.rol)} · Autenticado
              </span>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="transition-luxe flex w-full cursor-pointer items-center justify-center gap-2 border border-red-200 bg-red-50 p-2.5 text-[10px] font-bold uppercase tracking-widest text-red-700 hover:bg-red-100 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            <LogOut className="h-3.5 w-3.5" />{t('nav.admin.salir')}</button>
        </div>
      </aside>
    </div>
  );
};
