import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  BarChart3,
  CalendarRange,
  FileDown,
  FileSpreadsheet,
  Package,
  Receipt,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';
import {
  reporteMetricasPdf,
  resumenMetricas,
} from '../../core/api/metricas.service';
import { colones } from '../../core/models/inventario';
import {
  ENCABEZADOS_CSV,
  filasCsvMetricas,
  hoyISO,
  nombreReporte,
  periodoLegible,
  porcentaje,
  primerDiaDelMes,
  type ResumenMetricas,
} from '../../core/models/metricas';
import { aCsv, descargarCsv } from '../../shared/csv';
import { descargarArchivo } from '../../shared/descarga';
import { mensajeDeError } from '../../shared/error';
import {
  Alert,
  LuxButton,
  LuxCard,
  SectionHeader,
  cx,
  fieldInputClass,
  fieldLabelClass,
} from '../../shared/ui';

/** Colores de la gráfica de agenda, uno por estado. */
const COLOR_ESTADO: Record<string, string> = {
  Solicitada: 'bg-neutral-400',
  Confirmada: 'bg-emerald-500',
  Cancelada: 'bg-red-400',
  Reprogramada: 'bg-amber-400',
};

const Indicador = ({
  icono: Icono,
  etiqueta,
  valor,
  pie,
}: {
  icono: typeof Receipt;
  etiqueta: string;
  valor: string;
  pie?: string;
}) => (
  <LuxCard className="p-6">
    <span className="flex h-9 w-9 items-center justify-center border border-neutral-200 text-lux-tinta dark:border-white/10">
      <Icono className="h-4 w-4" strokeWidth={1.6} />
    </span>
    <p className={cx(fieldLabelClass, 'mt-4')}>{etiqueta}</p>
    <p className="mt-1 text-3xl font-semibold tabular-nums text-lux-blue dark:text-white">
      {valor}
    </p>
    {pie ? <p className="mt-1 text-[10px] text-neutral-400">{pie}</p> : null}
  </LuxCard>
);

/**
 * Panel de métricas gerenciales (CU-19, `DSO-47`).
 *
 * Dejó de ser placeholder el 2026-08-26. Consume `GET /metricas` (`DSO-46`),
 * que **solo responde al Administrador**.
 *
 * ⚠️ **Esta pantalla no calcula nada.** Todos los agregados —ingresos, ticket
 * promedio, top de aros, conteos por estado— llegan ya sumados desde SQL, que
 * es lo que exige **RS-18**. Si aquí apareciera un `reduce` sobre listas de
 * ventas, se estaría trayendo la tabla al navegador para contarla, que es
 * justo lo que el requisito prohíbe.
 *
 * Las gráficas son **barras en CSS**, sin librería: el volumen de datos es de
 * decenas de filas y meter una dependencia de gráficos para esto sería alcance
 * nuevo que nadie pidió.
 *
 * El flujo alterno «Descargar Resumen» (`DSO-48`) sale por dos caminos a
 * propósito: el **CSV se arma aquí**, con lo que ya está en pantalla, y el
 * **PDF lo arma la API**, que es donde vive PDFKit. Duplicar el PDF en el
 * navegador exigiría una librería de tipografía solo para esto.
 */
