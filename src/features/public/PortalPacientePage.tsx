import { useState, type FormEvent } from 'react';
import { SpinnerLentes } from '../../shared/ilustraciones';
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
import { useAuth } from '../../core/auth/auth.context';
import { Rol } from '../../core/models/rol';
import { MisExpedientes } from './MisExpedientes';
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
import { API_BASE } from '../../core/api/http';
import { useIdioma } from '../../core/i18n/idioma.context';

/**
 * Portal del paciente.
 *
 * Sirve a **dos personas distintas en la misma ruta**, y por eso no está detrás
 * de `ProtectedRoute`:
 *
 * - Quien llega con el **QR de una receta en la mano** y no tiene cuenta: el
 *   verificador por hash es público y sigue siéndolo (CU-16).
 * - Quien **inicia sesión como Paciente**: además ve «Mis Expedientes»
 *   (CU-12, `DSO-40`), que es la sección que exige sesión.
 */
export const PortalPacientePage = () => {
  const { t, fechaHora } = useIdioma();
  const { hasRole } = useAuth();
  const esPaciente = hasRole([Rol.PACIENTE]);
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
      setError(t('portal.errorVacio'));
      return;
    }
    setCargando(true);
    try {
      const r = await verificarReceta(h);
      setHash(h);
      setResultado(r);
    } catch (e) {
      setError(mensajeDeError(e, t('portal.errorConsulta')));
    } finally {
      setCargando(false);
    }
  };

  const valida = resultado?.valida;

  return (
    <section className="space-y-10">
      {/*
        CU-12: solo con sesión de Paciente. Va arriba porque para quien inició
        sesión su expediente es lo que viene a ver; el verificador por hash
        queda debajo, útil pero secundario.
      */}
      {esPaciente ? (
        <div className="space-y-5">
          <SectionHeader
            kicker={t('portal.kickerExp')}
            title={t('portal.tituloExp')}
            description={t('portal.descripcionExp')}
          />
          <MisExpedientes />
        </div>
      ) : null}

      <SectionHeader
        kicker={t('portal.kicker')}
        title={t('portal.titulo')}
        description={t('portal.descripcion')}
      />

      {!resultado ? (
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12">
          {/* Formulario */}
          <motion.div {...fadeUp} className="lg:col-span-5">
            <LuxCard className="flex h-full flex-col justify-between gap-6 p-8">
              <div className="space-y-4">
                <Kicker>{t('portal.acceso')}</Kicker>
                <h3 className="flex items-center gap-2 font-serif text-xl font-light text-lux-blue dark:text-white">
                  <LogIn className="h-5 w-5" strokeWidth={1.5} /> {t('portal.consultar')}
                </h3>
                <p className="text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                  {t('portal.consultarNota')}
                </p>
                <form onSubmit={onSubmit} className="space-y-4 pt-1">
                  <div>
                    <span className={fieldLabelClass}>{t('portal.campo.codigo')}</span>
                    <input
                      className={fieldInputClass}
                      value={entrada}
                      onChange={(e) => setEntrada(e.target.value)}
                      placeholder={t('portal.campo.codigoEjemplo')}
                    />
                  </div>
                  {error ? (
                    <div className="flex items-start gap-2 border border-red-200 bg-red-50 p-3 text-[11px] leading-relaxed text-red-800 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400">
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  ) : null}
                  <LuxButton type="submit" disabled={cargando} className="w-full">
                    {cargando ? (
                      <>
                        <SpinnerLentes className="h-4 w-7" /> {t('portal.validando')}
                      </>
                    ) : (
                      t('portal.validar')
                    )}
                  </LuxButton>
                </form>
              </div>
              <div className="space-y-2 border border-neutral-200 bg-lux-gray p-4 dark:border-white/10 dark:bg-white/5">
                <span className="flex items-center gap-1.5 font-mono text-[9px] font-bold uppercase tracking-wider text-lux-tinta">
                  <ShieldCheck className="h-3.5 w-3.5" /> {t('portal.estandar')}
                </span>
                <p className="text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">
                  {t('portal.estandarNota')}
                </p>
              </div>
            </LuxCard>
          </motion.div>

          {/* Aviso editorial */}
          <motion.div {...fadeUp} className="lg:col-span-7">
            <LuxCard className="flex h-full flex-col justify-center gap-6 bg-lux-gray p-10 dark:bg-[#0e0e0e]">
              <Kicker>{t('portal.proteccion')}</Kicker>
              <h2 className="font-serif text-2xl font-light leading-tight tracking-tight text-lux-blue dark:text-white md:text-3xl">
                {t('portal.lema')}
              </h2>
              <ul className="space-y-4 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                {[
                  t('portal.punto1'),
                  t('portal.punto2'),
                  t('portal.punto3'),
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-neutral-200 bg-white text-lux-tinta dark:border-white/10 dark:bg-black">
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
                ? t('receta.valida')
                : t('receta.invalida')}
            </span>
            <button
              onClick={() => {
                setResultado(null);
                setEntrada('');
              }}
              className="font-mono text-[10px] uppercase tracking-widest opacity-70 hover:opacity-100"
            >
              {t('portal.nuevaConsulta')}
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
                    {t('portal.recetaCertificada')}
                  </p>
                </div>
                <ShieldCheck className="h-8 w-8 text-lux-tinta" strokeWidth={1.2} />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  [t('receta.paciente'), resultado?.paciente],
                  [t('receta.especialista'), resultado?.doctor],
                  // La fecha sigue al idioma elegido, no al del navegador.
                  [t('receta.firmada'), fechaHora(resultado?.firmadoEn)],
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
                      <tr
                        key={r.ojo}
                        className="border-b border-neutral-50 last:border-0 dark:border-white/5"
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

              <div className="flex flex-wrap gap-3 pt-2">
                <a href={`${API_BASE}/recetas/${hash}/pdf`} target="_blank" rel="noreferrer">
                  <LuxButton type="button">
                    <Download className="h-3.5 w-3.5" /> {t('receta.descargarPdf')}
                  </LuxButton>
                </a>
                <LuxButton type="button" variant="ghost" onClick={() => window.print()}>
                  <Printer className="h-3.5 w-3.5" /> {t('portal.imprimir')}
                </LuxButton>
              </div>
            </LuxCard>
          ) : null}
        </motion.div>
      )}
    </section>
  );
};
