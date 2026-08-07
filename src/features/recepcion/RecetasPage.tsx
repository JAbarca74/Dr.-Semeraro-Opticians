import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Download, ScanLine, ShieldCheck, ShieldX } from 'lucide-react';
import { verificarReceta } from '../../core/api/expedientes.service';
import type { VerificacionReceta } from '../../core/models/expediente';
import { mensajeDeError } from '../../shared/error';
import { normalizarHash } from '../../shared/receta';
import {
  RecepButton,
  RecepCard,
  RecepHeader,
  recepFade,
  recepInputClass,
  recepLabelClass,
} from './RecepcionShared';
import { API_BASE } from '../../core/api/http';

export const RecetasPage = () => {
  const [entrada, setEntrada] = useState('');
  const [resultado, setResultado] = useState<VerificacionReceta | null>(null);
  const [hash, setHash] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setResultado(null);
    const h = normalizarHash(entrada);
    if (!h) {
      setError('Ingrese el código (hash) o la URL de verificación de la receta.');
      return;
    }
    setCargando(true);
    try {
      const r = await verificarReceta(h);
      setHash(h);
      setResultado(r);
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo verificar la receta.'));
    } finally {
      setCargando(false);
    }
  };

  const valida = resultado?.valida;

  return (
    <div>
      <RecepHeader
        cu="Sello digital · CU-16"
        title="Verificación de Recetas"
        description="Confirme la autenticidad e integridad de una receta emitida por el especialista, recomputando su firma SHA-256. Escanee el QR o pegue el código."
      />

      <div className="grid items-start gap-8 lg:grid-cols-12">
        <motion.div {...recepFade} className="lg:col-span-5">
          <RecepCard className="space-y-6 p-8">
            <div className="border-b border-neutral-100 pb-3 dark:border-neutral-800">
              <h3 className="flex items-center gap-2 font-serif text-lg font-medium text-neutral-900 dark:text-white">
                <ScanLine className="h-4 w-4 text-lux-tinta" /> Consultar receta
              </h3>
              <p className="text-xs font-light text-neutral-400">
                Código SHA-256 o URL del QR de la receta
              </p>
            </div>
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <span className={recepLabelClass}>Código / URL de verificación</span>
                <input
                  className={recepInputClass}
                  value={entrada}
                  onChange={(e) => setEntrada(e.target.value)}
                  placeholder="p. ej. 9f86d081… o /verificar/9f86d081…"
                />
              </div>
              {error ? (
                <p className="border border-rose-100 bg-rose-50 p-3 text-[11px] font-medium text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400">
                  {error}
                </p>
              ) : null}
              <RecepButton type="submit" disabled={cargando}>
                {cargando ? 'Verificando…' : 'Verificar autenticidad'}
              </RecepButton>
            </form>
          </RecepCard>
        </motion.div>

        {/* Resultado */}
        <div className="lg:col-span-7">
          {resultado ? (
            <motion.div {...recepFade} className="space-y-5">
              <div
                className={[
                  'flex items-center gap-3 border p-4',
                  valida
                    ? 'border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400'
                    : 'border-rose-300/60 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400',
                ].join(' ')}
              >
                {valida ? (
                  <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />
                ) : (
                  <ShieldX className="h-5 w-5" strokeWidth={1.8} />
                )}
                <span className="text-sm font-semibold">
                  {valida
                    ? 'Receta auténtica y sin alteraciones'
                    : 'Receta no válida o no encontrada'}
                </span>
              </div>

              {valida ? (
                <RecepCard className="space-y-4 p-6 text-sm">
                  {[
                    ['Paciente', resultado?.paciente],
                    ['Especialista', resultado?.doctor],
                    [
                      'Firmada',
                      resultado?.firmadoEn
                        ? new Date(resultado.firmadoEn).toLocaleString()
                        : '—',
                    ],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between border-b border-neutral-100 pb-2 last:border-0 dark:border-neutral-800"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                        {k}
                      </span>
                      <span className="font-medium text-lux-dark dark:text-white">{v}</span>
                    </div>
                  ))}

                  {resultado?.refracciones?.length ? (
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-neutral-100 dark:border-neutral-800">
                          {['Ojo', 'Esfera', 'Cilindro', 'Eje'].map((h) => (
                            <th
                              key={h}
                              className="py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-400"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {resultado.refracciones.map((r) => (
                          <tr
                            key={r.ojo}
                            className="border-b border-neutral-50 last:border-0 dark:border-neutral-800/60"
                          >
                            <td className="py-2 font-semibold text-lux-tinta">{r.ojo}</td>
                            <td className="py-2">{r.esfera}</td>
                            <td className="py-2">{r.cilindro}</td>
                            <td className="py-2">{r.eje}°</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : null}

                  <p className="break-all font-mono text-[10px] text-neutral-400">
                    SHA-256: {resultado?.hash}
                  </p>
                  <a href={`${API_BASE}/recetas/${hash}/pdf`} target="_blank" rel="noreferrer">
                    <RecepButton type="button" variant="outline">
                      <Download className="h-3.5 w-3.5" /> Descargar PDF
                    </RecepButton>
                  </a>
                </RecepCard>
              ) : null}
            </motion.div>
          ) : (
            <motion.div
              {...recepFade}
              className="flex h-full min-h-[200px] items-center justify-center border border-dashed border-neutral-200 text-center dark:border-neutral-800"
            >
              <p className="px-6 text-xs font-light leading-relaxed text-neutral-400">
                El resultado de la verificación aparecerá aquí.
                <br />
                Ingrese un código para comenzar.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};
