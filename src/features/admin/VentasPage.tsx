import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Minus,
  Plus,
  Receipt,
  RotateCcw,
  Search,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react';
import { listarProductos } from '../../core/api/inventario.service';
import { listarPersonas } from '../../core/api/personas.service';
import {
  anularVenta,
  listarVentas,
  registrarVenta,
} from '../../core/api/ventas.service';
import { colones } from '../../core/models/inventario';
import type { Producto } from '../../core/models/inventario';
import { TipoPersona, type Persona } from '../../core/models/persona';
import {
  EstadoVenta,
  agregarAlCarrito,
  etiquetaEstadoVenta,
  fechaHoraLarga,
  lineasSinExistencias,
  totalCarrito,
  type LineaCarrito,
  type Venta,
} from '../../core/models/venta';
import { mensajeDeError } from '../../shared/error';
import {
  Alert,
  Badge,
  LuxButton,
  LuxCard,
  SectionHeader,
  cx,
  fadeUp,
  fieldInputClass,
  fieldLabelClass,
} from '../../shared/ui';

/**
 * Caja de salidas (CU-04, `DSO-30`).
 *
 * Se monta en `/admin/ventas` y en `/recepcion/ventas`. CU-04 nombra a
 * «Administrador o Recepción» en su precondición, que es justo lo que cubren
 * esos dos entornos.
 */
