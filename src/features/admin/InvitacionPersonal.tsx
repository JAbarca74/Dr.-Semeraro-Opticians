import { useState } from 'react';
import {
  estadoInvitacionPersonal,
  invitarPersonal,
} from '../../core/api/acceso-cuenta.service';
import { useIdioma } from '../../core/i18n/idioma.context';
import {
  claveEstadoAcceso,
  type EstadoAcceso,
} from '../../core/api/activacion.service';
import { mensajeDeError } from '../../shared/error';
import { Alert, LuxButton } from '../../shared/ui';
export const InvitacionPersonal = ({ id }: { id: number }) => {
  const { t } = useIdioma();
  const [estado, setEstado] = useState('');
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const consultar = async (reenviar: boolean) => {
    setOcupado(true);
    setError('');
    try {
      setEstado(
        (await (reenviar ? invitarPersonal(id) : estadoInvitacionPersonal(id)))
          .estado,
      );
    } catch (e) {
      setError(mensajeDeError(e, t('acceso.error')));
    } finally {
      setOcupado(false);
    }
  };
  return (
    <div className="space-y-2">
      <LuxButton
        type="button"
        variant="ghost"
        disabled={ocupado}
        onClick={() => consultar(false)}
      >
        {t('acceso.estado')}
      </LuxButton>
      <LuxButton
        type="button"
        variant="ghost"
        disabled={ocupado}
        onClick={() => consultar(true)}
      >
        {t('activacion.reenviar')}
      </LuxButton>
      {estado ? (
        <p role="status">
          {t(
            estado === 'fallida'
              ? 'acceso.envioFallido'
              : claveEstadoAcceso(estado as EstadoAcceso['estado']),
          )}
        </p>
      ) : null}
      {error ? <Alert>{error}</Alert> : null}
    </div>
  );
};
