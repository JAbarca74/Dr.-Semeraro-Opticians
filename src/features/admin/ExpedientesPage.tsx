import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { listarPersonas } from '../../core/api/personas.service';
import {
  crearEvaluacion,
  emitirReceta,
  expedientePorPaciente,
} from '../../core/api/expedientes.service';
import { useAuth } from '../../core/auth/auth.context';
import { Rol } from '../../core/models/rol';
import { TipoPersona, type Persona } from '../../core/models/persona';
import {
  Ojo,
  type ExpedienteDetalle,
  type NuevaRefraccion,
} from '../../core/models/expediente';
import { mensajeDeError } from '../../shared/error';

const API_BASE =
  import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

interface RefraccionForm {
  esfera: string;
  cilindro: string;
  eje: string;
  adicion: string;
}

const REF_VACIA: RefraccionForm = { esfera: '', cilindro: '', eje: '', adicion: '' };
const CAMPOS_REF = ['esfera', 'cilindro', 'eje', 'adicion'] as const;

const inputClass =
  'mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:border-slate-500 focus:outline-none';

/** Avisos de rango óptico (CU-02, EX-03): esfera ±25, cilindro ±10, eje 0–180, adición 0–4. */
const fueraDeRango = (campo: keyof RefraccionForm, valor: string): boolean => {
  if (valor === '') return false;
  const n = Number(valor);
  if (Number.isNaN(n)) return true;
  if (campo === 'esfera') return n < -25 || n > 25;
  if (campo === 'cilindro') return n < -10 || n > 10;
  if (campo === 'eje') return n < 0 || n > 180;
  if (campo === 'adicion') return n < 0 || n > 4;
  return false;
};

const construirRefraccion = (
  ojo: Ojo,
  f: RefraccionForm,
): NuevaRefraccion | null => {
  if (f.esfera === '' && f.cilindro === '' && f.eje === '') return null;
  return {
    ojo,
    esfera: Number(f.esfera || 0),
    cilindro: Number(f.cilindro || 0),
    eje: Math.round(Number(f.eje || 0)),
    adicion: f.adicion ? Number(f.adicion) : undefined,
  };
};

