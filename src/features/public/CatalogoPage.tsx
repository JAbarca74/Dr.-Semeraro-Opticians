import { useEffect, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { ImageOff, MessageCircle, Search, X } from 'lucide-react';
import {
  listarCatalogo,
  marcasDelCatalogo,
  parametrosPublicos,
  type FiltrosCatalogo,
} from '../../core/api/catalogo.service';
import {
  construirMensajeConsulta,
  enlaceWhatsapp,
  numeroLegible,
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
  fadeUpItem,
  fieldInputClass,
  fieldLabelClass,
  stagger,
} from '../../shared/ui';

/**
 * Catálogo de modelos (CU-09, `DSO-49`).
 *
 * **Vitrina, no tienda.** El caso de uso es explícito: «función informativa que
 * **NO permite compras directas**». Aquí no hay carrito, ni cobro, ni reserva de
 * inventario: cada modelo tiene su botón de consulta y el flujo termina en una
 * conversación de WhatsApp con la clínica. Si el interés prospera, la venta la
 * registra Recepción en la caja (CU-04).
 *
 * ⚠️ Lo que se pinta viene de `GET /catalogo`, que **no devuelve existencias ni
 * costo**. Si en esta pantalla aparece alguna vez un dato de inventario, el
 * problema está en el backend, no aquí.
 */
export const CatalogoPage = () => {
  const [productos, setProductos] = useState<ProductoVitrina[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [numeroOptica, setNumeroOptica] = useState('');
  const [nombreOptica, setNombreOptica] = useState('su catálogo');

  const [busqueda, setBusqueda] = useState('');
  const [marca, setMarca] = useState('');
  const [categoria, setCategoria] = useState<CategoriaProducto | ''>('');

  const [detalle, setDetalle] = useState<ProductoVitrina | null>(null);
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
        setNombreOptica(p['optica.nombre'] ?? 'su catálogo');
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

  /**
   * CU-09 pasos 7–8: abre WhatsApp con el nombre del producto ya en el mensaje.
   *
   * Si el navegador bloquea la ventana emergente, `window.open` devuelve `null`.
   * En ese caso no se puede hacer nada por la persona salvo darle el número para
   * que escriba a mano — el mismo trato que CU-11 le da a **EX-13**.
   */
  const consultar = (producto: ProductoVitrina) => {
    setAvisoWhatsapp('');

    if (!numeroOptica) {
      setAvisoWhatsapp(
        'No hay un número de WhatsApp configurado. Por favor comuníquese con la óptica por teléfono.',
      );
      return;
    }

    const mensaje = construirMensajeConsulta(producto, nombreOptica);
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
        description="Explore las monturas y lentes de la óptica. ¿Le interesa alguno? Consúltenos por WhatsApp desde el mismo modelo y le damos todos los detalles."
      />

      {error ? <Alert>{error}</Alert> : null}

      {avisoWhatsapp ? (
        <p
          role="alert"
          className="border border-amber-300/40 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-300"
        >
          {avisoWhatsapp}
        </p>
      ) : null}

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
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
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
                    variant="tinta"
                    className="mt-4 w-full"
                    onClick={() => consultar(p)}
                  >
                    <MessageCircle size={13} />
                    Consultar por WhatsApp
                  </LuxButton>
                </div>
              </LuxCard>
            </motion.div>
          ))}
        </motion.div>
      )}

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
                  variant="tinta"
                  onClick={() => {
                    consultar(detalle);
                    setDetalle(null);
                  }}
                >
                  <MessageCircle size={13} />
                  Consultar por WhatsApp
                </LuxButton>
              </div>
            </div>
          </LuxCard>
        </div>
      ) : null}
    </div>
  );
};
