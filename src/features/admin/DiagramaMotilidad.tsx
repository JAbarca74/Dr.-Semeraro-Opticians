import { useIdioma } from '../../core/i18n/idioma.context';
import {
  EstadoMotilidad,
  POSICIONES_MIRADA,
  type MotilidadOjo,
  type PosicionMirada,
} from '../../core/models/expediente';
import { cx } from '../../shared/ui';

/**
 * Diagrama de movimientos oculares del expediente impreso: el ojo con su iris,
 * el eje horizontal y los dos ejes verticales. Cada cruce es una de las nueve
 * posiciones diagnósticas de mirada y se marca haciendo clic:
 * sin evaluar → normal → limitado → sin evaluar.
 */

const ETIQUETA_POSICION: Record<PosicionMirada, string> = {
  arribaIzq: 'arriba izquierda',
  arriba: 'arriba',
  arribaDer: 'arriba derecha',
  izq: 'izquierda',
  centro: 'posición primaria',
  der: 'derecha',
  abajoIzq: 'abajo izquierda',
  abajo: 'abajo',
  abajoDer: 'abajo derecha',
};

/** Coordenadas de cada posición sobre los ejes dibujados. */
const COORDENADA: Record<PosicionMirada, { x: number; y: number }> = {
  arribaIzq: { x: 62, y: 14 },
  arriba: { x: 100, y: 14 },
  arribaDer: { x: 138, y: 14 },
  izq: { x: 62, y: 60 },
  centro: { x: 100, y: 60 },
  der: { x: 138, y: 60 },
  abajoIzq: { x: 62, y: 106 },
  abajo: { x: 100, y: 106 },
  abajoDer: { x: 138, y: 106 },
};

const ETIQUETA_ESTADO: Record<EstadoMotilidad | 'sinEvaluar', string> = {
  normal: 'normal',
  limitado: 'limitado',
  sinEvaluar: 'sin evaluar',
};

/** Siguiente estado del ciclo de tres pasos. */
const siguienteEstado = (
  actual?: EstadoMotilidad,
): EstadoMotilidad | undefined => {
  if (actual === undefined) return EstadoMotilidad.NORMAL;
  if (actual === EstadoMotilidad.NORMAL) return EstadoMotilidad.LIMITADO;
  return undefined;
};

interface Props {
  /** Rótulo del ojo: «OD» u «OI». */
  ojo: string;
  valor: MotilidadOjo;
  onChange?: (valor: MotilidadOjo) => void;
  soloLectura?: boolean;
}

export const DiagramaMotilidad = ({
  ojo,
  valor,
  onChange,
  soloLectura = false,
}: Props) => {
  const { t } = useIdioma();
  const alternar = (posicion: PosicionMirada) => {
    if (soloLectura || !onChange) return;
    const siguiente = siguienteEstado(valor[posicion]);
    const copia: MotilidadOjo = { ...valor };
    if (siguiente) {
      copia[posicion] = siguiente;
    } else {
      delete copia[posicion];
    }
    onChange(copia);
  };

  return (
    <figure className="space-y-2">
      <figcaption className="font-clinico text-[11px] font-bold uppercase tracking-wider2 text-lux-tinta">
        Ojo {ojo === 'OD' ? 'derecho (OD)' : 'izquierdo (OI)'}
      </figcaption>
      <svg
        viewBox="0 0 200 120"
        className="w-full max-w-[260px] text-lux-blue dark:text-neutral-200"
        role="group"
        aria-label={`Movimientos oculares del ojo ${ojo}`}
      >
        {/* Ejes del impreso: uno horizontal y dos verticales. */}
        <line x1="10" y1="60" x2="190" y2="60" stroke="currentColor" strokeWidth="1.5" />
        <line x1="62" y1="8" x2="62" y2="112" stroke="currentColor" strokeWidth="1.5" />
        <line x1="138" y1="8" x2="138" y2="112" stroke="currentColor" strokeWidth="1.5" />

        {/* Ojo e iris. */}
        <ellipse
          cx="100"
          cy="60"
          rx="70"
          ry="38"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle
          cx="100"
          cy="60"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle cx="100" cy="60" r="3.5" fill="currentColor" />

        {POSICIONES_MIRADA.map((posicion) => {
          const { x, y } = COORDENADA[posicion];
          const estado = valor[posicion];
          const descripcion = `${ETIQUETA_POSICION[posicion]}: ${
            ETIQUETA_ESTADO[estado ?? 'sinEvaluar']
          }`;
          return (
            <circle
              key={posicion}
              cx={x}
              cy={y}
              r={posicion === 'centro' ? 10 : 8}
              role={soloLectura ? 'img' : 'button'}
              aria-label={`${ojo} ${descripcion}`}
              tabIndex={soloLectura ? undefined : 0}
              onClick={() => alternar(posicion)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  alternar(posicion);
                }
              }}
              className={cx(
                'transition-luxe outline-none',
                !soloLectura && 'cursor-pointer focus-visible:stroke-lux-tinta',
                estado === EstadoMotilidad.NORMAL &&
                  'fill-emerald-500/80 stroke-emerald-600',
                estado === EstadoMotilidad.LIMITADO &&
                  'fill-red-500/80 stroke-red-600',
                !estado &&
                  'fill-white stroke-neutral-400 hover:stroke-lux-tinta dark:fill-neutral-900',
              )}
              strokeWidth="1.5"
            />
          );
        })}
      </svg>
      {!soloLectura ? (
        <p className="text-[10px] leading-relaxed text-neutral-500 dark:text-neutral-400">{t('exp.motilidadAyuda')}<span className="text-emerald-600">normal</span> →{' '}
          <span className="text-red-600">limitado</span>.
        </p>
      ) : null}
    </figure>
  );
};
