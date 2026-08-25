import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, UserPlus } from 'lucide-react';
import { registrarPacienteRequest } from '../../core/auth/auth.service';
import { mensajeDeError } from '../../shared/error';
import {
  Alert,
  LuxButton,
  LuxCard,
  SectionHeader,
  fieldInputClass,
  fieldLabelClass,
} from '../../shared/ui';

/** Mismo mínimo que exige el backend, para no dar dos reglas distintas. */
const MINIMO_CLAVE = 8;

/**
 * Registro de cuenta de paciente (CU-10 flujo principal, `DSO-39`).
 *
 * Es el **autoservicio**: la persona se da de alta ella misma desde el portal
 * público. Los otros dos caminos que describe CU-10 —registro presencial por el
 * Doctor y por secretaría— ya existen en `/admin/personas` y `/recepcion/pacientes`.
 *
 * ⚠️ **Falta el correo de bienvenida del paso 6.** El sistema todavía no sabe
 * enviar correos; está en `DSO-50`. No bloquea nada: en este flujo la persona
 * elige su propia clave, así que la cuenta queda usable en el acto y la pantalla
 * la manda a iniciar sesión.
 */
export const RegistroPage = () => {
  const navigate = useNavigate();
  const [cedula, setCedula] = useState('');
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState('');
  const [creada, setCreada] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const claveCorta = password.length > 0 && password.length < MINIMO_CLAVE;
  const noCoinciden = confirmacion.length > 0 && password !== confirmacion;
  const incompleto =
    !cedula.trim() || !nombre.trim() || !correo.trim() || !password;
  const puedeEnviar =
    !incompleto && !claveCorta && !noCoinciden && password === confirmacion;

  const registrar = async (e: FormEvent) => {
    e.preventDefault();
    if (!puedeEnviar) return;
    setError('');
    setEnviando(true);
    try {
      await registrarPacienteRequest({
        cedula: cedula.trim(),
        nombre: nombre.trim(),
        correo: correo.trim(),
        password,
        // Una cadena vacía no es un teléfono: se manda ausente, no vacía.
        ...(telefono.trim() ? { telefono: telefono.trim() } : {}),
      });
      setCreada(true);
    } catch (err) {
      // EX-12 llega como 409 con el literal del caso de uso; `mensajeDeError`
      // lo desenvuelve y se muestra tal cual lo escribió el TFM.
      setError(mensajeDeError(err, 'No se pudo crear la cuenta'));
    } finally {
      setEnviando(false);
    }
  };

  if (creada) {
    return (
      <section className="space-y-10">
        <SectionHeader
          kicker="Portal del paciente"
          title="Su cuenta está lista"
          description="Ya puede iniciar sesión con el correo y la contraseña que acaba de registrar."
        />
        <LuxCard className="flex flex-col items-center gap-5 p-12 text-center">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" strokeWidth={1.4} />
          <p className="max-w-md text-sm leading-relaxed text-neutral-500 dark:text-neutral-400">
            Desde el portal podrá verificar sus recetas y consultar el estado de
            sus lentes. Si necesita ayuda, la recepción de la óptica puede
            atenderle.
          </p>
          <LuxButton type="button" variant="tinta" onClick={() => navigate('/login')}>
            Iniciar sesión
          </LuxButton>
        </LuxCard>
      </section>
    );
  }

  return (
    <section className="space-y-10">
      <SectionHeader
        kicker="Portal del paciente"
        title="Crear cuenta de paciente"
        description="Regístrese para verificar sus recetas y seguir el estado de sus lentes desde el portal."
      />

      {error ? <Alert>{error}</Alert> : null}

      <LuxCard className="p-8">
        <form onSubmit={registrar} className="grid gap-5 md:grid-cols-2">
          <div>
            <label className={fieldLabelClass} htmlFor="cedula">
              Cédula *
            </label>
            <input
              id="cedula"
              required
              maxLength={20}
              autoComplete="off"
              className={fieldInputClass}
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
            />
          </div>

          <div>
            <label className={fieldLabelClass} htmlFor="nombre">
              Nombre completo *
            </label>
            <input
              id="nombre"
              required
              maxLength={150}
              autoComplete="name"
              className={fieldInputClass}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div>
            <label className={fieldLabelClass} htmlFor="correo">
              Correo electrónico *
            </label>
            <input
              id="correo"
              type="email"
              required
              maxLength={100}
              autoComplete="email"
              className={fieldInputClass}
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
            />
          </div>

          <div>
            <label className={fieldLabelClass} htmlFor="telefono">
              Teléfono (opcional)
            </label>
            <input
              id="telefono"
              maxLength={20}
              autoComplete="tel"
              className={fieldInputClass}
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
            />
            <p className="mt-1 text-[10px] text-neutral-400">
              Lo usamos solo para recordarle sus citas.
            </p>
          </div>

          <div>
            <label className={fieldLabelClass} htmlFor="password">
              Contraseña *
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="new-password"
              className={fieldInputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {claveCorta ? (
              <p className="mt-1 text-[10px] text-red-600 dark:text-red-400">
                La contraseña debe tener al menos {MINIMO_CLAVE} caracteres.
              </p>
            ) : null}
          </div>

          <div>
            <label className={fieldLabelClass} htmlFor="confirmacion">
              Repita la contraseña *
            </label>
            <input
              id="confirmacion"
              type="password"
              required
              autoComplete="new-password"
              className={fieldInputClass}
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
            />
            {noCoinciden ? (
              <p className="mt-1 text-[10px] text-red-600 dark:text-red-400">
                Las contraseñas no coinciden.
              </p>
            ) : null}
          </div>

          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-150 pt-5 dark:border-white/10">
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              ¿Ya tiene cuenta?{' '}
              <Link to="/login" className="underline hover:text-lux-tinta">
                Inicie sesión
              </Link>
              .
            </p>
            <LuxButton type="submit" variant="tinta" disabled={!puedeEnviar || enviando}>
              <UserPlus size={14} />
              {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
            </LuxButton>
          </div>
        </form>
      </LuxCard>
    </section>
  );
};
