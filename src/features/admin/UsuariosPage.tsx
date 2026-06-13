import { useEffect, useState, type FormEvent } from 'react';
import {
  actualizarUsuario,
  crearUsuario,
  listarUsuarios,
} from '../../core/api/usuarios.service';
import { listarPersonas } from '../../core/api/personas.service';
import { Rol } from '../../core/models/rol';
import type { CreateUsuario, Usuario } from '../../core/models/usuario';
import type { Persona } from '../../core/models/persona';
import { mensajeDeError } from '../../shared/error';

const FORM_VACIO: CreateUsuario = {
  idPersona: 0,
  email: '',
  password: '',
  rol: Rol.RECEPCION,
};

const inputClass =
  'mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none';

export const UsuariosPage = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [form, setForm] = useState<CreateUsuario>(FORM_VACIO);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = () => {
    listarUsuarios()
      .then(setUsuarios)
      .catch((e) => setError(mensajeDeError(e, 'No se pudieron cargar los usuarios')));
    listarPersonas()
      .then(setPersonas)
      .catch(() => undefined);
  };

  useEffect(() => {
    cargar();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.idPersona) {
      setError('Seleccione una persona');
      return;
    }
    setGuardando(true);
    try {
      await crearUsuario(form);
      setForm(FORM_VACIO);
      cargar();
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const cambiarRol = async (u: Usuario, rol: Rol) => {
    await actualizarUsuario(u.idUsuario, { rol }).catch((e) =>
      setError(mensajeDeError(e)),
    );
    cargar();
  };

  const alternarActivo = async (u: Usuario) => {
    await actualizarUsuario(u.idUsuario, { activo: !u.activo }).catch((e) =>
      setError(mensajeDeError(e)),
    );
    cargar();
  };

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-800">Usuarios y roles</h1>
        <p className="mt-1 text-sm text-slate-600">
          Gestión de usuarios del sistema y asignación de roles (RBAC).
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <h2 className="col-span-full text-sm font-medium text-slate-700">
          Nuevo usuario
        </h2>
        <label className="block text-sm">
          <span className="text-slate-600">Persona</span>
          <select
            className={inputClass}
            value={form.idPersona}
            onChange={(e) =>
              setForm({ ...form, idPersona: Number(e.target.value) })
            }
          >
            <option value={0}>Seleccione…</option>
            {personas.map((p) => (
              <option key={p.idPersona} value={p.idPersona}>
                {p.nombre} ({p.cedula})
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Correo</span>
          <input
            type="email"
            className={inputClass}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Contraseña</span>
          <input
            type="password"
            className={inputClass}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            minLength={8}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Rol</span>
          <select
            className={inputClass}
            value={form.rol}
            onChange={(e) => setForm({ ...form, rol: e.target.value as Rol })}
          >
            {Object.values(Rol).map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <div className="col-span-full flex items-center gap-3">
          <button
            type="submit"
            disabled={guardando}
            className="rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-60"
          >
            Crear usuario
          </button>
          {error ? <span className="text-sm text-red-600">{error}</span> : null}
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Correo</th>
              <th className="px-4 py-2 font-medium">Persona</th>
              <th className="px-4 py-2 font-medium">Rol</th>
              <th className="px-4 py-2 font-medium">Estado</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.idUsuario} className="border-t border-slate-100">
                <td className="px-4 py-2">{u.email}</td>
                <td className="px-4 py-2 text-slate-500">
                  {u.persona?.nombre ?? `#${u.idPersona}`}
                </td>
                <td className="px-4 py-2">
                  <select
                    value={u.rol}
                    onChange={(e) => cambiarRol(u, e.target.value as Rol)}
                    className="rounded border border-slate-300 px-2 py-1 text-sm"
                  >
                    {Object.values(Rol).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-2">
                  <span
                    className={
                      u.activo
                        ? 'rounded bg-green-100 px-2 py-0.5 text-xs text-green-700'
                        : 'rounded bg-slate-200 px-2 py-0.5 text-xs text-slate-600'
                    }
                  >
                    {u.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => alternarActivo(u)}
                    className="text-slate-600 hover:text-slate-900"
                  >
                    {u.activo ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
            {usuarios.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Sin usuarios.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
};
