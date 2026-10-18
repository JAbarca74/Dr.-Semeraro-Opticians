import { useState, type FormEvent } from 'react';
import { crearPersona } from '../../core/api/personas.service';
import { TipoPersona, type Persona } from '../../core/models/persona';
import { useIdioma } from '../../core/i18n/idioma.context';
import { mensajeDeError } from '../../shared/error';
import { TelefonoInput } from '../../shared/TelefonoInput';
import { Alert, LuxButton, fieldInputClass, fieldLabelClass } from '../../shared/ui';

/** Ficha para la cita; el correo inicia una invitación al portal. */
export const PacienteParaCita = ({ onCreado, onCancelar }: {
  onCreado: (persona: Persona) => void;
  onCancelar: () => void;
}) => {
  const { t } = useIdioma();
  const [cedula, setCedula] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const guardar = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setGuardando(true);
    try {
      const persona = await crearPersona({
        cedula: cedula.trim(), nombre: nombre.trim(), tipo: TipoPersona.PACIENTE,
        ...(telefono ? { telefono } : {}), ...(correo.trim() ? { correo: correo.trim() } : {}),
      });
      onCreado(persona);
    } catch (e) {
      setError(mensajeDeError(e, t('personas.error')));
    } finally {
      setGuardando(false);
    }
  };

  return <form onSubmit={guardar} className="my-5 space-y-4 border p-4 dark:border-white/10">
    <h3 className="font-semibold">{t('roles.agenda.nuevoPaciente')}</h3>
    <p className="text-sm text-neutral-500">{t('roles.agenda.fichaMinima')}</p>
    {error ? <Alert>{error}</Alert> : null}
    <label className={fieldLabelClass}>{t('persona.cedula')}
      <input required maxLength={20} className={fieldInputClass} value={cedula} onChange={(e) => setCedula(e.target.value)} />
    </label>
    <label className={fieldLabelClass}>{t('persona.nombreCompleto')}
      <input required maxLength={150} className={fieldInputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} />
    </label>
    <TelefonoInput etiqueta={t('registro.campo.telefono')} valor={telefono} onChange={setTelefono} labelClass={fieldLabelClass} inputClass={fieldInputClass} />
    <label className={fieldLabelClass}>{t('persona.correo')}
      <input type="email" maxLength={100} className={fieldInputClass} value={correo} onChange={(e) => setCorreo(e.target.value)} />
    </label>
    <div className="flex flex-wrap gap-3">
      <LuxButton disabled={guardando || !cedula.trim() || !nombre.trim()} type="submit">{t('roles.agenda.guardarPaciente')}</LuxButton>
      <LuxButton disabled={guardando} type="button" variant="ghost" onClick={onCancelar}>{t('comun.cancelar')}</LuxButton>
    </div>
  </form>;
};
