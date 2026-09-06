import { useIdioma } from '../../core/i18n/idioma.context';
import type { ClaveTexto } from '../../core/i18n/catalogos/es';
import { useEffect, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ClipboardList,
  Package,
  PackagePlus,
  Pencil,
  Plus,
  Scale,
  Search,
  X,
} from 'lucide-react';
import {
  actualizarProducto,
  ajustarStock,
  crearProducto,
  listarProductos,
  movimientosDeProducto,
  registrarEntrada,
  type FiltrosProducto,
} from '../../core/api/inventario.service';
import {
  CATEGORIAS,
  CLAVE_CATEGORIA,
  CategoriaProducto,
  cantidadFirmada,
  colones,
  etiquetaMovimiento,
  fechaHoraLarga,
  normalizarSku,
  TipoMovimiento,
  type MovimientoInventario,
  type Producto,
  type ProductoInput,
} from '../../core/models/inventario';
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

const ALTA_VACIA: ProductoInput = {
  sku: '',
  nombre: '',
  marca: '',
  categoria: CategoriaProducto.ARO,
  precio: 0,
  stock: 0,
  umbralMinimo: 0,
  esPublico: false,
  imagenUrl: '',
};

const TONO_MOVIMIENTO: Record<TipoMovimiento, 'green' | 'red' | 'blue'> = {
  [TipoMovimiento.ENTRADA]: 'green',
  [TipoMovimiento.SALIDA]: 'red',
  [TipoMovimiento.AJUSTE]: 'blue',
};

/** Las dos operaciones que mueven existencias, cada una con su formulario. */
type Operacion = 'entrada' | 'ajuste';

/**
 * Bodega e inventario (CU-03, `DSO-26`).
 *
 * Se monta en `/admin/inventario` y en `/recepcion/existencias`: es la misma
 * pantalla, igual que la agenda y el tablero de laboratorio. CU-03 solo exige
 * «usuario autenticado en el entorno privado», y el mostrador consulta
 * existencias tanto como la administración.
 */
