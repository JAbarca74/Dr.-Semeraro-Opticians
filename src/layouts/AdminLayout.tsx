import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../core/auth/auth.context';
import { Rol } from '../core/models/rol';

const itemClass = ({ isActive }: { isActive: boolean }) =>
  [
    'block rounded px-3 py-2 text-sm',
    isActive
      ? 'bg-slate-900 text-white'
      : 'text-slate-700 hover:bg-slate-100',
  ].join(' ');

/** Shell del entorno PRIVADO (panel administrativo). */
export const AdminLayout = () => {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800">
      <aside className="flex w-60 flex-col border-r border-slate-200 bg-white">
        <div className="px-4 py-4 text-base font-semibold">Panel · Óptica</div>
        <nav className="flex-1 space-y-1 px-2">
          <NavLink to="/admin" end className={itemClass}>
            Inicio
          </NavLink>
          <NavLink to="/admin/personas" className={itemClass}>
            Personas
          </NavLink>
          <NavLink to="/admin/agenda" className={itemClass}>
            Agenda y citas
          </NavLink>
          {hasRole([Rol.DOCTOR, Rol.ADMINISTRADOR]) ? (
            <NavLink to="/admin/expedientes" className={itemClass}>
              Expedientes
            </NavLink>
          ) : null}
          <NavLink to="/admin/inventario" className={itemClass}>
            Inventario
          </NavLink>
          <NavLink to="/admin/ventas" className={itemClass}>
            Ventas
          </NavLink>
          <NavLink to="/admin/metricas" className={itemClass}>
            Métricas
          </NavLink>
          {hasRole([Rol.ADMINISTRADOR]) ? (
            <NavLink to="/admin/usuarios" className={itemClass}>
              Usuarios y roles
            </NavLink>
          ) : null}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3">
          <span className="text-sm text-slate-500">Entorno privado</span>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-600">
              {user?.email} · {user?.rol}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="rounded border border-slate-300 px-3 py-1.5 hover:bg-slate-100"
            >
              Cerrar sesión
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
