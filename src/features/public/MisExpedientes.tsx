import { useEffect, useState } from 'react';
import { Download, FileText, ShieldCheck, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';
import { misExpedientes } from '../../core/api/portal.service';
import {
  refraccionLegible,
  type EvaluacionPaciente,
} from '../../core/models/portal';
import { useIdioma } from '../../core/i18n/idioma.context';
import { mensajeDeError } from '../../shared/error';
import { API_BASE } from '../../core/api/http';
import {
  Alert,
  Badge,
  LuxCard,
  fieldLabelClass,
} from '../../shared/ui';

/**
 * «Mis Expedientes» (CU-12, `DSO-40`).
 *
 * Vive aparte de `PortalPacientePage` porque solo tiene sentido **con sesión de
 * paciente**, mientras que el verificador por hash de esa página es público y
 * sigue siéndolo: quien llega con un QR en la mano no tiene por qué tener cuenta.
 *
 * ⚠️ **Lo que se pinta aquí es todo lo que la API devuelve, y la API ya filtró.**
 * `EvaluacionPaciente` no trae `notas` ni las 24 columnas del expediente en
 * papel — CU-12 manda ocultarlas. Si alguna vez hace falta añadir un campo
 * clínico a esta vista, la pregunta correcta no es cómo pintarlo sino **si el
 * paciente debe verlo**.
 */
export const MisExpedientes = () => {
  const { t, fechaHora } = useIdioma();
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionPaciente[]>([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    misExpedientes()
      .then((e) => {
        setEvaluaciones(e);
        setError('');
      })
      .catch((e) => setError(mensajeDeError(e, t('expediente.error'))))
      .finally(() => setCargando(false));
    // `t` solo se usa para el texto de respaldo del error. Meterlo en las
    // dependencias haría que cambiar de idioma volviera a pedir los datos a la
    // API, que no es lo que pide un cambio de idioma.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (cargando) {
    return (
      <LuxCard className="p-10 text-center">
        <p className="text-sm text-neutral-500">{t('expediente.cargando')}</p>
      </LuxCard>
    );
  }

  if (error) return <Alert>{error}</Alert>;

  // EX-14, con el literal del caso de uso.
  if (evaluaciones.length === 0) {
    return (
      <LuxCard className="flex flex-col items-center gap-4 p-12 text-center">
        <FileText className="h-9 w-9 text-neutral-300" strokeWidth={1.3} />
        <p className="text-sm text-neutral-500">{t('expediente.ex14')}</p>
        <p className="max-w-md text-xs text-neutral-400">
          {t('expediente.ex14.detalle')}
        </p>
      </LuxCard>
    );
  }

  return (
    <div className="space-y-5">
      {evaluaciones.map((evaluacion) => (
        <LuxCard key={evaluacion.idEvaluacionClinica} className="p-7">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-lux-tinta">
                {fechaHora(evaluacion.fecha)}
              </p>
              <h3 className="mt-1 flex items-center gap-2 font-serif text-lg italic font-light text-lux-blue dark:text-white">
                <Stethoscope size={15} className="text-lux-tinta" strokeWidth={1.6} />
                {evaluacion.doctor}
              </h3>
            </div>
            {evaluacion.receta ? (
              <Badge tone="green">
                <ShieldCheck size={10} /> {t('expediente.recetaSellada')}
              </Badge>
            ) : null}
          </div>

          {evaluacion.diagnosticos.length > 0 ? (
            <div className="mb-4">
              <p className={fieldLabelClass}>{t('expediente.diagnostico')}</p>
              <ul className="mt-1 space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
                {evaluacion.diagnosticos.map((d) => (
                  <li key={d}>{d}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {evaluacion.refracciones.length > 0 ? (
            <div className="mb-4">
              <p className={fieldLabelClass}>{t('expediente.formula')}</p>
              <ul className="mt-1 space-y-1 font-mono text-xs text-neutral-600 dark:text-neutral-300">
                {evaluacion.refracciones.map((r) => (
                  <li key={r.ojo}>
                    <strong>{r.ojo}</strong> · {refraccionLegible(r)}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {evaluacion.receta ? (
            <div className="flex flex-wrap items-center gap-3 border-t border-neutral-150 pt-4 dark:border-white/10">
              {/*
                CU-12 pasos 5–6: sirve el PDF **ya generado** en CU-16. No se
                regenera nada al descargarlo, que es justo lo que pide el flujo
                alterno de «solo lectura».
              */}
              <a
                href={`${API_BASE}/recetas/${evaluacion.receta.hash}/pdf`}
                target="_blank"
                rel="noreferrer"
                className="transition-luxe inline-flex items-center gap-2 border border-lux-blue px-5 py-2.5 text-[10px] font-semibold uppercase tracking-wider2 text-lux-blue hover:bg-lux-blue hover:text-white dark:border-lux-tinta-claro dark:text-lux-tinta-claro dark:hover:bg-lux-tinta-claro dark:hover:text-black"
              >
                <Download size={13} />
                {t('expediente.descargar')}
              </a>
              <Link
                to={`/verificar/${evaluacion.receta.hash}`}
                className="text-[10px] uppercase tracking-wider text-neutral-500 underline hover:text-lux-tinta"
              >
                {t('expediente.verificar')}
              </Link>
            </div>
          ) : null}
        </LuxCard>
      ))}
    </div>
  );
};
