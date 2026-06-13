import { useState, type FormEvent } from 'react';
import { cambiarPasswordRequest } from '../../core/auth/auth.service';
import { useAuth } from '../../core/auth/auth.context';
import { mensajeDeError } from '../../shared/error';

const inputClass =
  'mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none';

export const CuentaPage = () => {
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
      setError('La confirmación no coincide');
      return;
    }
    if (nueva.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }
    setGuardando(true);
    try {
      await cambiarPasswordRequest(actual, nueva);
      setMensaje('Contraseña actualizada correctamente');
      setActual('');
      setNueva('');
      setConfirmar('');
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="max-w-md space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-slate-800">Mi cuenta</h1>
        <p className="mt-1 text-sm text-slate-600">
          {user?.email} · {user?.rol}
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-4"
      >
        <h2 className="text-sm font-medium text-slate-700">Cambiar contraseña</h2>
        <label className="block text-sm">
          <span className="text-slate-600">Contraseña actual</span>
          <input
            type="password"
            className={inputClass}
            value={actual}
            onChange={(e) => setActual(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Nueva contraseña</span>
          <input
            type="password"
            className={inputClass}
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
            minLength={8}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Confirmar nueva contraseña</span>
          <input
            type="password"
            className={inputClass}
            value={confirmar}
            onChange={(e) => setConfirmar(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          disabled={guardando}
          className="rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-60"
        >
          Actualizar contraseña
        </button>
        {mensaje ? <p className="text-sm text-green-600">{mensaje}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
    </section>
  );
};
