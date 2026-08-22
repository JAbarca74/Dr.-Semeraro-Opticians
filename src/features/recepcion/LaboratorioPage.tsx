import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, ClipboardList, Plus, RefreshCw, X } from 'lucide-react';
import {
  cambiarEstadoOrden,
  crearOrden,
  historialDeOrden,
  listarOrdenes,
  marcarRetraso,
  type FiltrosOrden,
} from '../../core/api/laboratorio.service';
import {
  EstadoOrden,
  destinosPermitidos,
  diasRetrasada,
  esTerminal,
  etiquetaEstado,
  fechaCorta,
  fechaHoraLarga,
  type HistorialOrden,
  type OrdenInput,
  type OrdenLaboratorio,
} from '../../core/models/laboratorio';
import { mensajeDeError } from '../../shared/error';
import {
  RecepButton,
  RecepCard,
  RecepHeader,
  cx,
  recepFade,
  recepInputClass,
  recepLabelClass,
} from './RecepcionShared';

/** Color del badge por estado. `Retrasado` es el único que grita. */
const COLOR_ESTADO: Record<EstadoOrden, string> = {
  [EstadoOrden.ENVIADO]: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  [EstadoOrden.EN_PROCESO]: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  [EstadoOrden.RECIBIDO]: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  [EstadoOrden.LISTO]: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  [EstadoOrden.RETRASADO]: 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  [EstadoOrden.CANCELADO]: 'bg-neutral-100 text-neutral-500 line-through dark:bg-neutral-800 dark:text-neutral-500',
};

const Badge = ({ estado }: { estado: EstadoOrden }) => (
  <span
    className={cx(
      'inline-block whitespace-nowrap px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider',
      COLOR_ESTADO[estado],
    )}
  >
    {etiquetaEstado(estado)}
  </span>
);

const FILTROS: Array<{ clave: string; label: string; filtros: FiltrosOrden }> = [
  { clave: 'pendientes', label: 'Pendientes', filtros: { pendientes: true } },
  { clave: 'todas', label: 'Todas', filtros: {} },
  { clave: 'retrasadas', label: 'Retrasadas', filtros: { estado: EstadoOrden.RETRASADO } },
  { clave: 'listas', label: 'Listas', filtros: { estado: EstadoOrden.LISTO } },
];

const ALTA_VACIA: OrdenInput = {
  idVenta: 0,
  laboratorioNombre: '',
  especificaciones: '',
  laboratorioContacto: '',
  laboratorioTelefono: '',
  fechaEstimadaEntrega: '',
};

/**
 * Tablero de control de órdenes de laboratorio (CU-07, `DSO-28`).
 *
 * Se monta en `/recepcion/laboratorio` y en `/admin/laboratorio`: es la misma
 * pantalla, no una copia. CU-07 la describe para **Doctor y Recepción**, y el
 * guard de `/recepcion` deja fuera al Doctor, así que con una sola ruta el caso
 * de uso quedaría a medias. Mismo criterio que se aplicó a la agenda (CU-05).
 */