export const ExpedientesPage = () => {
  const { hasRole } = useAuth();
  const esDoctor = hasRole([Rol.DOCTOR]);

  const [pacientes, setPacientes] = useState<Persona[]>([]);
  const [idPaciente, setIdPaciente] = useState(0);
  const [detalle, setDetalle] = useState<ExpedienteDetalle | null>(null);
  const [diagnosticos, setDiagnosticos] = useState('');
  const [notas, setNotas] = useState('');
  const [od, setOd] = useState<RefraccionForm>(REF_VACIA);
  const [oi, setOi] = useState<RefraccionForm>(REF_VACIA);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [guardando, setGuardando] = useState(false);

  const hayFueraDeRango = CAMPOS_REF.some(
    (c) => fueraDeRango(c, od[c]) || fueraDeRango(c, oi[c]),
  );

  useEffect(() => {
    listarPersonas()
      .then((ps) => setPacientes(ps.filter((p) => p.tipo === TipoPersona.PACIENTE)))
      .catch(() => undefined);
  }, []);

  const cargarDetalle = (id: number) => {
    if (!id) {
      setDetalle(null);
      return;
    }
    expedientePorPaciente(id)
      .then(setDetalle)
      .catch((e) => setError(mensajeDeError(e)));
  };

  useEffect(() => {
    setError('');
    setAviso('');
    cargarDetalle(idPaciente);
  }, [idPaciente]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setAviso('');
    if (!idPaciente) {
      setError('Seleccione un paciente');
      return;
    }
    if (hayFueraDeRango) {
      setError('Corrija los valores fuera de rango antes de guardar.');
      return;
    }
    setGuardando(true);
    try {
      const refracciones = [
        construirRefraccion(Ojo.DERECHO, od),
        construirRefraccion(Ojo.IZQUIERDO, oi),
      ].filter((r): r is NuevaRefraccion => r !== null);
      const evaluacion = await crearEvaluacion({
        idPaciente,
        diagnosticos: diagnosticos
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        notas: notas || undefined,
        refracciones: refracciones.length ? refracciones : undefined,
      });
      // CU-02 paso 7 / CU-16: persistir y generar la receta en la misma acción.
      try {
        await emitirReceta(evaluacion.idEvaluacionClinica);
        setAviso('Evaluación guardada y receta generada con sello digital.');
      } catch (e2) {
        setAviso(`Evaluación guardada, pero ${mensajeDeError(e2)}`);
      }
      setDiagnosticos('');
      setNotas('');
      setOd(REF_VACIA);
      setOi(REF_VACIA);
      cargarDetalle(idPaciente);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const emitir = async (idEvaluacion: number) => {
    setError('');
    try {
      await emitirReceta(idEvaluacion);
      cargarDetalle(idPaciente);
    } catch (e) {
      setError(mensajeDeError(e));
    }
  };

  const campoRefraccion = (
    etiqueta: string,
    valores: RefraccionForm,
    set: (v: RefraccionForm) => void,
  ) => (
    <fieldset className="rounded border border-slate-200 p-3">
      <legend className="px-1 text-xs font-medium text-slate-500">
        {etiqueta}
      </legend>
      <div className="grid grid-cols-4 gap-2">
        {CAMPOS_REF.map((campo) => (
          <label key={campo} className="block text-xs">
            <span className="capitalize text-slate-500">{campo}</span>
            <input
              type="number"
              step={campo === 'eje' ? '1' : '0.25'}
              className={[
                inputClass,
                fueraDeRango(campo, valores[campo]) ? 'border-red-500' : '',
              ].join(' ')}
              value={valores[campo]}
              onChange={(e) => set({ ...valores, [campo]: e.target.value })}
            />
            {fueraDeRango(campo, valores[campo]) ? (
              <span className="text-[11px] text-red-600">Fuera de rango</span>
            ) : null}
          </label>
        ))}
      </div>
    </fieldset>
  );

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-800">
          Expedientes clínicos
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Ficha médica, evolución y emisión de recetas.
        </p>
      </header>

      <label className="block max-w-sm text-sm">
        <span className="text-slate-600">Paciente</span>
        <select
          className={inputClass}
          value={idPaciente}
          onChange={(e) => setIdPaciente(Number(e.target.value))}
        >
          <option value={0}>Seleccione un paciente…</option>
          {pacientes.map((p) => (
            <option key={p.idPersona} value={p.idPersona}>
              {p.nombre} ({p.cedula})
            </option>
          ))}
        </select>
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {aviso ? <p className="text-sm text-green-700">{aviso}</p> : null}

      {idPaciente && esDoctor ? (
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-lg border border-slate-200 bg-white p-4"
        >
          <h2 className="text-sm font-medium text-slate-700">Nueva evolución</h2>
          <label className="block text-sm">
            <span className="text-slate-600">Diagnósticos (uno por línea)</span>
            <textarea
              className={inputClass}
              rows={2}
              value={diagnosticos}
              onChange={(e) => setDiagnosticos(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-600">Notas de evolución</span>
            <textarea
              className={inputClass}
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            {campoRefraccion('Ojo derecho (OD)', od, setOd)}
            {campoRefraccion('Ojo izquierdo (OI)', oi, setOi)}
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={guardando || hayFueraDeRango}
              className="rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
            >
              Guardar y generar receta
            </button>
            {hayFueraDeRango ? (
              <span className="text-sm text-red-600">
                Hay valores fuera de rango óptico.
              </span>
            ) : null}
          </div>
        </form>
      ) : null}

      {detalle ? (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-slate-700">
            Evaluaciones de {detalle.expediente.paciente?.nombre}
          </h2>
          {detalle.evaluaciones.length === 0 ? (
            <p className="text-sm text-slate-400">Sin evaluaciones registradas.</p>
          ) : null}
          {detalle.evaluaciones.map((ev) => (
            <article
              key={ev.idEvaluacionClinica}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  {new Date(ev.fecha).toLocaleDateString()} ·{' '}
                  {ev.doctor?.nombre ?? 'Doctor'}
                </span>
              </div>
              {ev.diagnosticos?.length ? (
                <p className="mt-1 text-sm text-slate-600">
                  <span className="text-slate-400">Diagnósticos: </span>
                  {ev.diagnosticos.join(', ')}
                </p>
              ) : null}
              {ev.notas ? (
                <p className="mt-1 text-sm text-slate-600">{ev.notas}</p>
              ) : null}

              {ev.refracciones?.length ? (
                <table className="mt-3 w-full max-w-md text-left text-sm">
                  <thead className="text-slate-400">
                    <tr>
                      <th className="py-1">Ojo</th>
                      <th className="py-1">Esfera</th>
                      <th className="py-1">Cilindro</th>
                      <th className="py-1">Eje</th>
                      <th className="py-1">Adición</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ev.refracciones.map((r) => (
                      <tr key={r.ojo} className="border-t border-slate-100">
                        <td className="py-1">{r.ojo}</td>
                        <td className="py-1">{r.esfera}</td>
                        <td className="py-1">{r.cilindro}</td>
                        <td className="py-1">{r.eje}°</td>
                        <td className="py-1">{r.adicion ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}

              <div className="mt-3 border-t border-slate-100 pt-3">
                {ev.receta ? (
                  <div className="flex items-start gap-4">
                    <img
                      src={ev.receta.codigoQr}
                      alt="QR de la receta"
                      className="h-28 w-28"
                    />
                    <div className="text-sm">
                      <p className="font-medium text-green-700">Receta emitida</p>
                      <p className="break-all text-xs text-slate-400">
                        SHA-256: {ev.receta.hashSha256}
                      </p>
                      <div className="mt-1 flex gap-4">
                        <Link
                          to={`/verificar/${ev.receta.hashSha256}`}
                          className="text-slate-600 underline hover:text-slate-900"
                        >
                          Verificar
                        </Link>
                        <a
                          href={`${API_BASE}/recetas/${ev.receta.hashSha256}/pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-slate-600 underline hover:text-slate-900"
                        >
                          Descargar PDF
                        </a>
                      </div>
                    </div>
                  </div>
                ) : esDoctor ? (
                  <button
                    type="button"
                    onClick={() => emitir(ev.idEvaluacionClinica)}
                    className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100"
                  >
                    Emitir receta con QR
                  </button>
                ) : (
                  <span className="text-sm text-slate-400">Sin receta.</span>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
};