export const VentasPage = () => {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState<Producto[]>([]);
  const [buscando, setBuscando] = useState(false);

  const [carrito, setCarrito] = useState<LineaCarrito[]>([]);
  const [pacientes, setPacientes] = useState<Persona[]>([]);
  const [idPaciente, setIdPaciente] = useState('');

  const [ventas, setVentas] = useState<Venta[]>([]);
  const [seleccionada, setSeleccionada] = useState<Venta | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [anulando, setAnulando] = useState(false);

  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [cobrando, setCobrando] = useState(false);

  const cargarVentas = async () => {
    try {
      setVentas(await listarVentas({ limite: 20 }));
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudieron cargar las ventas'));
    }
  };

  useEffect(() => {
    void cargarVentas();
    // CU-04 paso 2: el buscador de pacientes es opcional, pero se precarga para
    // que vincular la salida no obligue a otra búsqueda en mitad del cobro.
    listarPersonas()
      .then((ps) => setPacientes(ps.filter((p) => p.tipo === TipoPersona.PACIENTE)))
      .catch(() => {
        // Que no haya lista de pacientes no impide cobrar de mostrador.
      });
  }, []);

  const buscarProductos = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBuscando(true);
    try {
      setResultados(await listarProductos({ q: busqueda.trim() || undefined }));
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo buscar en el inventario'));
    } finally {
      setBuscando(false);
    }
  };

  const agregar = (producto: Producto) => {
    setOk('');
    setCarrito((lineas) =>
      agregarAlCarrito(lineas, {
        idProducto: producto.idProducto,
        sku: producto.sku,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: 1,
        stockDisponible: producto.stock,
      }),
    );
  };

  const cambiarCantidad = (idProducto: number, delta: number) => {
    setCarrito((lineas) =>
      lineas
        .map((l) =>
          l.idProducto === idProducto ? { ...l, cantidad: l.cantidad + delta } : l,
        )
        .filter((l) => l.cantidad > 0),
    );
  };

  const quitar = (idProducto: number) => {
    setCarrito((lineas) => lineas.filter((l) => l.idProducto !== idProducto));
  };

  const sinExistencias = useMemo(() => lineasSinExistencias(carrito), [carrito]);
  const total = useMemo(() => totalCarrito(carrito), [carrito]);

  const cobrar = async (e: FormEvent) => {
    e.preventDefault();
    if (carrito.length === 0) return;
    setError('');
    setOk('');
    setCobrando(true);
    try {
      const venta = await registrarVenta({
        idPaciente: idPaciente ? Number(idPaciente) : undefined,
        detalles: carrito.map((l) => ({
          idProducto: l.idProducto,
          cantidad: l.cantidad,
        })),
      });
      // El total que se confirma es **el del servidor**, no el del carrito: es
      // el que se cobró de verdad, con los precios de la base.
      setOk(
        `Venta #${venta.idVenta} registrada por ${colones(venta.total)}. Stock descontado.`,
      );
      setCarrito([]);
      setIdPaciente('');
      setResultados([]);
      setBusqueda('');
      await cargarVentas();
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo registrar la venta'));
    } finally {
      setCobrando(false);
    }
  };

  const revertir = async (e: FormEvent) => {
    e.preventDefault();
    if (!seleccionada || motivoAnulacion.trim().length < 3) return;
    setError('');
    setOk('');
    setAnulando(true);
    try {
      const anulada = await anularVenta(seleccionada.idVenta, {
        motivo: motivoAnulacion.trim(),
      });
      setOk(`Venta #${anulada.idVenta} anulada. El stock volvió al inventario.`);
      setMotivoAnulacion('');
      setSeleccionada(anulada);
      await cargarVentas();
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo anular la venta'));
    } finally {
      setAnulando(false);
    }
  };

  return (
    <div className="space-y-8">
      <SectionHeader
        kicker="CU-04 · Ventas y salida de productos"
        title="Caja de salidas"
        description="Cobro de mostrador con descuento automático de inventario, vinculación al paciente y reverso de venta."
      />

      {error ? <Alert>{error}</Alert> : null}
      {ok ? (
        <p
          role="status"
          className="border border-emerald-300/40 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-950/30 dark:text-emerald-300"
        >
          {ok}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <div className="space-y-6">
          <LuxCard className="p-5">
            <form onSubmit={buscarProductos} className="flex flex-wrap items-end gap-3">
              <div className="min-w-[220px] flex-1">
                <label className={fieldLabelClass} htmlFor="buscaProducto">
                  Buscar en bodega
                </label>
                <input
                  id="buscaProducto"
                  className={fieldInputClass}
                  placeholder="SKU, nombre o marca"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
              <LuxButton type="submit" variant="ghost" disabled={buscando}>
                <Search size={14} />
                Buscar
              </LuxButton>
            </form>

            {resultados.length > 0 ? (
              <ul className="mt-4 divide-y divide-neutral-100 dark:divide-white/5">
                {resultados.map((p) => (
                  <li key={p.idProducto} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">{p.nombre}</p>
                      <p className="font-mono text-[10px] text-neutral-400">
                        {p.sku} · {colones(p.precio)} ·{' '}
                        <span className={p.stock === 0 ? 'text-red-500' : undefined}>
                          {p.stock} en bodega
                        </span>
                      </p>
                    </div>
                    <LuxButton
                      type="button"
                      variant="ghost"
                      className="shrink-0"
                      disabled={p.stock === 0}
                      onClick={() => agregar(p)}
                    >
                      <Plus size={13} />
                      {p.stock === 0 ? 'Sin stock' : 'Agregar'}
                    </LuxButton>
                  </li>
                ))}
              </ul>
            ) : null}
          </LuxCard>

          <LuxCard className="p-5">
            <p className={cx(fieldLabelClass, 'mb-3 flex items-center gap-1.5')}>
              <ShoppingCart size={12} />
              Carrito
            </p>

            {carrito.length === 0 ? (
              <p className="py-6 text-center text-xs text-neutral-400">
                Busque un producto y agréguelo para iniciar la venta.
              </p>
            ) : (
              <form onSubmit={cobrar}>
                <ul className="mb-4 divide-y divide-neutral-100 dark:divide-white/5">
                  {carrito.map((l) => (
                    <li key={l.idProducto} className="flex items-center gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">{l.nombre}</p>
                        <p className="font-mono text-[10px] text-neutral-400">
                          {l.sku} · {colones(l.precio)} c/u
                        </p>
                        {l.cantidad > l.stockDisponible ? (
                          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400">
                            <AlertTriangle size={10} />
                            Solo hay {l.stockDisponible} en bodega
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          type="button"
                          aria-label={`Quitar una unidad de ${l.nombre}`}
                          onClick={() => cambiarCantidad(l.idProducto, -1)}
                          className="border border-neutral-250 p-1 text-neutral-500 hover:border-lux-tinta dark:border-white/10"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="w-7 text-center text-xs tabular-nums font-semibold">
                          {l.cantidad}
                        </span>
                        <button
                          type="button"
                          aria-label={`Agregar una unidad de ${l.nombre}`}
                          onClick={() => cambiarCantidad(l.idProducto, 1)}
                          className="border border-neutral-250 p-1 text-neutral-500 hover:border-lux-tinta dark:border-white/10"
                        >
                          <Plus size={11} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Quitar ${l.nombre} del carrito`}
                          onClick={() => quitar(l.idProducto)}
                          className="ml-1 text-neutral-400 hover:text-red-600"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <span className="w-24 shrink-0 text-right text-xs tabular-nums font-semibold">
                        {colones(l.cantidad * l.precio)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mb-4">
                  <label className={fieldLabelClass} htmlFor="paciente">
                    Paciente (opcional)
                  </label>
                  <select
                    id="paciente"
                    className={fieldInputClass}
                    value={idPaciente}
                    onChange={(e) => setIdPaciente(e.target.value)}
                  >
                    <option value="">Venta de mostrador</option>
                    {pacientes.map((p) => (
                      <option key={p.idPersona} value={p.idPersona}>
                        {p.nombre} · {p.cedula}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between border-t border-neutral-150 py-3 dark:border-white/10">
                  <span className={fieldLabelClass}>Total</span>
                  <span className="text-2xl font-semibold tabular-nums">{colones(total)}</span>
                </div>
                <p className="mb-3 text-[10px] text-neutral-400">
                  Importe de referencia: el que se cobra lo calcula el servidor con los
                  precios de la base.
                </p>

                {sinExistencias.length > 0 ? (
                  <p className="mb-3 flex items-start gap-2 border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
                    <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                    <span>
                      {sinExistencias.length} línea(s) piden más de lo que hay en bodega. La
                      venta será rechazada.
                    </span>
                  </p>
                ) : null}

                <LuxButton
                  type="submit"
                  className="w-full"
                  disabled={cobrando || sinExistencias.length > 0}
                >
                  <Receipt size={14} />
                  {cobrando ? 'Registrando…' : 'Confirmar venta y entrega'}
                </LuxButton>
              </form>
            )}
          </LuxCard>
        </div>

        <div className="space-y-6">
          <LuxCard className="overflow-x-auto">
            <table className="w-full min-w-[320px] text-left text-xs">
              <thead className="border-b border-neutral-200 text-[10px] uppercase tracking-wider text-neutral-500 dark:border-white/10">
                <tr>
                  <th className="px-4 py-3">Venta</th>
                  <th className="px-4 py-3">Paciente</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {ventas.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-neutral-500">
                      Todavía no hay ventas registradas.
                    </td>
                  </tr>
                ) : (
                  ventas.map((v) => (
                    <tr
                      key={v.idVenta}
                      onClick={() => {
                        setSeleccionada(v);
                        setMotivoAnulacion('');
                        setError('');
                      }}
                      className={cx(
                        'cursor-pointer border-b border-neutral-100 transition-colors hover:bg-stone-50 dark:border-white/5 dark:hover:bg-white/5',
                        seleccionada?.idVenta === v.idVenta && 'bg-stone-50 dark:bg-white/5',
                      )}
                    >
                      <td className="px-4 py-3 font-semibold">#{v.idVenta}</td>
                      <td className="px-4 py-3 text-neutral-500">
                        {v.nombrePaciente ?? 'Mostrador'}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{colones(v.total)}</td>
                      <td className="px-4 py-3">
                        <Badge tone={v.estado === EstadoVenta.ACTIVA ? 'green' : 'red'}>
                          {etiquetaEstadoVenta(v.estado)}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </LuxCard>

          <AnimatePresence>
            {seleccionada ? (
              <motion.div {...fadeUp} key={seleccionada.idVenta}>
                <LuxCard className="p-6">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-lux-tinta">
                        Venta #{seleccionada.idVenta}
                      </p>
                      <p className="mt-1 text-[11px] text-neutral-400">
                        {fechaHoraLarga(seleccionada.fecha)} ·{' '}
                        {seleccionada.nombrePaciente ?? 'Venta de mostrador'}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="Cerrar detalle"
                      onClick={() => setSeleccionada(null)}
                      className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <ul className="mb-3 divide-y divide-neutral-100 text-xs dark:divide-white/5">
                    {seleccionada.detalles.map((d) => (
                      <li key={d.idDetalleVenta} className="flex items-center gap-3 py-2">
                        <span className="min-w-0 flex-1 truncate">
                          {d.cantidad} × {d.nombre}
                          <span className="ml-1 font-mono text-[10px] text-neutral-400">
                            {d.sku}
                          </span>
                        </span>
                        <span className="tabular-nums text-neutral-500">
                          {colones(d.precioUnitario)}
                        </span>
                        <span className="w-24 text-right tabular-nums font-semibold">
                          {colones(d.subtotal)}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mb-5 flex items-center justify-between border-t border-neutral-150 pt-3 dark:border-white/10">
                    <span className={fieldLabelClass}>Total cobrado</span>
                    <span className="text-xl font-semibold tabular-nums">
                      {colones(seleccionada.total)}
                    </span>
                  </div>

                  {seleccionada.estado === EstadoVenta.ANULADA ? (
                    <p className="border border-neutral-200 bg-stone-50 px-3 py-2.5 text-[11px] text-neutral-600 dark:border-white/10 dark:bg-white/5 dark:text-neutral-400">
                      Esta venta está anulada. Sus líneas se conservan porque son lo que
                      permite auditar qué se revirtió.
                    </p>
                  ) : (
                    <form onSubmit={revertir}>
                      <label className={fieldLabelClass} htmlFor="motivoAnulacion">
                        Motivo de la anulación *
                      </label>
                      <input
                        id="motivoAnulacion"
                        className={fieldInputClass}
                        minLength={3}
                        maxLength={200}
                        value={motivoAnulacion}
                        onChange={(e) => setMotivoAnulacion(e.target.value)}
                      />
                      <p className="mt-1 text-[10px] text-neutral-400">
                        Queda en el log de auditoría. Revertir devuelve las unidades al
                        inventario.
                      </p>
                      <LuxButton
                        type="submit"
                        variant="danger"
                        className="mt-3 w-full"
                        disabled={anulando || motivoAnulacion.trim().length < 3}
                      >
                        <RotateCcw size={13} />
                        {anulando ? 'Revirtiendo…' : 'Revertir venta'}
                      </LuxButton>
                    </form>
                  )}
                </LuxCard>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