export const LaboratorioPage = () => {
  const [ordenes, setOrdenes] = useState<OrdenLaboratorio[]>([]);
  const [filtro, setFiltro] = useState('pendientes');
  const [seleccionada, setSeleccionada] = useState<OrdenLaboratorio | null>(null);
  const [historial, setHistorial] = useState<HistorialOrden[]>([]);
  const [destino, setDestino] = useState<EstadoOrden | ''>('');
  const [comentario, setComentario] = useState('');
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [alta, setAlta] = useState<OrdenInput>(ALTA_VACIA);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const filtroActivo = useMemo(
    () => FILTROS.find((f) => f.clave === filtro) ?? FILTROS[0],
    [filtro],
  );

  const cargar = async (clave = filtro) => {
    const activo = FILTROS.find((f) => f.clave === clave) ?? FILTROS[0];
    setCargando(true);
    try {
      setOrdenes(await listarOrdenes(activo.filtros));
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudieron cargar las órdenes'));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargar(filtro);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro]);

  const abrir = async (orden: OrdenLaboratorio) => {
    setSeleccionada(orden);
    setDestino('');
    setComentario('');
    setError('');
    setOk('');
    try {
      setHistorial(await historialDeOrden(orden.idOrdenLaboratorio));
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo cargar el historial'));
    }
  };

  const cerrar = () => {
    setSeleccionada(null);
    setHistorial([]);
  };

  // El motivo solo es obligatorio al marcar retraso; en el resto es opcional.
  const exigeMotivo = destino === EstadoOrden.RETRASADO;
  const motivoIncompleto = exigeMotivo && comentario.trim().length < 3;

  const aplicarCambio = async (e: FormEvent) => {
    e.preventDefault();
    if (!seleccionada || !destino || motivoIncompleto) return;
    setError('');
    setOk('');
    setGuardando(true);
    try {
      const actualizada = exigeMotivo
        ? await marcarRetraso(seleccionada.idOrdenLaboratorio, comentario.trim())
        : await cambiarEstadoOrden(
            seleccionada.idOrdenLaboratorio,
            destino,
            comentario.trim() || undefined,
          );
      setOk(`Orden #${actualizada.idOrdenLaboratorio}: ${etiquetaEstado(actualizada.estado)}.`);
      setComentario('');
      setDestino('');
      await abrir(actualizada);
      await cargar();
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo cambiar el estado de la orden'));
    } finally {
      setGuardando(false);
    }
  };

  const registrarOrden = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setOk('');
    setGuardando(true);
    try {
      // Las cadenas vacías no se mandan: el backend distingue «sin dato» de «''».
      const payload: OrdenInput = {
        idVenta: Number(alta.idVenta),
        laboratorioNombre: alta.laboratorioNombre.trim(),
        especificaciones: alta.especificaciones.trim(),
      };
      if (alta.laboratorioContacto?.trim()) payload.laboratorioContacto = alta.laboratorioContacto.trim();
      if (alta.laboratorioTelefono?.trim()) payload.laboratorioTelefono = alta.laboratorioTelefono.trim();
      if (alta.fechaEstimadaEntrega) payload.fechaEstimadaEntrega = alta.fechaEstimadaEntrega;

      const creada = await crearOrden(payload);
      setOk(`Orden #${creada.idOrdenLaboratorio} abierta para la venta #${creada.idVenta}.`);
      setAlta(ALTA_VACIA);
      setMostrarAlta(false);
      await cargar();
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo abrir la orden'));
    } finally {
      setGuardando(false);
    }
  };

  const destinos = seleccionada ? destinosPermitidos(seleccionada) : [];
  const terminal = seleccionada ? esTerminal(seleccionada) : false;

  return (
    <div>
      <RecepHeader
        cu="CU-07 · Logística de Taller"
        title="Control de Laboratorio"
        description="Seguimiento de las órdenes de fabricación: estado, tiempos y bitácora de cada cambio."
        actions={
          <>
            <RecepButton variant="outline" onClick={() => void cargar()} disabled={cargando}>
              <RefreshCw size={14} className={cargando ? 'animate-spin' : undefined} />
              Actualizar
            </RecepButton>
            <RecepButton onClick={() => setMostrarAlta((v) => !v)}>
              <Plus size={14} />
              Nueva orden
            </RecepButton>
          </>
        }
      />

      {error ? (
        <p role="alert" className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      ) : null}
      {ok ? (
        <p role="status" className="mb-4 border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          {ok}
        </p>
      ) : null}

      <AnimatePresence>
        {mostrarAlta ? (
          <motion.div {...recepFade} key="alta">
            <RecepCard className="mb-6 p-6">
              <form onSubmit={registrarOrden} className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className={recepLabelClass} htmlFor="idVenta">
                    Venta *
                  </label>
                  <input
                    id="idVenta"
                    type="number"
                    min={1}
                    required
                    className={recepInputClass}
                    value={alta.idVenta || ''}
                    onChange={(e) => setAlta({ ...alta, idVenta: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className={recepLabelClass} htmlFor="laboratorioNombre">
                    Laboratorio *
                  </label>
                  <input
                    id="laboratorioNombre"
                    required
                    maxLength={150}
                    className={recepInputClass}
                    value={alta.laboratorioNombre}
                    onChange={(e) => setAlta({ ...alta, laboratorioNombre: e.target.value })}
                  />
                </div>
                <div>
                  <label className={recepLabelClass} htmlFor="fechaEstimadaEntrega">
                    Entrega estimada
                  </label>
                  <input
                    id="fechaEstimadaEntrega"
                    type="date"
                    className={recepInputClass}
                    value={alta.fechaEstimadaEntrega ?? ''}
                    onChange={(e) => setAlta({ ...alta, fechaEstimadaEntrega: e.target.value })}
                  />
                </div>
                <div>
                  <label className={recepLabelClass} htmlFor="laboratorioContacto">
                    Contacto
                  </label>
                  <input
                    id="laboratorioContacto"
                    maxLength={150}
                    className={recepInputClass}
                    value={alta.laboratorioContacto ?? ''}
                    onChange={(e) => setAlta({ ...alta, laboratorioContacto: e.target.value })}
                  />
                </div>
                <div>
                  <label className={recepLabelClass} htmlFor="laboratorioTelefono">
                    Teléfono
                  </label>
                  <input
                    id="laboratorioTelefono"
                    maxLength={20}
                    className={recepInputClass}
                    value={alta.laboratorioTelefono ?? ''}
                    onChange={(e) => setAlta({ ...alta, laboratorioTelefono: e.target.value })}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className={recepLabelClass} htmlFor="especificaciones">
                    Especificaciones *
                  </label>
                  <textarea
                    id="especificaciones"
                    required
                    rows={3}
                    className={recepInputClass}
                    value={alta.especificaciones}
                    onChange={(e) => setAlta({ ...alta, especificaciones: e.target.value })}
                  />
                </div>
                <div className="md:col-span-3 flex justify-end gap-3">
                  <RecepButton type="button" variant="outline" onClick={() => setMostrarAlta(false)}>
                    Cancelar
                  </RecepButton>
                  <RecepButton type="submit" disabled={guardando}>
                    {guardando ? 'Abriendo…' : 'Abrir orden'}
                  </RecepButton>
                </div>
              </form>
            </RecepCard>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mb-5 flex flex-wrap gap-2">
        {FILTROS.map((f) => (
          <button
            key={f.clave}
            type="button"
            onClick={() => setFiltro(f.clave)}
            className={cx(
              'px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors',
              f.clave === filtroActivo.clave
                ? 'bg-lux-dark text-white dark:bg-lux-tinta-claro dark:text-lux-dark'
                : 'border border-neutral-250 text-neutral-600 hover:border-lux-tinta dark:border-neutral-700 dark:text-neutral-400',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <RecepCard className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="border-b border-neutral-200 text-[10px] uppercase tracking-wider text-neutral-500 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-3">Orden</th>
                <th className="px-4 py-3">Venta</th>
                <th className="px-4 py-3">Laboratorio</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Entrega</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                    {cargando ? 'Cargando órdenes…' : 'No hay órdenes con este filtro.'}
                  </td>
                </tr>
              ) : (
                ordenes.map((o) => (
                  <tr
                    key={o.idOrdenLaboratorio}
                    onClick={() => void abrir(o)}
                    className={cx(
                      'cursor-pointer border-b border-neutral-100 transition-colors hover:bg-stone-50 dark:border-neutral-800 dark:hover:bg-neutral-900',
                      seleccionada?.idOrdenLaboratorio === o.idOrdenLaboratorio &&
                        'bg-stone-50 dark:bg-neutral-900',
                    )}
                  >
                    <td className="px-4 py-3 font-semibold">#{o.idOrdenLaboratorio}</td>
                    <td className="px-4 py-3 text-neutral-500">#{o.idVenta}</td>
                    <td className="px-4 py-3">{o.laboratorioNombre}</td>
                    <td className="px-4 py-3">
                      <Badge estado={o.estado} />
                      {o.estado === EstadoOrden.RETRASADO ? (
                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400">
                          <AlertTriangle size={11} />
                          {diasRetrasada(o)} d
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {fechaCorta(o.fechaEstimadaEntrega)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </RecepCard>

        <RecepCard className="p-6">
          {!seleccionada ? (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center text-neutral-400">
              <ClipboardList size={28} className="mb-3" />
              <p className="text-xs">Seleccione una orden para ver su detalle y su bitácora.</p>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-lux-tinta">
                    Orden #{seleccionada.idOrdenLaboratorio} · Venta #{seleccionada.idVenta}
                  </p>
                  <h2 className="mt-1 font-serif text-2xl italic font-light text-lux-blue dark:text-white">
                    {seleccionada.laboratorioNombre}
                  </h2>
                </div>
                <button
                  type="button"
                  aria-label="Cerrar detalle"
                  onClick={cerrar}
                  className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <dl className="mb-5 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className={recepLabelClass}>Estado</dt>
                  <dd><Badge estado={seleccionada.estado} /></dd>
                </div>
                <div>
                  <dt className={recepLabelClass}>Entrega estimada</dt>
                  <dd>{fechaCorta(seleccionada.fechaEstimadaEntrega)}</dd>
                </div>
                {seleccionada.laboratorioContacto ? (
                  <div>
                    <dt className={recepLabelClass}>Contacto</dt>
                    <dd>{seleccionada.laboratorioContacto}</dd>
                  </div>
                ) : null}
                {seleccionada.laboratorioTelefono ? (
                  <div>
                    <dt className={recepLabelClass}>Teléfono</dt>
                    <dd>{seleccionada.laboratorioTelefono}</dd>
                  </div>
                ) : null}
                <div className="col-span-2">
                  <dt className={recepLabelClass}>Especificaciones</dt>
                  <dd className="whitespace-pre-line text-neutral-600 dark:text-neutral-300">
                    {seleccionada.especificaciones}
                  </dd>
                </div>
              </dl>

              {seleccionada.estado === EstadoOrden.RETRASADO ? (
                <p className="mb-5 flex items-start gap-2 border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                  <span>
                    Detenida hace {diasRetrasada(seleccionada)} día(s). El contador de entrega
                    está parado: al reanudar, la fecha estimada se corre otro tanto.
                  </span>
                </p>
              ) : null}

              {terminal ? (
                <p className="mb-5 border border-neutral-200 bg-stone-50 px-3 py-2.5 text-[11px] text-neutral-600 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                  La orden está «{etiquetaEstado(seleccionada.estado)}» y ya no admite cambios
                  de estado.
                </p>
              ) : (
                <form onSubmit={aplicarCambio} className="mb-6 border-t border-neutral-150 pt-5 dark:border-neutral-800">
                  <label className={recepLabelClass} htmlFor="destino">
                    Cambiar estado
                  </label>
                  <select
                    id="destino"
                    className={recepInputClass}
                    value={destino}
                    onChange={(e) => setDestino(e.target.value as EstadoOrden | '')}
                  >
                    <option value="">Seleccione…</option>
                    {destinos.map((d) => (
                      <option key={d} value={d}>
                        {etiquetaEstado(d)}
                      </option>
                    ))}
                  </select>

                  {destino ? (
                    <div className="mt-3">
                      <label className={recepLabelClass} htmlFor="comentario">
                        {exigeMotivo ? 'Motivo del retraso *' : 'Comentario (opcional)'}
                      </label>
                      <input
                        id="comentario"
                        className={recepInputClass}
                        maxLength={200}
                        value={comentario}
                        onChange={(e) => setComentario(e.target.value)}
                      />
                      {motivoIncompleto ? (
                        <p className="mt-1.5 text-[10px] text-amber-700 dark:text-amber-400">
                          Para marcar la orden como retrasada hay que indicar el motivo.
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <RecepButton
                    type="submit"
                    className="mt-4 w-full"
                    disabled={!destino || motivoIncompleto || guardando}
                  >
                    {guardando ? 'Guardando…' : 'Confirmar cambio'}
                  </RecepButton>
                </form>
              )}

              <div>
                <p className={recepLabelClass}>Bitácora</p>
                {historial.length === 0 ? (
                  <p className="text-[11px] text-neutral-400">
                    Sin cambios registrados: la orden sigue como se abrió.
                  </p>
                ) : (
                  <ol className="space-y-2.5">
                    {historial.map((h) => (
                      <li key={h.idHistorialOrden} className="border-l-2 border-neutral-200 pl-3 dark:border-neutral-700">
                        <p className="text-[11px]">
                          {etiquetaEstado(h.estadoAnterior)} → <strong>{etiquetaEstado(h.estadoNuevo)}</strong>
                        </p>
                        <p className="text-[10px] text-neutral-400">{fechaHoraLarga(h.changedAt)}</p>
                        {h.comentario ? (
                          <p className="mt-0.5 text-[10px] italic text-neutral-500">«{h.comentario}»</p>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          )}
        </RecepCard>
      </div>
    </div>
  );
};
