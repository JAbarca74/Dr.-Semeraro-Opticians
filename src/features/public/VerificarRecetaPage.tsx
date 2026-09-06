import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, ShieldCheck, ShieldX } from 'lucide-react';
import { verificarReceta } from '../../core/api/expedientes.service';
import type { VerificacionReceta } from '../../core/models/expediente';
import { Kicker, LuxButton, LuxCard, fadeUp } from '../../shared/ui';
import { API_BASE } from '../../core/api/http';
import { useIdioma } from '../../core/i18n/idioma.context';

export const VerificarRecetaPage = () => {
  const { hash = '' } = useParams();
  const { t, fechaHora } = useIdioma();
  const [resultado, setResultado] = useState<VerificacionReceta | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    verificarReceta(hash)
      .then(setResultado)
      .catch(() => setResultado({ valida: false }))
      .finally(() => setCargando(false));
  }, [hash]);

  if (cargando) {
    return (
      <p className="text-sm uppercase tracking-widest text-neutral-400">
        {t('receta.verificando')}
      </p>
    );
  }

  const valida = resultado?.valida;

  return (
    <section className="mx-auto max-w-xl space-y-8">
      <motion.div {...fadeUp} className="space-y-2">
        <Kicker>{t('receta.kicker')}</Kicker>
        <h1 className="font-serif text-3xl italic tracking-tight text-lux-blue dark:text-white">
          {t('receta.titulo')}
        </h1>
      </motion.div>

      <motion.div {...fadeUp}>
        <div
          className={[
            'flex items-center gap-3 border p-4',
            valida
              ? 'border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
              : 'border-red-500/30 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400',
          ].join(' ')}
        >
          {valida ? (
            <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />
          ) : (
            <ShieldX className="h-5 w-5" strokeWidth={1.8} />
          )}
          <p className="text-sm font-semibold">
            {valida ? t('receta.valida') : t('receta.invalida')}
          </p>
        </div>
      </motion.div>

      {valida ? (
        <motion.div {...fadeUp}>
          <LuxCard className="space-y-4 p-6 text-sm">
            {[
              [t('receta.paciente'), resultado?.paciente],
              [t('receta.especialista'), resultado?.doctor],
              [
                t('receta.firmada'),
                // Antes usaba `toLocaleString()` sin locale, que sigue al
                // navegador y no al idioma elegido: con la página en italiano
                // la fecha salía en el formato del sistema del visitante.
                resultado?.firmadoEn ? fechaHora(resultado.firmadoEn) : '—',
              ],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-neutral-100 pb-2 last:border-0 dark:border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                  {k}
                </span>
                <span className="font-medium text-lux-blue dark:text-white">{v}</span>
              </div>
            ))}

            {resultado?.refracciones?.length ? (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-white/5">
                    {[
                      t('receta.ojo'),
                      t('receta.esfera'),
                      t('receta.cilindro'),
                      t('receta.eje'),
                    ].map((h) => (
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
                    <tr key={r.ojo} className="border-b border-neutral-50 last:border-0 dark:border-white/5">
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
            <a
              href={`${API_BASE}/recetas/${hash}/pdf`}
              target="_blank"
              rel="noreferrer"
            >
              <LuxButton type="button">
                <Download className="h-3.5 w-3.5" /> {t('receta.descargarPdf')}
              </LuxButton>
            </a>
          </LuxCard>
        </motion.div>
      ) : null}
    </section>
  );
};
