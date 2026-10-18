import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { activarCuenta } from '../../core/api/activacion.service';
import { useIdioma } from '../../core/i18n/idioma.context';
import { mensajeDeError } from '../../shared/error';
import { Alert, LuxButton, LuxCard, SectionHeader, fieldInputClass, fieldLabelClass } from '../../shared/ui';

/** El fragmento evita transmitir el enlace en peticiones GET y sus logs. */
export const RegistroPage = () => {
  const { t } = useIdioma();
  const [token, setToken] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [ocupacion, setOcupacion] = useState('');
  const [direccion, setDireccion] = useState('');
  const [error, setError] = useState('');
  const [lista, setLista] = useState(false);
  const [enviando, setEnviando] = useState(false);
  useEffect(() => {
    if (window.location.hash) window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, []);
  const bytes = new TextEncoder().encode(password).length;
  const puedeEnviar = /^[a-f0-9]{64}$/.test(token) && password.length >= 8 && bytes >= 8 && bytes <= 72 && password === confirmacion;
  const activar = async (e: FormEvent) => {
    e.preventDefault();
    if (!puedeEnviar || enviando) return;
    setEnviando(true); setError('');
    try {
      await activarCuenta({ token, password, ...(ocupacion.trim() ? { ocupacion: ocupacion.trim() } : {}), ...(direccion.trim() ? { direccion: direccion.trim() } : {}) });
      setLista(true); setToken(''); setPassword(''); setConfirmacion('');
    } catch (err) { setError(mensajeDeError(err, t('registro.error'))); }
    finally { setEnviando(false); }
  };
  return <section className="space-y-8">
    <SectionHeader kicker={t('registro.kicker')} title={t(lista ? 'registro.listo.titulo' : 'registro.titulo')} description={t(lista ? 'registro.listo.descripcion' : 'activacion.instrucciones')} />
    {error ? <Alert>{error}</Alert> : null}
    <LuxCard className="p-8">
      {lista ? <p role="status">{t('registro.listo.detalle')}</p> : !token ? <p>{t('activacion.sinEnlace')}</p> : <form onSubmit={activar} className="space-y-5">
        <p className="text-sm">{t('activacion.claveNota')}</p>
        <label className={fieldLabelClass} htmlFor="password">{t('registro.campo.clave')}</label>
        <input id="password" type="password" required minLength={8} maxLength={72} aria-describedby="ayuda-clave" autoComplete="new-password" className={fieldInputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
        {password && (password.length < 8 || bytes > 72) ? <p id="ayuda-clave" role="alert">{bytes > 72 ? t('activacion.claveLarga') : `${t('registro.claveCorta.antes')} 8 ${t('registro.claveCorta.despues')}`}</p> : null}
        <label className={fieldLabelClass} htmlFor="confirmacion">{t('registro.campo.claveRepetir')}</label>
        <input id="confirmacion" type="password" required autoComplete="new-password" className={fieldInputClass} value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} />
        {confirmacion && password !== confirmacion ? <p role="alert">{t('registro.noCoinciden')}</p> : null}
        <label className={fieldLabelClass} htmlFor="ocupacion">{t('activacion.ocupacion')}</label>
        <input id="ocupacion" maxLength={150} className={fieldInputClass} value={ocupacion} onChange={(e) => setOcupacion(e.target.value)} />
        <label className={fieldLabelClass} htmlFor="direccion">{t('activacion.direccion')}</label>
        <textarea id="direccion" maxLength={500} className={fieldInputClass} value={direccion} onChange={(e) => setDireccion(e.target.value)} />
        <LuxButton type="submit" disabled={!puedeEnviar || enviando}>{t(enviando ? 'registro.enviando' : 'registro.enviar')}</LuxButton>
      </form>}
      <Link to="/login" className="mt-6 inline-block underline">{t('registro.inicieSesion')}</Link>
    </LuxCard>
  </section>;
};
