import { useEffect, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import {
  actualizarUsuario,
  crearUsuario,
  listarUsuarios,
} from '../../core/api/usuarios.service';
import { listarPersonas } from '../../core/api/personas.service';
import { useAuth } from '../../core/auth/auth.context';
import { Rol } from '../../core/models/rol';
import type {
  CreateUsuario,
  UpdateUsuario,
  Usuario,
} from '../../core/models/usuario';
import type { Persona } from '../../core/models/persona';
import { mensajeDeError } from '../../shared/error';
import {
  Alert,
  Badge,
  LuxButton,
  LuxCard,
  SectionHeader,
  fadeUp,
  fieldInputClass,
  fieldLabelClass,
} from '../../shared/ui';

const FORM_VACIO: CreateUsuario = {
  idPersona: 0,
  email: '',
  password: '',
  rol: Rol.RECEPCION,
};

export const UsuariosPage = () => {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [form, setForm] = useState<CreateUsuario>(FORM_VACIO);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [guardando, setGuardando] = useState(false);
  /** Restablecimiento en curso: a quién y con qué contraseña. */
  const [reset, setReset] = useState<{ id: number; valor: string } | null>(null);

  /** La propia cuenta no se puede degradar ni desactivar desde aquí. */
  const esCuentaPropia = (u: Usuario) => u.idUsuario === user?.idUsuario;

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

  /**
   * Aplica un cambio sobre un usuario y deja el mensaje coherente con el
   * resultado: un reintento que funciona ya no arrastra el error anterior.
   */
  const aplicar = async (id: number, cambio: UpdateUsuario, exito?: string) => {
    setError('');
    setAviso('');
    try {
      await actualizarUsuario(id, cambio);
      if (exito) {
        setAviso(exito);
      }
    } catch (e) {
      setError(mensajeDeError(e));
    }
    cargar();
  };

  const cambiarRol = (u: Usuario, rol: Rol) =>
    aplicar(u.idUsuario, { rol });

  const alternarActivo = (u: Usuario) =>
    aplicar(u.idUsuario, { activo: !u.activo });

  const restablecerPassword = async (u: Usuario) => {
    if (!reset || reset.valor.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    await aplicar(
      u.idUsuario,
      { password: reset.valor },
      `Contraseña restablecida para ${u.email}. Comuníquesela por un canal seguro.`,
    );
    setReset(null);
  };

  const selectMini =
    'transition-luxe border border-neutral-200 bg-white px-2 py-1 text-xs focus:border-lux-blue focus:outline-none focus:ring-1 focus:ring-lux-gold dark:border-white/10 dark:bg-[#18181a] dark:text-white';

  return (
    <section className="space-y-10">
      <SectionHeader
        kicker="Control de acceso · RBAC"
        title="Usuarios y roles"
        description="Alta de usuarios del sistema y asignación de roles de seguridad."
      />

      <motion.div {...fadeUp}>
        <LuxCard className="p-6">
          <div className="mb-5 flex items-center gap-2 border-b border-neutral-100 pb-4 dark:border-white/5">
            <ShieldCheck className="h-4 w-4 text-lux-gold" strokeWidth={1.5} />
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-700 dark:text-neutral-200">
              Nuevo usuario
            </h2>
          </div>
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label>
              <span className={fieldLabelClass}>Persona</span>
              <select
                className={fieldInputClass}
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
            <label>
              <span className={fieldLabelClass}>Correo</span>
              <input
                type="email"
                className={fieldInputClass}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
            <label>
              <span className={fieldLabelClass}>Contraseña</span>
              <input
                type="password"
                className={fieldInputClass}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={8}
                required
              />
            </label>
            <label>
              <span className={fieldLabelClass}>Rol</span>
              <select
                className={fieldInputClass}
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
            <div className="col-span-full flex flex-wrap items-center gap-3 pt-2">
              <LuxButton type="submit" disabled={guardando}>
                Crear usuario
              </LuxButton>
              {error ? <Alert>{error}</Alert> : null}
            </div>
          </form>
        </LuxCard>
      </motion.div>

      {aviso ? (
        <motion.p
          {...fadeUp}
          className="border border-lux-gold/40 bg-lux-gold/5 p-4 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300"
        >
          {aviso}
        </motion.p>
      ) : null}

      <motion.div {...fadeUp}>
        <LuxCard className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/60 text-left dark:border-white/5 dark:bg-white/5">
                {['Correo', 'Persona', 'Rol', 'Estado', ''].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr
                  key={u.idUsuario}
                  className="transition-luxe border-b border-neutral-50 last:border-0 hover:bg-lux-gold/5 dark:border-white/5"
                >
                  <td className="px-5 py-3 font-medium text-lux-blue dark:text-white">
                    {u.email}
                  </td>
                  <td className="px-5 py-3 text-neutral-500">
                    {u.persona?.nombre ?? `#${u.idPersona}`}
                  </td>
                  <td className="px-5 py-3">
                    <select
                      value={u.rol}
                      onChange={(e) => cambiarRol(u, e.target.value as Rol)}
                      className={selectMini}
                      disabled={esCuentaPropia(u)}
                      title={
                        esCuentaPropia(u)
                          ? 'No puede cambiar su propio rol.'
                          : undefined
                      }
                    >
                      {Object.values(Rol).map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={u.activo ? 'green' : 'neutral'}>
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      {reset?.id === u.idUsuario ? (
                        <>
                          <input
                            type="password"
                            autoFocus
                            minLength={8}
                            placeholder="Nueva contraseña"
                            aria-label={`Nueva contraseña de ${u.email}`}
                            value={reset.valor}
                            onChange={(e) =>
                              setReset({ id: u.idUsuario, valor: e.target.value })
                            }
                            className={selectMini}
                          />
                          <button
                            type="button"
                            onClick={() => restablecerPassword(u)}
                            className="transition-luxe text-[11px] font-semibold uppercase tracking-wider text-lux-gold hover:text-lux-blue"
                          >
                            Guardar
                          </button>
                          <button
                            type="button"
                            onClick={() => setReset(null)}
                            className="transition-luxe text-[11px] font-semibold uppercase tracking-wider text-neutral-400 hover:text-lux-gold"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setReset({ id: u.idUsuario, valor: '' })}
                          className="transition-luxe text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hover:text-lux-gold"
                        >
                          Restablecer contraseña
                        </button>
                      )}
                      {esCuentaPropia(u) ? (
                        <span className="text-[11px] uppercase tracking-wider text-neutral-400">
                          Su cuenta
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => alternarActivo(u)}
                          className="transition-luxe text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hover:text-lux-gold"
                        >
                          {u.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-neutral-400">
                    Sin usuarios.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </LuxCard>
      </motion.div>
    </section>
  );
};
