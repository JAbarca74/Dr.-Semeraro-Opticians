import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ChevronRight, Menu, Moon, Sun, X } from 'lucide-react';
import { useAuth } from '../core/auth/auth.context';
import { useTheme } from '../core/theme/theme.context';
import { Rol } from '../core/models/rol';
import { homePathForRole } from '../core/models/rol';
import { MarcaOptica } from '../shared/MarcaOptica';
import { BotonWhatsappFlotante } from '../shared/BotonWhatsappFlotante';
import { SelectorIdioma } from '../shared/SelectorIdioma';
import { useIdioma } from '../core/i18n/idioma.context';
import type { ClaveTexto } from '../core/i18n/catalogos/es';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'transition-luxe text-[11px] font-semibold uppercase tracking-wider2',
    isActive
      ? 'text-lux-tinta'
      : 'text-neutral-600 hover:text-lux-blue dark:text-neutral-400 dark:hover:text-white',
  ].join(' ');

/**
 * Enlaces de la vitrina pública, comunes a la barra y al cajón.
 *
 * Guardan la **clave**, no el rótulo: el texto se resuelve al pintar, así que
 * cambiar de idioma renombra los enlaces sin tocar esta lista (`DSO-54`).
 */
const ENLACES_PUBLICOS: { to: string; clave: ClaveTexto; end?: boolean }[] = [
  { to: '/', clave: 'nav.publico.inicio', end: true },
  { to: '/especialista', clave: 'nav.publico.especialista' },
  { to: '/catalogo', clave: 'nav.publico.catalogo' },
  { to: '/agendar', clave: 'nav.publico.agendar' },
];

