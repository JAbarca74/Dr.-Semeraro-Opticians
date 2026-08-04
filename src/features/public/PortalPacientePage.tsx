import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  LogIn,
  Printer,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';
import { verificarReceta } from '../../core/api/expedientes.service';
import type { VerificacionReceta } from '../../core/models/expediente';
import { mensajeDeError } from '../../shared/error';
import { normalizarHash } from '../../shared/receta';
import {
  Kicker,
  LuxButton,
  LuxCard,
  SectionHeader,
  fadeUp,
  fieldInputClass,
  fieldLabelClass,
} from '../../shared/ui';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export const PortalPacientePage = () => {
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
      setError('Ingrese el código de su receta o la URL del certificado QR.');
      return;
    }
    setCargando(true);
    try {
      const r = await verificarReceta(h);
      setHash(h);
      setResultado(r);
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo consultar la receta.'));
    } finally {
      setCargando(false);
    }
  };

  const valida = resultado?.valida;

  return (
    <section className="space-y-10">
      <SectionHeader
        kicker="Portal del paciente · CU-16"
        title="Mi expediente y receta"
        description="Consulte y valide su fórmula de dioptrías firmada digitalmente. Ingrese el código de su receta o escanee el QR del certificado que le entregó el especialista."
      />

      {!resultado ? (
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
          {/* Formulario */}
          <motion.div {...fadeUp} className="lg:col-span-5">
            <LuxCard className="flex h-full flex-col justify-between gap-6 p-8">
              <div className="space-y-4">
                <Kicker>Acceso seguro por certificado</Kicker>
                <h3 className="flex items-center gap-2 font-serif text-xl font-light text-lux-blue dark:text-white">
                  <LogIn className="h-5 w-5" strokeWidth={1.5} /> Consultar mi receta
                </h3>
                <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                  Su receta está protegida con un sello digital SHA-256. Ingrese el
                  código para validar su autenticidad y descargar el documento.
                </p>
                <form onSubmit={onSubmit} className="space-y-4 pt-1">
                  <div>
                    <span className={fieldLabelClass}>Código o URL del certificado</span>
                    <input
                      className={fieldInputClass}
                      value={entrada}
                      onChange={(e) => setEntrada(e.target.value)}
                      placeholder="p. ej. 9f86d081… o /verificar/9f86d081…"
                    />
                  </div>
                  {error ? (
                    <div className="flex items-start gap-2 border border-red-200 bg-red-50 p-3 text-[11px] leading-relaxed text-red-800 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  ) : null}
                  <LuxButton type="submit" disabled={cargando} className="w-full">
                    {cargando ? 'Validando…' : 'Validar receta'}
                  </LuxButton>
                </form>
              </div>
              <div className="space-y-2 border border-neutral-200 bg-lux-gray p-4 dark:border-white/10 dark:bg-white/5">
                <span className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-lux-gold">
                  <ShieldCheck className="h-3.5 w-3.5" /> Estándar de seguridad clínica
                </span>
                <p className="text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                  La verificación es pública y no expone datos sensibles: recomputa el
                  hash del documento para confirmar que no fue alterado.
                </p>
              </div>
            </LuxCard>
          </motion.div>

          {/* Aviso editorial */}
          <motion.div {...fadeUp} className="lg:col-span-7">
            <LuxCard className="flex h-full flex-col justify-center gap-6 bg-lux-gray p-10 dark:bg-[#0e0e0e]">
              <Kicker>Protección de datos sanitarios</Kicker>
              <h2 className="font-serif text-2xl font-light leading-tight tracking-tight text-lux-blue dark:text-white md:text-3xl">
                Su fórmula, firmada y a prueba de falsificaciones
              </h2>
              <ul className="space-y-4 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                {[
                  'Cada receta lleva un hash SHA-256 único e inmutable.',
                  'El certificado QR enlaza a esta verificación pública.',
                  'Puede descargar el PDF oficial y presentarlo en cualquier laboratorio.',
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-neutral-200 bg-white text-lux-gold dark:border-white/10 dark:bg-black">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </LuxCard>
          </motion.div>
        </div>
      ) : (
        <motion.div {...fadeUp} className="space-y-6">
          <div
            className={[
              'flex items-center justify-between gap-3 border p-4',
              valida
                ? 'border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400'
                : 'border-rose-300/60 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400',
            ].join(' ')}
          >
            <span className="flex items-center gap-3 text-sm font-semibold">
              {valida ? (
                <ShieldCheck className="h-5 w-5" strokeWidth={1.8} />
              ) : (
                <ShieldX className="h-5 w-5" strokeWidth={1.8} />
              )}
              {valida
                ? 'Receta auténtica y sin alteraciones'
                : 'Receta no válida o no encontrada'}
            </span>
            <button
              onClick={() => {
                setResultado(null);
                setEntrada('');
              }}
              className="font-mono text-[10px] uppercase tracking-widest opacity-70 hover:opacity-100"
            >
              Nueva consulta
            </button>
          </div>

          {valida ? (
            <LuxCard id="printable-clinical-recipe" className="space-y-6 p-8">
              <div className="flex items-start justify-between border-b border-neutral-100 pb-4 dark:border-white/5">
                <div>
                  <h3 className="font-serif text-2xl font-light text-lux-blue dark:text-white">
                    Óptica Dr. Luigi Semeraro
                  </h3>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                    Receta óptica certificada · Pérez Zeledón, Costa Rica
                  </p>
                </div>
                <ShieldCheck className="h-8 w-8 text-lux-gold" strokeWidth={1.2} />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
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
                  <div key={k}>
                    <span className="block text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                      {k}
                    </span>
                    <span className="font-medium text-lux-blue dark:text-white">{v}</span>
                  </div>
                ))}
              </div>

              {resultado?.refracciones?.length ? (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 dark:border-white/10">
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
                        className="border-b border-neutral-50 last:border-0 dark:border-white/5"
                      >
                        <td className="py-2 font-semibold text-lux-gold">{r.ojo}</td>
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

              <div className="flex flex-wrap gap-3 pt-2">
                <a href={`${API_BASE}/recetas/${hash}/pdf`} target="_blank" rel="noreferrer">
                  <LuxButton type="button">
                    <Download className="h-3.5 w-3.5" /> Descargar PDF
                  </LuxButton>
                </a>
                <LuxButton type="button" variant="ghost" onClick={() => window.print()}>
                  <Printer className="h-3.5 w-3.5" /> Imprimir
                </LuxButton>
              </div>
            </LuxCard>
          ) : null}
        </motion.div>
      )}
    </section>
  );
};
