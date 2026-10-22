import { useEffect, useState } from 'react';
import { claveEstadoAcceso, estadoAcceso, reenviarInvitacion, guardarCorreoPortal, type EstadoAcceso } from '../../core/api/activacion.service';
import { useIdioma } from '../../core/i18n/idioma.context';
import { mensajeDeError } from '../../shared/error';
import { Alert, LuxButton, fieldInputClass } from '../../shared/ui';

export const AccesoPortalPaciente = ({ idPersona, permitirEditarCorreo = true }: { idPersona: number; permitirEditarCorreo?: boolean }) => {
  const { t } = useIdioma();
  const [estado, setEstado] = useState<EstadoAcceso>();
  const [correo, setCorreo] = useState('');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  useEffect(() => {
    let vigente = true;
    setEstado(undefined); setError(''); setCorreo('');
    estadoAcceso(idPersona).then((e) => { if (vigente) setEstado(e); }).catch((e) => { if (vigente) setError(mensajeDeError(e, t('registro.error'))); });
    return () => { vigente = false; };
  }, [idPersona, t]);
  const enviar = async (guardar: boolean) => {
    setOcupado(true); setError('');
    try { setEstado(await (guardar ? guardarCorreoPortal(idPersona, correo.trim()) : reenviarInvitacion(idPersona))); }
    catch (e) { setError(mensajeDeError(e, t('registro.error'))); }
    finally { setOcupado(false); }
  };
  const existente = estado?.estado === 'activa' || estado?.estado === 'desactivada';
  return <aside className="my-4 space-y-3 rounded-sm border p-4 dark:border-white/10">
    <h3 className="font-semibold">{t('registro.kicker')}</h3>
    {error ? <Alert>{error}</Alert> : null}
    {estado ? <p role="status">{t(claveEstadoAcceso(estado.estado))}</p> : null}
    {estado && !existente ? <>
      {estado.estado !== 'sin_correo' ? <LuxButton type="button" disabled={ocupado} onClick={() => enviar(false)}>{t('activacion.reenviar')}</LuxButton> : null}
      {permitirEditarCorreo ? <><label className="block">{t('activacion.contacto')}
        <input type="email" maxLength={100} className={fieldInputClass} value={correo} onChange={(e) => setCorreo(e.target.value)} />
      </label>
      <LuxButton type="button" disabled={ocupado || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())} onClick={() => enviar(true)}>{t('activacion.guardarCorreo')}</LuxButton></> : null}
    </> : null}
  </aside>;
};