export const InventarioPage = () => {
  const { t } = useIdioma();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState<CategoriaProducto | ''>('');
  const [soloAlerta, setSoloAlerta] = useState(false);

  const [seleccionado, setSeleccionado] = useState<Producto | null>(null);
  const [kardex, setKardex] = useState<MovimientoInventario[]>([]);
  const [operacion, setOperacion] = useState<Operacion>('entrada');
  const [cantidad, setCantidad] = useState('');
  const [referencia, setReferencia] = useState('');
  const [stockFinal, setStockFinal] = useState('');
  const [motivo, setMotivo] = useState('');

  const [editando, setEditando] = useState(false);
  const [edicion, setEdicion] = useState<ProductoInput | null>(null);
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const [alta, setAlta] = useState<ProductoInput>(ALTA_VACIA);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cargar = async () => {
    const filtros: FiltrosProducto = {};
    if (busqueda.trim()) filtros.q = busqueda.trim();
    if (categoria) filtros.categoria = categoria;
    if (soloAlerta) filtros.bajoStock = true;

    setCargando(true);
    try {
      setProductos(await listarProductos(filtros));
    } catch (e) {
      setError(mensajeDeError(e, t('inv.errorCargar')));
    } finally {
      setCargando(false);
    }
  };

  // El filtrado lo resuelve la API, no la pantalla: `bajoStock` compara dos
  // columnas de la misma fila y la regla del umbral debe vivir en un solo sitio.
  useEffect(() => {
    void cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoria, soloAlerta]);

  const abrir = async (producto: Producto) => {
    setSeleccionado(producto);
    setEditando(false);
    setEdicion(null);
    setOperacion('entrada');
    setCantidad('');
    setReferencia('');
    setStockFinal(String(producto.stock));
    setMotivo('');
    setError('');
    setOk('');
    try {
      setKardex(await movimientosDeProducto(producto.idProducto));
    } catch (e) {
      setError(mensajeDeError(e, t('inv.errorKardex')));
    }
  };

  const buscar = async (e: FormEvent) => {
    e.preventDefault();
    await cargar();
  };

  const moverStock = async (e: FormEvent) => {
    e.preventDefault();
    if (!seleccionado) return;
    setError('');
    setOk('');
    setGuardando(true);
    try {
      const asiento =
        operacion === 'entrada'
          ? await registrarEntrada(seleccionado.idProducto, {
              cantidad: Number(cantidad),
              referencia: referencia.trim() || undefined,
            })
          : await ajustarStock(seleccionado.idProducto, {
              stockFinal: Number(stockFinal),
              motivo: motivo.trim(),
            });

      setOk(
        `${etiquetaMovimiento(asiento.tipo)} registrada: ${asiento.stockAntes} → ${asiento.stockDespues} unidades.`,
      );
      setCantidad('');
      setReferencia('');
      setMotivo('');
      await cargar();
      // Se relee el producto para que el detalle muestre el stock ya movido.
      const frescos = await listarProductos({ q: seleccionado.sku });
      const actualizado =
        frescos.find((p) => p.idProducto === seleccionado.idProducto) ?? seleccionado;
      setSeleccionado(actualizado);
      setStockFinal(String(actualizado.stock));
      setKardex(await movimientosDeProducto(seleccionado.idProducto));
    } catch (err) {
      setError(mensajeDeError(err, t('inv.errorMovimiento')));
    } finally {
      setGuardando(false);
    }
  };

  /**
   * CU-03, flujo alterno «Actualizar producto»: corrige los datos maestros.
   *
   * ⚠️ **`stock` no está aquí y no es un olvido**: el backend lo rechaza con un
   * 400 y `actualizarProducto()` lo excluye en su propio tipo. Las existencias
   * se mueven por entrada o por ajuste, que son las que dejan kardex.
   */
  const guardarDatosMaestros = async (e: FormEvent) => {
    e.preventDefault();
    if (!seleccionado || !edicion) return;
    setError('');
    setOk('');
    setGuardando(true);
    try {
      const actualizado = await actualizarProducto(seleccionado.idProducto, {
        sku: normalizarSku(edicion.sku),
        nombre: edicion.nombre.trim(),
        marca: edicion.marca.trim(),
        categoria: edicion.categoria,
        precio: Number(edicion.precio),
        umbralMinimo: Number(edicion.umbralMinimo ?? 0),
        // Vaciar el campo significa «borra la imagen», no «déjala como está»:
        // se manda cadena vacía, que el DTO convierte a null.
        imagenUrl: edicion.imagenUrl?.trim() ?? '',
      });
      setSeleccionado(actualizado);
      setEditando(false);
      setEdicion(null);
      setOk(`${actualizado.sku} actualizado.`);
      await cargar();
    } catch (err) {
      setError(mensajeDeError(err, t('inv.errorActualizar')));
    } finally {
      setGuardando(false);
    }
  };

  const empezarEdicion = () => {
    if (!seleccionado) return;
    setError('');
    setOk('');
    setEdicion({
      sku: seleccionado.sku,
      nombre: seleccionado.nombre,
      marca: seleccionado.marca,
      categoria: seleccionado.categoria,
      precio: seleccionado.precio,
      umbralMinimo: seleccionado.umbralMinimo,
      imagenUrl: seleccionado.imagenUrl ?? '',
    });
    setEditando(true);
  };

  /**
   * CU-09 paso 2. Se guarda en el acto, sin botón de confirmar: es un
   * interruptor de una sola cosa y pedir «guardar» aparte solo añade un paso
   * en el que olvidarse.
   */
  const cambiarVisibilidad = async (esPublico: boolean) => {
    if (!seleccionado) return;
    setError('');
    setOk('');
    setGuardando(true);
    try {
      const actualizado = await actualizarProducto(seleccionado.idProducto, {
        esPublico,
      });
      setSeleccionado(actualizado);
      setOk(
        esPublico
          ? `${actualizado.sku} ya se muestra en el catálogo público.`
          : `${actualizado.sku} se retiró del catálogo público.`,
      );
      await cargar();
    } catch (err) {
      setError(mensajeDeError(err, t('inv.errorVisibilidad')));
    } finally {
      setGuardando(false);
    }
  };

  const registrarProducto = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setOk('');
    setGuardando(true);
    try {
      const creado = await crearProducto({
        ...alta,
        // Una cadena vacía no es una URL: se manda ausente, no vacía.
        imagenUrl: alta.imagenUrl?.trim() || undefined,
        sku: normalizarSku(alta.sku),
        nombre: alta.nombre.trim(),
        marca: alta.marca.trim(),
        precio: Number(alta.precio),
        stock: Number(alta.stock ?? 0),
        umbralMinimo: Number(alta.umbralMinimo ?? 0),
      });
      setOk(`Producto ${creado.sku} dado de alta con ${creado.stock} unidad(es).`);
      setAlta(ALTA_VACIA);
      setMostrarAlta(false);
      await cargar();
    } catch (err) {
      setError(mensajeDeError(err, t('inv.errorAlta')));
    } finally {
      setGuardando(false);
    }
  };

  const enAlerta = productos.filter((p) => p.bajoStock).length;

  return (
    <div className="space-y-8">
      <SectionHeader
        kicker={t('inv.kicker')}
        title={t('inv.titulo')}
        description={t('inv.descripcion')}
        actions={
          <LuxButton onClick={() => setMostrarAlta((v) => !v)}>
            <Plus size={14} />{t('inv.nuevoProducto')}</LuxButton>
        }
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

      <AnimatePresence>
        {mostrarAlta ? (
          <motion.div {...fadeUp} key="alta">
            <LuxCard className="p-6">
              <form onSubmit={registrarProducto} className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className={fieldLabelClass} htmlFor="sku">{t('inv.sku')}</label>
                  <input
                    id="sku"
                    required
                    maxLength={50}
                    className={fieldInputClass}
                    value={alta.sku}
                    onChange={(e) => setAlta({ ...alta, sku: e.target.value })}
                    onBlur={(e) => setAlta({ ...alta, sku: normalizarSku(e.target.value) })}
                  />
                  <p className="mt-1 text-[10px] text-neutral-400">{t('inv.skuNota')}</p>
                </div>
                <div>
                  <label className={fieldLabelClass} htmlFor="nombre">{t('inv.nombre')}</label>
                  <input
                    id="nombre"
                    required
                    maxLength={150}
                    className={fieldInputClass}
                    value={alta.nombre}
                    onChange={(e) => setAlta({ ...alta, nombre: e.target.value })}
                  />
                </div>
                <div>
                  <label className={fieldLabelClass} htmlFor="marca">{t('inv.marca')}</label>
                  <input
                    id="marca"
                    required
                    maxLength={100}
                    className={fieldInputClass}
                    value={alta.marca}
                    onChange={(e) => setAlta({ ...alta, marca: e.target.value })}
                  />
                </div>
                <div>
                  <label className={fieldLabelClass} htmlFor="categoria">{t('inv.categoriaObl')}</label>
                  <select
                    id="categoria"
                    className={fieldInputClass}
                    value={alta.categoria}
                    onChange={(e) =>
                      setAlta({ ...alta, categoria: e.target.value as CategoriaProducto })
                    }
                  >
                    {CATEGORIAS.map((c) => (
                      <option key={c} value={c}>
                        {t(CLAVE_CATEGORIA[c] as ClaveTexto)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={fieldLabelClass} htmlFor="precio">{t('inv.precioObl')}</label>
                  <input
                    id="precio"
                    type="number"
                    min={0}
                    step="0.01"
                    required
                    className={fieldInputClass}
                    value={alta.precio || ''}
                    onChange={(e) => setAlta({ ...alta, precio: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className={fieldLabelClass} htmlFor="umbralMinimo">{t('inv.umbralMinimo')}</label>
                  <input
                    id="umbralMinimo"
                    type="number"
                    min={0}
                    className={fieldInputClass}
                    value={alta.umbralMinimo ?? 0}
                    onChange={(e) =>
                      setAlta({ ...alta, umbralMinimo: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <label className={fieldLabelClass} htmlFor="stockInicial">{t('inv.existenciaInicial')}</label>
                  <input
                    id="stockInicial"
                    type="number"
                    min={0}
                    className={fieldInputClass}
                    value={alta.stock ?? 0}
                    onChange={(e) => setAlta({ ...alta, stock: Number(e.target.value) })}
                  />
                  <p className="mt-1 text-[10px] text-neutral-400">{t('inv.existenciaNota')}</p>
                </div>
                <div className="md:col-span-2">
                  <label className={fieldLabelClass} htmlFor="imagenUrl">{t('inv.imagenUrl')}</label>
                  <input
                    id="imagenUrl"
                    maxLength={500}
                    placeholder="https://…"
                    className={fieldInputClass}
                    value={alta.imagenUrl ?? ''}
                    onChange={(e) => setAlta({ ...alta, imagenUrl: e.target.value })}
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-2 pb-3 text-xs text-neutral-600 dark:text-neutral-300 md:col-span-1">
                  <input
                    type="checkbox"
                    checked={alta.esPublico ?? false}
                    onChange={(e) => setAlta({ ...alta, esPublico: e.target.checked })}
                  />{t('inv.visiblePublico')}</label>
                <div className="flex items-end justify-end gap-3 md:col-span-2">
                  <LuxButton type="button" variant="ghost" onClick={() => setMostrarAlta(false)}>{t('comun.cancelar')}</LuxButton>
                  <LuxButton type="submit" disabled={guardando}>
                    {guardando ? t('comun.guardando') : t('inv.darAlta')}
                  </LuxButton>
                </div>
              </form>
            </LuxCard>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <LuxCard className="p-5">
        <form onSubmit={buscar} className="flex flex-wrap items-end gap-4">
          <div className="min-w-[220px] flex-1">
            <label className={fieldLabelClass} htmlFor="busqueda">{t('comun.buscar')}</label>
            <input
              id="busqueda"
              className={fieldInputClass}
              placeholder={t('inv.buscarEjemplo')}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div>
            <label className={fieldLabelClass} htmlFor="filtroCategoria">{t('inv.categoria')}</label>
            <select
              id="filtroCategoria"
              className={fieldInputClass}
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoriaProducto | '')}
            >
              <option value="">{t('auditoria.todas')}</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {t(CLAVE_CATEGORIA[c] as ClaveTexto)}
                </option>
              ))}
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-2 pb-3 text-xs text-neutral-600 dark:text-neutral-300">
            <input
              type="checkbox"
              checked={soloAlerta}
              onChange={(e) => setSoloAlerta(e.target.checked)}
            />{t('inv.soloBajoStock')}</label>
          <LuxButton type="submit" variant="ghost" disabled={cargando}>
            <Search size={14} />{t('comun.buscar')}</LuxButton>
        </form>
      </LuxCard>

      {enAlerta > 0 && !soloAlerta ? (
        <p className="flex items-center gap-2 text-xs text-amber-700 dark:text-amber-400">
          <AlertTriangle size={13} />
          {enAlerta} producto(s) en o por debajo de su umbral mínimo.
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <LuxCard className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead className="border-b border-neutral-200 text-[10px] uppercase tracking-wider text-neutral-500 dark:border-white/10">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">{t('inv.producto')}</th>
                <th className="px-4 py-3">{t('inv.categoria')}</th>
                <th className="px-4 py-3 text-right">{t('inv.precio')}</th>
                <th className="px-4 py-3 text-right">{t('inv.stock')}</th>
              </tr>
            </thead>
            <tbody>
              {productos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-neutral-500">
                    {cargando ? t('inv.cargando') : t('inv.vacio')}
                  </td>
                </tr>
              ) : (
                productos.map((p) => (
                  <tr
                    key={p.idProducto}
                    onClick={() => void abrir(p)}
                    className={cx(
                      'cursor-pointer border-b border-neutral-100 transition-colors hover:bg-stone-50 dark:border-white/5 dark:hover:bg-white/5',
                      seleccionado?.idProducto === p.idProducto && 'bg-stone-50 dark:bg-white/5',
                    )}
                  >
                    <td className="px-4 py-3 font-mono text-[11px]">{p.sku}</td>
                    <td className="px-4 py-3">
                      <span className="font-semibold">{p.nombre}</span>
                      <span className="block text-[10px] text-neutral-400">{p.marca}</span>
                    </td>
                    <td className="px-4 py-3 text-neutral-500">
                      {t(CLAVE_CATEGORIA[p.categoria] as ClaveTexto)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{colones(p.precio)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="tabular-nums font-semibold">{p.stock}</span>
                      {p.bajoStock ? (
                        <span className="ml-2">
                          <Badge tone="red">{t('inv.bajo')}</Badge>
                        </span>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </LuxCard>

        <LuxCard className="p-6">
          {!seleccionado ? (
            <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center text-neutral-400">
              <Package size={28} className="mb-3" />
              <p className="text-xs">{t('inv.seleccioneProducto')}</p>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-lux-tinta">
                    {seleccionado.sku}
                  </p>
                  <h2 className="mt-1 font-serif text-2xl italic text-lux-blue dark:text-white">
                    {seleccionado.nombre}
                  </h2>
                  <p className="text-[11px] text-neutral-400">
                    {seleccionado.marca} · {seleccionado.categoria} ·{' '}
                    {colones(seleccionado.precio)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    aria-label={t('inv.editarProducto')}
                    onClick={empezarEdicion}
                    className="text-neutral-400 hover:text-lux-tinta"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    aria-label={t('comun.cerrarDetalle')}
                    onClick={() => {
                      setSeleccionado(null);
                      setKardex([]);
                      setEditando(false);
                    }}
                    className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {editando && edicion ? (
                <form
                  onSubmit={guardarDatosMaestros}
                  className="mb-5 grid gap-3 border-y border-neutral-150 py-4 sm:grid-cols-2 dark:border-white/10"
                >
                  <div>
                    <label className={fieldLabelClass} htmlFor="editSku">{t('inv.sku')}</label>
                    <input
                      id="editSku"
                      required
                      maxLength={50}
                      className={fieldInputClass}
                      value={edicion.sku}
                      onChange={(e) => setEdicion({ ...edicion, sku: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={fieldLabelClass} htmlFor="editNombre">{t('inv.nombre')}</label>
                    <input
                      id="editNombre"
                      required
                      maxLength={150}
                      className={fieldInputClass}
                      value={edicion.nombre}
                      onChange={(e) => setEdicion({ ...edicion, nombre: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={fieldLabelClass} htmlFor="editMarca">{t('inv.marca')}</label>
                    <input
                      id="editMarca"
                      required
                      maxLength={100}
                      className={fieldInputClass}
                      value={edicion.marca}
                      onChange={(e) => setEdicion({ ...edicion, marca: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={fieldLabelClass} htmlFor="editCategoria">{t('inv.categoriaObl')}</label>
                    <select
                      id="editCategoria"
                      className={fieldInputClass}
                      value={edicion.categoria}
                      onChange={(e) =>
                        setEdicion({
                          ...edicion,
                          categoria: e.target.value as CategoriaProducto,
                        })
                      }
                    >
                      {CATEGORIAS.map((c) => (
                        <option key={c} value={c}>
                          {t(CLAVE_CATEGORIA[c] as ClaveTexto)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={fieldLabelClass} htmlFor="editPrecio">{t('inv.precioObl')}</label>
                    <input
                      id="editPrecio"
                      type="number"
                      min={0}
                      step="0.01"
                      required
                      className={fieldInputClass}
                      value={edicion.precio}
                      onChange={(e) =>
                        setEdicion({ ...edicion, precio: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div>
                    <label className={fieldLabelClass} htmlFor="editUmbral">{t('inv.umbralMinimo')}</label>
                    <input
                      id="editUmbral"
                      type="number"
                      min={0}
                      className={fieldInputClass}
                      value={edicion.umbralMinimo ?? 0}
                      onChange={(e) =>
                        setEdicion({ ...edicion, umbralMinimo: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={fieldLabelClass} htmlFor="editImagen">{t('inv.imagenUrl')}</label>
                    <input
                      id="editImagen"
                      maxLength={500}
                      placeholder="https://…"
                      className={fieldInputClass}
                      value={edicion.imagenUrl ?? ''}
                      onChange={(e) =>
                        setEdicion({ ...edicion, imagenUrl: e.target.value })
                      }
                    />
                    <p className="mt-1 text-[10px] text-neutral-400">{t('inv.imagenNota')}</p>
                  </div>
                  <p className="text-[10px] text-neutral-400 sm:col-span-2">
                    Las existencias no se editan aquí: use «Entrada» o «Ajuste», que
                    dejan asiento en el kardex.
                  </p>
                  <div className="flex justify-end gap-3 sm:col-span-2">
                    <LuxButton
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setEditando(false);
                        setEdicion(null);
                      }}
                    >{t('comun.cancelar')}</LuxButton>
                    <LuxButton type="submit" disabled={guardando}>
                      {guardando ? t('comun.guardando') : t('comun.guardarCambios')}
                    </LuxButton>
                  </div>
                </form>
              ) : null}

              <div className="mb-5 flex items-center gap-4 border-y border-neutral-150 py-3 dark:border-white/10">
                <div>
                  <p className={fieldLabelClass}>{t('inv.existencias')}</p>
                  <p className="text-2xl font-semibold tabular-nums">{seleccionado.stock}</p>
                </div>
                <div>
                  <p className={fieldLabelClass}>{t('inv.umbral')}</p>
                  <p className="text-2xl font-light tabular-nums text-neutral-400">
                    {seleccionado.umbralMinimo}
                  </p>
                </div>
                {seleccionado.bajoStock ? (
                  <Badge tone="red">
                    <AlertTriangle size={10} />{t('inv.bajoStock')}</Badge>
                ) : (
                  <Badge tone="green">{t('inv.suficiente')}</Badge>
                )}
              </div>

              <label className="mb-4 flex cursor-pointer items-center gap-2 border border-neutral-150 px-3 py-2.5 text-xs text-neutral-600 dark:border-white/10 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={seleccionado.esPublico}
                  disabled={guardando}
                  onChange={(e) => void cambiarVisibilidad(e.target.checked)}
                />{t('inv.visiblePublicoCu')}</label>

              <div className="mb-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setOperacion('entrada')}
                  className={cx(
                    'flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors',
                    operacion === 'entrada'
                      ? 'bg-lux-blue text-white dark:bg-lux-tinta-claro dark:text-black'
                      : 'border border-neutral-250 text-neutral-500 dark:border-white/10',
                  )}
                >
                  <PackagePlus size={12} className="mr-1 inline" />{t('inv.entrada')}</button>
                <button
                  type="button"
                  onClick={() => setOperacion('ajuste')}
                  className={cx(
                    'flex-1 px-3 py-2 text-[10px] font-bold uppercase tracking-wider transition-colors',
                    operacion === 'ajuste'
                      ? 'bg-lux-blue text-white dark:bg-lux-tinta-claro dark:text-black'
                      : 'border border-neutral-250 text-neutral-500 dark:border-white/10',
                  )}
                >
                  <Scale size={12} className="mr-1 inline" />{t('inv.ajuste')}</button>
              </div>

              <form onSubmit={moverStock} className="mb-6 space-y-3">
                {operacion === 'entrada' ? (
                  <>
                    <div>
                      <label className={fieldLabelClass} htmlFor="cantidad">{t('inv.cantidadEntrante')}</label>
                      <input
                        id="cantidad"
                        type="number"
                        min={1}
                        required
                        className={fieldInputClass}
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={fieldLabelClass} htmlFor="referencia">{t('inv.referencia')}</label>
                      <input
                        id="referencia"
                        maxLength={100}
                        placeholder={t('inv.referenciaEjemplo')}
                        className={fieldInputClass}
                        value={referencia}
                        onChange={(e) => setReferencia(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className={fieldLabelClass} htmlFor="stockFinal">{t('inv.conteoFisico')}</label>
                      <input
                        id="stockFinal"
                        type="number"
                        min={0}
                        required
                        className={fieldInputClass}
                        value={stockFinal}
                        onChange={(e) => setStockFinal(e.target.value)}
                      />
                      <p className="mt-1 text-[10px] text-neutral-400">{t('inv.conteoNota')}</p>
                    </div>
                    <div>
                      <label className={fieldLabelClass} htmlFor="motivo">{t('inv.motivo')}</label>
                      <input
                        id="motivo"
                        required
                        minLength={3}
                        maxLength={100}
                        className={fieldInputClass}
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                      />
                    </div>
                  </>
                )}
                <LuxButton type="submit" className="w-full" disabled={guardando}>
                  {guardando ? t('inv.registrando') : t('inv.registrarMovimiento')}
                </LuxButton>
              </form>

              <div>
                <p className={cx(fieldLabelClass, 'mb-2 flex items-center gap-1.5')}>
                  <ClipboardList size={11} />{t('inv.kardex')}</p>
                {kardex.length === 0 ? (
                  <p className="text-[11px] text-neutral-400">{t('inv.sinMovimientos')}</p>
                ) : (
                  <ul className="space-y-2">
                    {kardex.map((m) => (
                      <li
                        key={m.idMovimientoInventario}
                        className="flex items-start justify-between gap-3 border-l-2 border-neutral-200 pl-3 dark:border-white/10"
                      >
                        <div>
                          <p className="flex items-center gap-2 text-[11px]">
                            <Badge tone={TONO_MOVIMIENTO[m.tipo]}>
                              {etiquetaMovimiento(m.tipo)}
                            </Badge>
                            <span className="tabular-nums font-semibold">
                              {cantidadFirmada(m.cantidad)}
                            </span>
                            <span className="text-neutral-400">
                              {m.stockAntes} → {m.stockDespues}
                            </span>
                          </p>
                          {m.referencia ? (
                            <p className="mt-0.5 text-[10px] italic text-neutral-500">
                              {m.referencia}
                            </p>
                          ) : null}
                        </div>
                        <p className="shrink-0 text-[10px] text-neutral-400">
                          {fechaHoraLarga(m.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </LuxCard>
      </div>
    </div>
  );
};
