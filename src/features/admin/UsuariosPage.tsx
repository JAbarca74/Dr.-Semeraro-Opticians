import { InvitacionPersonal } from './InvitacionPersonal';
import {
  claveEstadoAcceso,
  type EstadoAcceso,
} from '../../core/api/activacion.service';
import { useIdioma } from '../../core/i18n/idioma.context';
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
import { TipoPersona, type Persona } from '../../core/models/persona';
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
  rol: Rol.RECEPCION,
};

export const UsuariosPage = () => {
  const { t } = useIdioma();
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [form, setForm] = useState<CreateUsuario>(FORM_VACIO);
  const [nuevoEmpleado, setNuevoEmpleado] = useState(false);
  const [cedula, setCedula] = useState('');
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [guardando, setGuardando] = useState(false);
  /** La propia cuenta no se puede degradar ni desactivar desde aquí. */
  const esCuentaPropia = (u: Usuario) => u.idUsuario === user?.idUsuario;

  const cargar = () => {
    listarUsuarios()
      .then(setUsuarios)
      .catch((e) => setError(mensajeDeError(e, t('usuarios.error'))));
    listarPersonas()
      .then(setPersonas)
      .catch(() => undefined);
  };

  useEffect(() => {
    cargar();
    // `cargar` recrea su identidad en cada render por depender de `t`. Meterlo
    // en las dependencias volvería a pedir los usuarios en cada pintado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!nuevoEmpleado && !form.idPersona) {
      setError(t('usuarios.seleccionePersona'));
      return;
    }
    setGuardando(true);
    try {
      const creada = await crearUsuario(
        nuevoEmpleado
          ? {
              email: form.email,
              rol: form.rol,
              cedula: cedula.trim(),
              nombre: nombre.trim(),
            }
          : form,
      );
      setAviso(
        t(
          creada.accesoCuenta?.estado === 'fallida'
            ? 'acceso.envioFallido'
            : claveEstadoAcceso(
                (creada.accesoCuenta?.estado ??
                  'pendiente') as EstadoAcceso['estado'],
              ),
        ),
      );
      setForm(FORM_VACIO);
      setCedula('');
      setNombre('');
      setNuevoEmpleado(false);
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

  const cambiarRol = (u: Usuario, rol: Rol) => aplicar(u.idUsuario, { rol });

  const alternarActivo = (u: Usuario) =>
    aplicar(u.idUsuario, { activo: !u.activo });

  const selectMini =
    'transition-luxe border border-neutral-200 bg-white px-2 py-1 text-xs focus:border-lux-blue focus:outline-hidden focus:ring-1 focus:ring-lux-tinta dark:border-white/10 dark:bg-[#18181a] dark:text-white';

  return (
    <section className="space-y-10">
      <SectionHeader
        kicker={t('usuarios.kicker')}
        title={t('usuarios.titulo')}
        description={t('usuarios.descripcion')}
      />

      <motion.div {...fadeUp}>
        <LuxCard className="p-6">
          <div className="mb-5 flex items-center gap-2 border-b border-neutral-100 pb-4 dark:border-white/5">
            <ShieldCheck className="h-4 w-4 text-lux-tinta" strokeWidth={1.5} />
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-700 dark:text-neutral-200">
              {t('usuarios.nuevo')}
            </h2>
          </div>
          <p className="mb-4 text-sm">{t('acceso.invitacionNota')}</p>
          <LuxButton
            type="button"
            variant="ghost"
            disabled={guardando}
            onClick={() => setNuevoEmpleado((valor) => !valor)}
          >
            {t(
              nuevoEmpleado ? 'acceso.elegirEmpleado' : 'acceso.nuevoEmpleado',
            )}
          </LuxButton>
          <form
            onSubmit={onSubmit}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {nuevoEmpleado ? (
              <>
                <label className={fieldLabelClass}>
                  {t('persona.cedula')}
                  <input
                    required
                    maxLength={20}
                    className={fieldInputClass}
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                  />
                </label>
                <label className={fieldLabelClass}>
                  {t('persona.nombreCompleto')}
                  <input
                    required
                    maxLength={150}
                    className={fieldInputClass}
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </label>
              </>
            ) : (
              <>
                <label>
                  <span className={fieldLabelClass}>
                    {t('usuarios.persona')}
                  </span>
                  <select
                    className={fieldInputClass}
                    value={form.idPersona}
                    onChange={(e) =>
                      setForm({ ...form, idPersona: Number(e.target.value) })
                    }
                  >
                    <option value={0}>{t('usuarios.seleccione')}</option>
                    {personas
                      .filter((p) => p.tipo === TipoPersona.EMPLEADO)
                      .map((p) => (
                        <option key={p.idPersona} value={p.idPersona}>
                          {p.nombre} ({p.cedula})
                        </option>
                      ))}
                  </select>
                </label>
              </>
            )}
            <label>
              <span className={fieldLabelClass}>{t('usuarios.correo')}</span>
              <input
                type="email"
                className={fieldInputClass}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
            <label>
              <span className={fieldLabelClass}>Rol</span>
              <select
                className={fieldInputClass}
                value={form.rol}
                onChange={(e) =>
                  setForm({ ...form, rol: e.target.value as Rol })
                }
              >
                {Object.values(Rol)
                  .filter((r) => r !== Rol.PACIENTE)
                  .map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
              </select>
            </label>
            <div className="col-span-full flex flex-wrap items-center gap-3 pt-2">
              <LuxButton type="submit" disabled={guardando}>
                {t('usuarios.crear')}
              </LuxButton>
              {error ? <Alert>{error}</Alert> : null}
            </div>
          </form>
        </LuxCard>
      </motion.div>

      {aviso ? (
        <motion.p
          {...fadeUp}
          className="border border-lux-tinta/40 bg-lux-tinta/5 p-4 text-xs leading-relaxed text-neutral-600 dark:text-neutral-300"
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
                  className="transition-luxe border-b border-neutral-50 last:border-0 hover:bg-lux-tinta/5 dark:border-white/5"
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
                          ? t('usuarios.noPropioRol')
                          : undefined
                      }
                    >
                      {Object.values(Rol)
                        .filter(
                          (r) =>
                            r === u.rol ||
                            (r !== Rol.PACIENTE && u.rol !== Rol.PACIENTE),
                        )
                        .map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <Badge
                      tone={
                        u.activo && u.activado !== false ? 'green' : 'neutral'
                      }
                    >
                      {u.activo
                        ? u.activado === false
                          ? t('acceso.pendiente')
                          : 'Activo'
                        : 'Inactivo'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      {u.rol !== Rol.PACIENTE &&
                      u.activado === false &&
                      u.activo ? (
                        <InvitacionPersonal id={u.idUsuario} />
                      ) : null}
                      {esCuentaPropia(u) ? (
                        <span className="text-[11px] uppercase tracking-wider text-neutral-400">
                          {t('usuarios.suCuenta')}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => alternarActivo(u)}
                          className="transition-luxe text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hover:text-lux-tinta"
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
                  <td
                    colSpan={5}
                    className="px-5 py-10 text-center text-sm text-neutral-400"
                  >
                    {t('usuarios.vacio')}
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
