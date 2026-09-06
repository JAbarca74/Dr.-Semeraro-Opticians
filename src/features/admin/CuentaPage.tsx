import { useIdioma } from '../../core/i18n/idioma.context';
import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, UserCircle } from 'lucide-react';
import { cambiarPasswordRequest } from '../../core/auth/auth.service';
import { useAuth } from '../../core/auth/auth.context';
import { rolLabel } from '../../core/models/rol';
import { mensajeDeError } from '../../shared/error';
import {
  Alert,
  LuxButton,
  LuxCard,
  SectionHeader,
  fadeUp,
  fieldInputClass,
  fieldLabelClass,
} from '../../shared/ui';

export const CuentaPage = () => {
  const { t } = useIdioma();
  const { user } = useAuth();
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMensaje('');
    setError('');
    if (nueva !== confirmar) {
      setError(t('cuenta.noCoincide'));
      return;
    }
    if (nueva.length < 8) {
      setError(t('cuenta.claveCorta'));
      return;
    }
    setGuardando(true);
    try {
      await cambiarPasswordRequest(actual, nueva);
      setMensaje(t('cuenta.actualizada'));
      setActual('');
      setNueva('');
      setConfirmar('');
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const iniciales = (user?.email ?? 'OP').substring(0, 2).toUpperCase();

  return (
    <section className="space-y-10">
      <SectionHeader
        kicker={t('cuenta.kicker')}
        title={t('cuenta.titulo')}
        description={t('cuenta.descripcion')}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tarjeta de identidad */}
        <motion.div {...fadeUp}>
          <LuxCard className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lux-tinta font-serif text-xl font-bold uppercase text-white">
              {iniciales}
            </div>
            <div>
              <UserCircle className="mx-auto mb-2 h-4 w-4 text-lux-tinta" strokeWidth={1.5} />
              <span className="block text-sm font-bold text-lux-blue dark:text-white">
                {user?.email}
              </span>
              <span className="mt-1 block font-mono text-[10px] uppercase tracking-widest text-lux-tinta">
                {rolLabel(user?.rol)} · {t('cuenta.autenticado')}
              </span>
            </div>
          </LuxCard>
        </motion.div>

        {/* Cambio de contraseña */}
        <motion.div {...fadeUp} className="lg:col-span-2">
          <LuxCard className="p-6">
            <div className="mb-5 flex items-center gap-2 border-b border-neutral-100 pb-4 dark:border-white/5">
              <KeyRound className="h-4 w-4 text-lux-tinta" strokeWidth={1.5} />
              <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-700 dark:text-neutral-200">
                {t('cuenta.cambiarClave')}
              </h2>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <label className="block">
                <span className={fieldLabelClass}>{t('cuenta.claveActual')}</span>
                <input
                  type="password"
                  className={fieldInputClass}
                  value={actual}
                  onChange={(e) => setActual(e.target.value)}
                  required
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className={fieldLabelClass}>{t('cuenta.claveNueva')}</span>
                  <input
                    type="password"
                    className={fieldInputClass}
                    value={nueva}
                    onChange={(e) => setNueva(e.target.value)}
                    minLength={8}
                    required
                  />
                </label>
                <label className="block">
                  <span className={fieldLabelClass}>{t('cuenta.claveConfirmar')}</span>
                  <input
                    type="password"
                    className={fieldInputClass}
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    required
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <LuxButton type="submit" disabled={guardando}>
                  {t('cuenta.actualizar')}
                </LuxButton>
                {mensaje ? (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {mensaje}
                  </span>
                ) : null}
                {error ? <Alert>{error}</Alert> : null}
              </div>
            </form>
          </LuxCard>
        </motion.div>
      </div>
    </section>
  );
};