export const MetricasPage = () => {
  const [datos, setDatos] = useState<ResumenMetricas | null>(null);
  const [desde, setDesde] = useState(primerDiaDelMes());
  const [hasta, setHasta] = useState(hoyISO());
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [generandoPdf, setGenerandoPdf] = useState(false);

  const cargar = useCallback(async (d: string, h: string) => {
    setCargando(true);
    try {
      setDatos(await resumenMetricas({ desde: d, hasta: h }));
      setError('');
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudieron cargar las métricas'));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar(desde, hasta);
    // Solo al montar: después el rango se aplica pulsando «Aplicar».
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aplicar = (e: FormEvent) => {
    e.preventDefault();
    void cargar(desde, hasta);
  };

  const restablecer = () => {
    const d = primerDiaDelMes();
    const h = hoyISO();
    setDesde(d);
    setHasta(h);
    void cargar(d, h);
  };

  /**
   * CU-19, flujo alterno: «Descargar Resumen» en CSV.
   *
   * Se arma **con lo que está en pantalla**, sin volver a llamar a la API: es
   * el literal del CU y además evita que cada descarga vuelva a agregar en la
   * base transaccional (**RS-18**).
   */
  const exportarCsv = () => {
    if (!datos) return;
    descargarCsv(
      nombreReporte(datos, 'csv'),
      aCsv(ENCABEZADOS_CSV, filasCsvMetricas(datos)),
    );
  };

  /** El PDF sí lo arma la API: es donde vive PDFKit. */
  const exportarPdf = async () => {
    if (!datos) return;
    setGenerandoPdf(true);
    try {
      descargarArchivo(
        nombreReporte(datos, 'pdf'),
        await reporteMetricasPdf({ desde, hasta }),
      );
      setError('');
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo generar el PDF del resumen'));
    } finally {
      setGenerandoPdf(false);
    }
  };

  const rangoInvertido = desde > hasta;

  return (
    <div className="space-y-8">
      <SectionHeader
        kicker="CU-19 · Inteligencia de negocio"
        title="Métricas e indicadores"
        description="Desempeño de ventas, movimiento de inventario y estado de la agenda. Solo lectura: este panel no modifica datos."
      />

      {error ? <Alert>{error}</Alert> : null}

      {/* CU-19 paso 3: rango de fechas personalizado. */}
      <LuxCard className="p-5">
        <form onSubmit={aplicar} className="flex flex-wrap items-end gap-3">
          <div>
            <label className={fieldLabelClass} htmlFor="desde">
              Desde
            </label>
            <input
              id="desde"
              type="date"
              className={fieldInputClass}
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
            />
          </div>
          <div>
            <label className={fieldLabelClass} htmlFor="hasta">
              Hasta
            </label>
            <input
              id="hasta"
              type="date"
              className={fieldInputClass}
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
            />
          </div>
          <LuxButton type="submit" variant="ghost" disabled={rangoInvertido || cargando}>
            <CalendarRange size={14} />
            Aplicar
          </LuxButton>
          <LuxButton type="button" variant="ghost" onClick={restablecer}>
            <RotateCcw size={13} />
            Mes actual
          </LuxButton>

          {/*
            CU-19, flujo alterno «Descargar Resumen». Siguen habilitados cuando
            el periodo sale vacío: el archivo entonces dice «No hay registros
            disponibles para este periodo», que es una constancia útil. Un botón
            deshabilitado no distingue «no hubo nada» de «la descarga falla».
          */}
          <span className="ml-auto flex flex-wrap gap-3">
            <LuxButton
              type="button"
              variant="ghost"
              onClick={exportarCsv}
              disabled={!datos}
            >
              <FileSpreadsheet size={13} />
              Resumen CSV
            </LuxButton>
            <LuxButton
              type="button"
              variant="ghost"
              onClick={() => void exportarPdf()}
              disabled={!datos || generandoPdf}
            >
              <FileDown size={13} />
              {generandoPdf ? 'Generando…' : 'Resumen PDF'}
            </LuxButton>
          </span>
          {rangoInvertido ? (
            <p className="w-full text-[10px] text-red-600 dark:text-red-400">
              La fecha «desde» no puede ser posterior a «hasta».
            </p>
          ) : null}
        </form>
      </LuxCard>

      {!datos ? (
        <LuxCard className="p-12 text-center">
          <p className="text-sm text-neutral-500">
            {cargando ? 'Calculando métricas…' : 'No se pudieron cargar las métricas.'}
          </p>
        </LuxCard>
      ) : datos.sinDatos ? (
        /* EX-21, con el literal del caso de uso. */
        <LuxCard className="flex flex-col items-center gap-3 p-12 text-center">
          <BarChart3 className="h-9 w-9 text-neutral-300" strokeWidth={1.3} />
          <p className="text-sm text-neutral-500">
            No hay registros disponibles para este periodo
          </p>
          <p className="text-xs text-neutral-400">
            {periodoLegible(datos.periodo.desde, datos.periodo.hasta)}
          </p>
        </LuxCard>
      ) : (
        <>
          <p className="text-[10px] uppercase tracking-widest text-neutral-400">
            Periodo: {periodoLegible(datos.periodo.desde, datos.periodo.hasta)}
          </p>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <Indicador
              icono={TrendingUp}
              etiqueta="Ingresos internos"
              valor={colones(datos.ventas.ingresos)}
              pie={`${datos.ventas.cantidad} venta(s) registrada(s)`}
            />
            <Indicador
              icono={Receipt}
              etiqueta="Ticket promedio"
              valor={colones(datos.ventas.ticketPromedio)}
              pie={
                datos.ventas.anuladas > 0
                  ? `${datos.ventas.anuladas} anulada(s), fuera del ingreso`
                  : 'Sin anulaciones en el periodo'
              }
            />
            <Indicador
              icono={Package}
              etiqueta="Unidades vendidas"
              valor={String(datos.inventario.unidadesVendidas)}
              pie={`${datos.inventario.unidadesEnBodega} en bodega hoy`}
            />
            <Indicador
              icono={CalendarRange}
              etiqueta="Citas del periodo"
              valor={String(datos.agenda.total)}
              pie={`${datos.inventario.bajoStock} producto(s) bajo stock`}
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {/* CU-19 paso 5: top de aros vendidos. */}
            <LuxCard className="p-6">
              <p className={cx(fieldLabelClass, 'mb-4')}>Aros más vendidos</p>
              {datos.topAros.length === 0 ? (
                <p className="py-6 text-center text-xs text-neutral-400">
                  No hubo salidas de producto en este periodo.
                </p>
              ) : (
                <ul className="space-y-3">
                  {datos.topAros.map((aro) => (
                    <li key={aro.idProducto}>
                      <div className="flex items-baseline justify-between gap-3 text-xs">
                        <span className="min-w-0 truncate">
                          <strong>{aro.nombre}</strong>{' '}
                          <span className="text-neutral-400">{aro.marca}</span>
                        </span>
                        <span className="shrink-0 tabular-nums text-neutral-500">
                          {aro.unidades} u · {colones(aro.ingresos)}
                        </span>
                      </div>
                      <div className="mt-1 h-1.5 w-full bg-neutral-150 dark:bg-neutral-800">
                        <div
                          className="h-full bg-lux-tinta"
                          style={{
                            width: `${porcentaje(
                              aro.unidades,
                              datos.topAros[0].unidades,
                            )}%`,
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </LuxCard>

            {/* Estado de la agenda. */}
            <LuxCard className="p-6">
              <p className={cx(fieldLabelClass, 'mb-4')}>Estado de la agenda</p>
              <ul className="space-y-3">
                {Object.entries(datos.agenda.porEstado).map(([estado, total]) => (
                  <li key={estado}>
                    <div className="flex items-baseline justify-between gap-3 text-xs">
                      <span>{estado}</span>
                      <span className="tabular-nums text-neutral-500">
                        {total} · {porcentaje(total, datos.agenda.total)}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full bg-neutral-150 dark:bg-neutral-800">
                      <div
                        className={cx(
                          'h-full',
                          COLOR_ESTADO[estado] ?? 'bg-neutral-400',
                        )}
                        style={{
                          width: `${porcentaje(total, datos.agenda.total)}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </LuxCard>
          </div>

          <LuxCard className="p-6">
            <p className={cx(fieldLabelClass, 'mb-3')}>Inventario</p>
            <dl className="grid gap-4 sm:grid-cols-4 text-xs">
              <div>
                <dt className="text-neutral-400">Productos en catálogo</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {datos.inventario.productos}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-400">Unidades en bodega</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {datos.inventario.unidadesEnBodega}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-400">Bajo stock</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {datos.inventario.bajoStock}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-400">Salidas del periodo</dt>
                <dd className="text-lg font-semibold tabular-nums">
                  {datos.inventario.unidadesVendidas}
                </dd>
              </div>
            </dl>
            {/*
              El backend lo comenta y la pantalla lo repite: sin esta línea,
              alguien leería «tenía 55 unidades en marzo», y no es lo que dice.
            */}
            <p className="mt-4 text-[10px] text-neutral-400">
              Las existencias y la alerta de stock son del día de hoy: la bodega no
              guarda historia. Solo las salidas corresponden al periodo consultado.
            </p>
          </LuxCard>
        </>
      )}
    </div>
  );
};
