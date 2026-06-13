import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { verificarReceta } from '../../core/api/expedientes.service';
import type { VerificacionReceta } from '../../core/models/expediente';

export const VerificarRecetaPage = () => {
  const { hash = '' } = useParams();
  const [resultado, setResultado] = useState<VerificacionReceta | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    verificarReceta(hash)
      .then(setResultado)
      .catch(() => setResultado({ valida: false }))
      .finally(() => setCargando(false));
  }, [hash]);

  if (cargando) {
    return <p className="text-slate-500">Verificando receta…</p>;
  }

  const valida = resultado?.valida;

  return (
    <section className="mx-auto max-w-xl space-y-6">
      <h1 className="text-2xl font-semibold text-slate-800">
        Verificación de receta
      </h1>

      <div
        className={[
          'rounded-lg border p-4',
          valida
            ? 'border-green-200 bg-green-50'
            : 'border-red-200 bg-red-50',
        ].join(' ')}
      >
        <p
          className={
            valida ? 'font-medium text-green-700' : 'font-medium text-red-700'
          }
        >
          {valida
            ? '✓ Receta auténtica y sin alteraciones'
            : '✗ Receta no válida o no encontrada'}
        </p>
      </div>

      {valida ? (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Paciente</span>
            <span className="font-medium">{resultado?.paciente}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Especialista</span>
            <span className="font-medium">{resultado?.doctor}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Firmada</span>
            <span className="font-medium">
              {resultado?.firmadoEn
                ? new Date(resultado.firmadoEn).toLocaleString()
                : '—'}
            </span>
          </div>
          {resultado?.refracciones?.length ? (
            <table className="mt-2 w-full text-left">
              <thead className="text-slate-500">
                <tr>
                  <th className="py-1">Ojo</th>
                  <th className="py-1">Esfera</th>
                  <th className="py-1">Cilindro</th>
                  <th className="py-1">Eje</th>
                </tr>
              </thead>
              <tbody>
                {resultado.refracciones.map((r) => (
                  <tr key={r.ojo} className="border-t border-slate-100">
                    <td className="py-1">{r.ojo}</td>
                    <td className="py-1">{r.esfera}</td>
                    <td className="py-1">{r.cilindro}</td>
                    <td className="py-1">{r.eje}°</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : null}
          <p className="break-all pt-2 text-xs text-slate-400">
            SHA-256: {resultado?.hash}
          </p>
        </div>
      ) : null}
    </section>
  );
};