/** Shell del entorno PÚBLICO (portal del paciente) con la identidad de la óptica. */
export const PublicLayout = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useIdioma();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const esPortalPrivado =
    user?.rol === Rol.PACIENTE &&
    ['/portal', '/pedidos', '/mi-cuenta'].includes(location.pathname);

  // Cambiar de página cierra el cajón: si no, al volver atrás con el navegador
  // la capa oscura se queda encima del contenido.
  useEffect(() => setMenuOpen(false), [location.pathname]);

  const claseCajon =
    'transition-luxe flex w-full items-center justify-between border-b border-neutral-100 px-3.5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-neutral-600 hover:bg-neutral-50 hover:text-lux-blue dark:border-white/5 dark:text-neutral-400 dark:hover:bg-white/5 dark:hover:text-white';

  return (
    <div className="flex min-h-screen flex-col bg-lux-cream font-sans text-lux-blue transition-luxe dark:bg-[#0a0a0a] dark:text-zinc-100">
      <header className="transition-luxe sticky top-0 z-30 border-b border-lux-blue/10 bg-lux-cream/80 blur-backdrop dark:border-white/10 dark:bg-[#0a0a0a]/80">
        {/* `gap-6`: sin separación mínima la marca llegaba a tocar el primer
            enlace cuando la barra se quedaba justa de ancho. */}
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-4 py-4 md:px-6">
          <Link to="/">
            <MarcaOptica />
          </Link>

          <div className="flex items-center gap-5 md:gap-6">
            {/* Barra de enlaces: solo desde `lg` (1024 px). Antes era un `flex`
                sin punto de corte, así que en un móvil de 375 px la página se
                maquetaba a 903 y había que arrastrarla en horizontal para leerla
                (hallazgo §3.8). Por debajo de `lg` mandan el cajón y su botón. */}
            <nav className="hidden items-center gap-5 lg:flex xl:gap-6">
              {ENLACES_PUBLICOS.map((e) => (
                <NavLink
                  key={e.to}
                  to={e.to}
                  className={
                    e.to === '/agendar'
                      ? 'transition-luxe bg-lux-blue px-4 py-2 text-[11px] font-semibold uppercase tracking-wider2 text-white hover:bg-lux-tinta dark:bg-lux-tinta-claro dark:text-black'
                      : navLinkClass
                  }
                  end={e.end}
                >
                  {t(e.clave)}
                </NavLink>
              ))}
              {isAuthenticated ? (
                <>
                  {/* `/pedidos` exige sesión y no tenía ningún enlace: solo se
                      llegaba escribiendo la URL a mano. */}
                  {esPortalPrivado ? (
                    <NavLink to="/portal" className={navLinkClass}>
                      {t('nav.publico.portal')}
                    </NavLink>
                  ) : null}
                  {esPortalPrivado ? (
                    <NavLink to="/pedidos" className={navLinkClass}>
                      {t('nav.publico.pedidos')}
                    </NavLink>
                  ) : null}
                  <Link
                    to={
                      esPortalPrivado
                        ? '/mi-cuenta'
                        : homePathForRole(user?.rol)
                    }
                    className={navLinkClass({ isActive: false })}
                  >
                    {t(esPortalPrivado ? 'cuenta.titulo' : 'nav.publico.panel')}
                  </Link>
                  <button
                    type="button"
                    onClick={logout}
                    className={navLinkClass({ isActive: false })}
                  >
                    {t('nav.publico.salir')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="transition-luxe border border-lux-blue px-4 py-2 text-[11px] font-semibold uppercase tracking-wider2 text-lux-blue hover:bg-lux-blue hover:text-white dark:border-lux-tinta-claro dark:text-lux-tinta-claro dark:hover:bg-lux-tinta-claro dark:hover:text-black"
                  >
                    {t('nav.publico.entrar')}
                  </Link>
                </>
              )}
            </nav>

            {/* El sitio público no tenía ni el `ES / EN` de adorno que había en
                login y administración, y es justo donde más falta hace: es lo
                que ve un paciente extranjero antes de tener cuenta. */}
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
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label={t('publico.menu.abrir')}
              className="transition-luxe flex cursor-pointer items-center gap-1.5 border border-lux-blue px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-lux-blue hover:bg-lux-blue hover:text-white dark:border-lux-tinta-claro dark:text-lux-tinta-claro dark:hover:bg-lux-tinta-claro dark:hover:text-black lg:hidden"
            >
              <Menu className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">
                {t('publico.menu.etiqueta')}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Cajón de navegación para móvil y tableta.

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
          'fixed inset-0 z-40 bg-black transition-opacity duration-300',
          menuOpen
            ? 'cursor-pointer opacity-60'
            : 'pointer-events-none opacity-0',
        ].join(' ')}
      />
      <aside
        aria-hidden={!menuOpen}
        className={[
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col gap-6 border-l border-lux-blue/10 bg-lux-cream p-8 shadow-2xl transition-transform duration-300 ease-out dark:border-white/10 dark:bg-[#0a0a0b]',
          menuOpen ? 'translate-x-0' : 'pointer-events-none translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center justify-between border-b border-lux-tinta/20 pb-4">
          <MarcaOptica tamano="sm" />
          <button
            onClick={() => setMenuOpen(false)}
            aria-label={t('publico.menu.cerrar')}
            className="transition-luxe cursor-pointer rounded-full border border-neutral-200 p-2 hover:bg-neutral-100 dark:border-white/10 dark:hover:bg-white/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="space-y-1">
          {ENLACES_PUBLICOS.map((e) => (
            <NavLink
              key={e.to}
              to={e.to}
              end={e.end}
              onClick={() => setMenuOpen(false)}
              className={claseCajon}
            >
              <span>{t(e.clave)}</span>
              <ChevronRight className="h-3.5 w-3.5 opacity-40" />
            </NavLink>
          ))}
          {isAuthenticated ? (
            <>
              {esPortalPrivado ? (
                <NavLink to="/portal" className={claseCajon}>
                  {t('nav.publico.portal')}
                </NavLink>
              ) : null}
              {esPortalPrivado ? (
                <NavLink
                  to="/pedidos"
                  onClick={() => setMenuOpen(false)}
                  className={claseCajon}
                >
                  <span>{t('nav.publico.pedidos')}</span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-40" />
                </NavLink>
              ) : null}
              <Link
                to={esPortalPrivado ? '/mi-cuenta' : homePathForRole(user?.rol)}
                onClick={() => setMenuOpen(false)}
                className={claseCajon}
              >
                <span>
                  {t(esPortalPrivado ? 'cuenta.titulo' : 'nav.publico.panel')}
                </span>
                <ChevronRight className="h-3.5 w-3.5 opacity-40" />
              </Link>
              <button type="button" onClick={logout} className={claseCajon}>
                <span>{t('nav.publico.salir')}</span>
                <ChevronRight className="h-3.5 w-3.5 opacity-40" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className={claseCajon}
              >
                <span>{t('nav.publico.entrar')}</span>
                <ChevronRight className="h-3.5 w-3.5 opacity-40" />
              </Link>
            </>
          )}
        </nav>
      </aside>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 md:px-6">
        <Outlet />
      </main>

      {/*
        Flujo alterno de CU-11 («Contacto rápido»): el icono flotante vive en el
        layout, no en una página, porque el caso de uso lo quiere disponible en
        todas. Ver `shared/BotonWhatsappFlotante.tsx`.
      */}
      <BotonWhatsappFlotante />

      <footer className="transition-luxe border-t border-lux-blue/5 bg-lux-gray dark:border-white/5 dark:bg-[#070708]">
        <div className="mx-auto max-w-6xl px-4 py-6 text-[10px] uppercase tracking-widest text-neutral-400 md:px-6">
          © {new Date().getFullYear()} {t('publico.pie.ubicacion')}
        </div>
      </footer>
    </div>
  );
};
