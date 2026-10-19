import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  solicitarRecuperacion,
  confirmarClave,
} from '../../core/api/acceso-cuenta.service';
import { useIdioma } from '../../core/i18n/idioma.context';
import { mensajeDeError } from '../../shared/error';
import { useAuth } from '../../core/auth/auth.context';
import {
  Alert,
  LuxButton,
  LuxCard,
  SectionHeader,
  fieldInputClass,
  fieldLabelClass,
} from '../../shared/ui';

export const AccesoCuentaPage = ({
  modo,
}: {
  modo: 'recuperar' | 'restablecer' | 'personal';
}) => {
  const { t } = useIdioma();
  const { cerrarSesionLocal } = useAuth();
  const [token, setToken] = useState(
    () => new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '',
  );
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState('');
  const [listo, setListo] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => {
    if (window.location.hash)
      window.history.replaceState(
        null,
        '',
        window.location.pathname + window.location.search,
      );
  }, []);
  const recuperar = modo === 'recuperar';
  const bytes = new TextEncoder().encode(password).length;
  const valida = password.length >= 8 && bytes <= 72;
  const permitido = recuperar
    ? !!correo.trim()
    : /^[a-f0-9]{64}$/.test(token) && valida && password === confirmacion;
  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    if (!permitido || ocupado) return;
    setOcupado(true);
    setError('');
    try {
      if (recuperar) await solicitarRecuperacion(correo.trim());
      else {
        await confirmarClave(token, password, modo === 'personal');
        cerrarSesionLocal();
      }
      setListo(true);
      setToken('');
      setPassword('');
      setConfirmacion('');
    } catch (e) {
      setError(mensajeDeError(e, t('acceso.error')));
    } finally {
      setOcupado(false);
    }
  };
  return (
    <section className="space-y-6">
      <SectionHeader
        kicker={t('registro.kicker')}
        title={t(modo === 'personal' ? 'acceso.personal' : 'acceso.recuperar')}
        description={t(recuperar ? 'acceso.solicitudNota' : 'acceso.claveNota')}
      />
      <LuxCard className="space-y-5 p-8">
        {error ? <Alert>{error}</Alert> : null}
        {listo ? (
          <p role="status">
            {t(recuperar ? 'acceso.neutro' : 'acceso.guardada')}
          </p>
        ) : !recuperar && !token ? (
          <p>{t('acceso.sinEnlace')}</p>
        ) : (
          <form onSubmit={enviar} className="space-y-4">
            {recuperar ? (
              <label className={fieldLabelClass}>
                {t('login.campo.correo')}
                <input
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={100}
                  className={fieldInputClass}
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                />
              </label>
            ) : (
              <>
                <label className={fieldLabelClass}>
                  {t('registro.campo.clave')}
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    maxLength={72}
                    className={fieldInputClass}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </label>
                <label className={fieldLabelClass}>
                  {t('registro.campo.claveRepetir')}
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    className={fieldInputClass}
                    value={confirmacion}
                    onChange={(e) => setConfirmacion(e.target.value)}
                  />
                </label>
                {password && !valida ? (
                  <p role="alert">
                    {t(
                      bytes > 72 ? 'activacion.claveLarga' : 'acceso.claveNota',
                    )}
                  </p>
                ) : null}
                {confirmacion && password !== confirmacion ? (
                  <p role="alert">{t('registro.noCoinciden')}</p>
                ) : null}
              </>
            )}
            <LuxButton type="submit" disabled={!permitido || ocupado}>
              {t(
                ocupado
                  ? 'registro.enviando'
                  : recuperar
                    ? 'acceso.enviar'
                    : 'acceso.guardar',
              )}
            </LuxButton>
          </form>
        )}
        <Link className="block underline" to="/login">
          {t('registro.inicieSesion')}
        </Link>
      </LuxCard>
    </section>
  );
};
