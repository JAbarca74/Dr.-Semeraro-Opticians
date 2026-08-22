import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import {
  ImageOff,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import {
  listarCatalogo,
  marcasDelCatalogo,
  parametrosPublicos,
  type FiltrosCatalogo,
} from '../../core/api/catalogo.service';
import {
  agregarAlApartado,
  construirMensajeApartado,
  enlaceWhatsapp,
  numeroLegible,
  totalApartado,
  type LineaApartado,
  type ProductoVitrina,
} from '../../core/models/catalogo';
import { CATEGORIAS, CategoriaProducto, colones } from '../../core/models/inventario';
import { mensajeDeError } from '../../shared/error';
import {
  Alert,
  Badge,
  LuxButton,
  LuxCard,
  SectionHeader,
  cx,
  fadeUpItem,
  fieldInputClass,
  fieldLabelClass,
  stagger,
} from '../../shared/ui';

/**
 * Catálogo de modelos (CU-09) con apartado por WhatsApp (`DSO-49`).
 *
 * **Vitrina, no tienda.** El caso de uso es explícito: «función informativa que
 * NO permite compras directas». Aquí no se cobra ni se reserva stock; el flujo
 * termina en un mensaje a Recepción, que es quien decide y registra la venta en
 * la caja (CU-04).
 *
 * ⚠️ Lo que se pinta viene de `GET /catalogo`, que **no devuelve existencias ni
 * costo**. Si en esta pantalla aparece alguna vez un dato de inventario, el
 * problema está en el backend, no aquí.
 */
export const CatalogoPage = () => {
  const [productos, setProductos] = useState<ProductoVitrina[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [numeroOptica, setNumeroOptica] = useState('');
  const [nombreOptica, setNombreOptica] = useState('la óptica');

  const [busqueda, setBusqueda] = useState('');
  const [marca, setMarca] = useState('');
  const [categoria, setCategoria] = useState<CategoriaProducto | ''>('');

  const [apartado, setApartado] = useState<LineaApartado[]>([]);
  const [detalle, setDetalle] = useState<ProductoVitrina | null>(null);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');

  const [error, setError] = useState('');
  const [avisoWhatsapp, setAvisoWhatsapp] = useState('');
  const [cargando, setCargando] = useState(true);

  const cargar = async (filtros: FiltrosCatalogo) => {
    setCargando(true);
    try {
      setProductos(await listarCatalogo(filtros));
      setError('');
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo cargar el catálogo'));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const filtros: FiltrosCatalogo = {};
    if (marca) filtros.marca = marca;
    if (categoria) filtros.categoria = categoria;
    if (busqueda.trim()) filtros.q = busqueda.trim();
    void cargar(filtros);
    // La búsqueda por texto se dispara al enviar el formulario, no al teclear.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marca, categoria]);

  useEffect(() => {
    marcasDelCatalogo()
      .then(setMarcas)
      .catch(() => {
        // Sin lista de marcas el filtro se queda vacío, pero la vitrina se ve.
      });
    parametrosPublicos()
      .then((p) => {
        setNumeroOptica(p['optica.whatsapp'] ?? '');
        setNombreOptica(p['optica.nombre'] ?? 'la óptica');
      })
      .catch(() => {
        // Sin número no se puede redirigir; el botón lo dirá en su momento.
      });
  }, []);

  const buscar = (e: FormEvent) => {
    e.preventDefault();
    const filtros: FiltrosCatalogo = {};
    if (busqueda.trim()) filtros.q = busqueda.trim();
    if (marca) filtros.marca = marca;
    if (categoria) filtros.categoria = categoria;
    void cargar(filtros);
  };

  const agregar = (producto: ProductoVitrina) => {
    setAvisoWhatsapp('');
    setApartado((lineas) =>
      agregarAlApartado(lineas, {
        idProducto: producto.idProducto,
        sku: producto.sku,
        nombre: producto.nombre,
        marca: producto.marca,
        precio: producto.precio,
        cantidad: 1,
      }),
    );
  };

  const cambiarCantidad = (idProducto: number, delta: number) => {
    setApartado((lineas) =>
      lineas
        .map((l) =>
          l.idProducto === idProducto ? { ...l, cantidad: l.cantidad + delta } : l,
        )
        .filter((l) => l.cantidad > 0),
    );
  };

  const total = useMemo(() => totalApartado(apartado), [apartado]);
  const datosCompletos = nombre.trim().length >= 3 && telefono.trim().length >= 8;

  /**
   * CU-09 paso 8 · CU-11 paso 5: abre WhatsApp con el mensaje ya redactado.
   *
   * **EX-13** — si el navegador bloquea la ventana emergente, `window.open`
   * devuelve `null`. En ese caso no se puede hacer nada por el usuario salvo
   * darle el número para que escriba a mano, que es justo lo que la excepción
   * pide.
   */
  const solicitar = (e: FormEvent) => {
    e.preventDefault();
    if (!datosCompletos || apartado.length === 0) return;
    setAvisoWhatsapp('');

    if (!numeroOptica) {
      setAvisoWhatsapp(
        'No hay un número de WhatsApp configurado. Por favor comuníquese con la óptica por teléfono.',
      );
      return;
    }

    const mensaje = construirMensajeApartado(
      apartado,
      { nombre, telefono },
      nombreOptica,
    );
    const ventana = window.open(enlaceWhatsapp(numeroOptica, mensaje), '_blank');
    if (!ventana) {
      setAvisoWhatsapp(
        `No se pudo abrir WhatsApp. Por favor contáctenos al ${numeroLegible(numeroOptica)}.`,
      );
    }
  };

  return (
    <div className="space-y-10">
      <SectionHeader
        kicker="Vitrina digital"
        title="Catálogo de modelos"
        description="Explore las monturas y lentes disponibles. Arme su apartado y envíelo por WhatsApp a nuestra recepción: le confirmamos disponibilidad y coordinamos la entrega."
      />

      {error ? <Alert>{error}</Alert> : null}

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <LuxCard className="p-5">
            <form onSubmit={buscar} className="flex flex-wrap items-end gap-3">
              <div className="min-w-[200px] flex-1">
                <label className={fieldLabelClass} htmlFor="buscaCatalogo">
                  Buscar modelo
                </label>
                <input
                  id="buscaCatalogo"
                  className={fieldInputClass}
                  placeholder="Nombre o marca"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </div>
              <div>
                <label className={fieldLabelClass} htmlFor="filtroMarca">
                  Marca
                </label>
                <select
                  id="filtroMarca"
                  className={fieldInputClass}
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                >
                  <option value="">Todas</option>
                  {marcas.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fieldLabelClass} htmlFor="filtroTipo">
                  Tipo
                </label>
                <select
                  id="filtroTipo"
                  className={fieldInputClass}
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value as CategoriaProducto | '')}
                >
                  <option value="">Todos</option>
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <LuxButton type="submit" variant="ghost">
                <Search size={14} />
                Buscar
              </LuxButton>
            </form>
          </LuxCard>

          {productos.length === 0 ? (
            <LuxCard className="p-12 text-center">
              <p className="text-sm text-neutral-500">
                {cargando ? 'Cargando catálogo…' : 'No hay productos que coincidan'}
              </p>
              {!cargando ? (
                <p className="mt-2 text-xs text-neutral-400">
                  Pruebe con otra marca o quite los filtros.
                </p>
              ) : null}
            </LuxCard>
          ) : (
            <motion.div
              {...stagger}
              className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
            >
              {productos.map((p) => (
                <motion.div key={p.idProducto} {...fadeUpItem}>
                  <LuxCard hover className="flex h-full flex-col overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setDetalle(p)}
                      aria-label={`Ver detalle de ${p.nombre}`}
                      className="block aspect-[4/3] w-full overflow-hidden bg-stone-100 dark:bg-neutral-900"
                    >
                      {p.imagenUrl ? (
                        <img
                          src={p.imagenUrl}
                          alt={`${p.nombre} de ${p.marca}`}
                          className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                        />
                      ) : (
                        <span className="flex h-full w-full flex-col items-center justify-center gap-2 text-neutral-300 dark:text-neutral-700">
                          <ImageOff size={26} />
                          <span className="text-[10px] uppercase tracking-wider">
                            Sin fotografía
                          </span>
                        </span>
                      )}
                    </button>

                    <div className="flex flex-1 flex-col p-5">
                      <Badge tone="tinta">{p.marca}</Badge>
                      <h3 className="mt-2 font-serif text-lg italic text-lux-blue dark:text-white">
                        {p.nombre}
                      </h3>
                      <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        {[p.categoria, p.color, p.material].filter(Boolean).join(' · ')}
                      </p>
                      <p className="mt-3 text-lg font-semibold tabular-nums">
                        {colones(p.precio)}
                      </p>
                      <LuxButton
                        type="button"
                        className="mt-4 w-full"
                        onClick={() => agregar(p)}
                      >
                        <Plus size={13} />
                        Agregar al apartado
                      </LuxButton>
                    </div>
                  </LuxCard>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <LuxCard className="p-5">
            <p className={cx(fieldLabelClass, 'mb-3 flex items-center gap-1.5')}>
              <ShoppingBag size={12} />
              Mi apartado
            </p>

            {apartado.length === 0 ? (
              <p className="py-4 text-xs text-neutral-400">
                Agregue los modelos que le interesen y los enviamos juntos por WhatsApp.
              </p>
            ) : (
              <form onSubmit={solicitar}>
                <ul className="mb-4 divide-y divide-neutral-100 dark:divide-white/5">
                  {apartado.map((l) => (
                    <li key={l.idProducto} className="py-2.5">
                      <p className="text-xs font-semibold">{l.nombre}</p>
                      <p className="text-[10px] text-neutral-400">
                        {l.marca} · {colones(l.precio)}
                      </p>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <button
                          type="button"
                          aria-label={`Quitar una unidad de ${l.nombre}`}
                          onClick={() => cambiarCantidad(l.idProducto, -1)}
                          className="border border-neutral-250 p-1 text-neutral-500 dark:border-white/10"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="w-6 text-center text-xs tabular-nums">
                          {l.cantidad}
                        </span>
                        <button
                          type="button"
                          aria-label={`Agregar una unidad de ${l.nombre}`}
                          onClick={() => cambiarCantidad(l.idProducto, 1)}
                          className="border border-neutral-250 p-1 text-neutral-500 dark:border-white/10"
                        >
                          <Plus size={10} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Quitar ${l.nombre} del apartado`}
                          onClick={() => cambiarCantidad(l.idProducto, -l.cantidad)}
                          className="ml-auto text-neutral-400 hover:text-red-600"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mb-4 flex items-center justify-between border-t border-neutral-150 pt-3 dark:border-white/10">
                  <span className={fieldLabelClass}>Referencia</span>
                  <span className="text-lg font-semibold tabular-nums">
                    {colones(total)}
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className={fieldLabelClass} htmlFor="nombreSolicitante">
                      Su nombre *
                    </label>
                    <input
                      id="nombreSolicitante"
                      className={fieldInputClass}
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={fieldLabelClass} htmlFor="telefonoSolicitante">
                      Su teléfono *
                    </label>
                    <input
                      id="telefonoSolicitante"
                      className={fieldInputClass}
                      placeholder="8888-8888"
                      value={telefono}
                      onChange={(e) => setTelefono(e.target.value)}
                    />
                  </div>
                </div>

                <LuxButton
                  type="submit"
                  variant="tinta"
                  className="mt-4 w-full"
                  disabled={!datosCompletos}
                >
                  Solicitar por WhatsApp
                </LuxButton>

                <p className="mt-2 text-[10px] leading-relaxed text-neutral-400">
                  No es una compra: se abre WhatsApp con su solicitud lista para enviar a
                  nuestra recepción, que le confirma disponibilidad.
                </p>

                {avisoWhatsapp ? (
                  <p role="alert" className="mt-3 border border-amber-300/40 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-300">
                    {avisoWhatsapp}
                  </p>
                ) : null}
              </form>
            )}
          </LuxCard>
        </aside>
      </div>

      {detalle ? (
        <div
          role="dialog"
          aria-label={`Detalle de ${detalle.nombre}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setDetalle(null)}
        >
          <LuxCard
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end p-3">
              <button
                type="button"
                aria-label="Cerrar detalle"
                onClick={() => setDetalle(null)}
                className="text-neutral-400 hover:text-neutral-800 dark:hover:text-white"
              >
                <X size={18} />
              </button>
            </div>
            {detalle.imagenUrl ? (
              <img
                src={detalle.imagenUrl}
                alt={`${detalle.nombre} de ${detalle.marca}`}
                className="max-h-[45vh] w-full object-contain"
              />
            ) : null}
            <div className="p-6">
              <Badge tone="tinta">{detalle.marca}</Badge>
              <h2 className="mt-2 font-serif text-3xl italic text-lux-blue dark:text-white">
                {detalle.nombre}
              </h2>
              <p className="mt-1 font-mono text-[11px] text-neutral-400">{detalle.sku}</p>

              <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
                {(
                  [
                    ['Tipo', detalle.categoria],
                    ['Color', detalle.color],
                    ['Material', detalle.material],
                    ['Calibre', detalle.calibre ? `${detalle.calibre} mm` : null],
                    [
                      'Índice de refracción',
                      detalle.indiceRefraccion ? String(detalle.indiceRefraccion) : null,
                    ],
                    ['Filtro', detalle.filtro],
                    ['Tratamiento', detalle.tratamiento],
                  ] as const
                )
                  .filter(([, valor]) => Boolean(valor))
                  .map(([etiqueta, valor]) => (
                    <div key={etiqueta}>
                      <dt className={fieldLabelClass}>{etiqueta}</dt>
                      <dd className="text-neutral-600 dark:text-neutral-300">{valor}</dd>
                    </div>
                  ))}
              </dl>

              <div className="mt-6 flex items-center justify-between gap-4">
                <span className="text-2xl font-semibold tabular-nums">
                  {colones(detalle.precio)}
                </span>
                <LuxButton
                  type="button"
                  onClick={() => {
                    agregar(detalle);
                    setDetalle(null);
                  }}
                >
                  <Plus size={13} />
                  Agregar al apartado
                </LuxButton>
              </div>
            </div>
          </LuxCard>
        </div>
      ) : null}
    </div>
  );
};
