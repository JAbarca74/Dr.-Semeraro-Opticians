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
import { CATEGORIAS, CategoriaProducto } from '../../core/models/inventario';
import { mensajeDeError } from '../../shared/error';
import { useIdioma } from '../../core/i18n/idioma.context';
import { tipoCambioVigente } from '../../core/api/tipo-cambio.service';
import { aproximadoUsd, type TipoCambio } from '../../core/models/moneda';
import { CLAVE_CATEGORIA } from '../../core/models/inventario';
import type { ClaveTexto } from '../../core/i18n/catalogos/es';
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
/**
 * Precio de un producto: **colones primero, dólar detrás y en pequeño**.
 *
 * ⚠️ **Las tres reglas de `DSO-57`, y ninguna es estética:**
 * 1. **El colón manda.** Cambiar de idioma no cambia la moneda: un inglés que
 *    viera `$189.50` creería que ese es el precio, y no lo es.
 * 2. **Se rotula «aprox.».** El importe sale de una tasa que se movió ayer;
 *    sin la marca, alguien llega al mostrador esperando pagar exactamente eso.
 * 3. **Sin tasa, el dólar desaparece y el colón queda intacto.** Nunca `$0.00`
 *    ni `$NaN`: la conversión es un adorno, el precio es el producto.
 */
const Precio = ({
  monto,
  cambio,
  className,
}: {
  monto: number;
  cambio: TipoCambio;
  className?: string;
}) => {
  const { t, colones } = useIdioma();
  const usd = aproximadoUsd(monto, cambio);

  return (
    <span className={className}>
      <span className="tabular-nums">{colones(monto)}</span>
      {usd !== null ? (
        <span className="ml-2 text-xs font-normal text-neutral-400 tabular-nums">
          {' · '}
          {t('moneda.aproximado')} ${usd.toFixed(2)}
        </span>
      ) : null}
    </span>
  );
};

export const CatalogoPage = () => {
  const { t, fechaCorta } = useIdioma();

  /**
   * Tipo de cambio para el aproximado en dólares (`DSO-57`).
   *
   * ⚠️ **Su fallo no puede afectar al catálogo.** El servicio ya se traga el
   * error y devuelve «no disponible»; aquí simplemente no se pinta el dólar.
   * El precio en colones se ve igual, que es lo que el visitante necesita.
   */
  const [cambio, setCambio] = useState<TipoCambio>({ disponible: false });
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
      setError(mensajeDeError(e, t('catalogo.error')));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    // El servicio ya se traga sus errores, pero la pantalla no depende de esa
    // promesa: un rechazo aquí dejaría una promesa sin capturar y, en el peor
    // caso, tumbaría la carga del catálogo por una conversión que es opcional.
    void tipoCambioVigente()
      .then(setCambio)
      .catch(() => setCambio({ disponible: false }));
  }, []);

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
        t('catalogo.sinWhatsapp'),
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
        kicker={t('catalogo.kicker')}
        title={t('catalogo.titulo')}
        description={t('catalogo.descripcion')}
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
              {t('catalogo.buscar')}
            </label>
            <input
              id="buscaCatalogo"
              className={fieldInputClass}
              placeholder={t('catalogo.buscarEjemplo')}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div>
            <label className={fieldLabelClass} htmlFor="filtroMarca">
              {t('catalogo.marca')}
            </label>
            <select
              id="filtroMarca"
              className={fieldInputClass}
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
            >
              <option value="">{t('catalogo.marcaTodas')}</option>
              {marcas.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={fieldLabelClass} htmlFor="filtroTipo">
              {t('catalogo.tipo')}
            </label>
            <select
              id="filtroTipo"
              className={fieldInputClass}
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as CategoriaProducto | '')}
            >
              <option value="">{t('catalogo.tipoTodos')}</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {t(CLAVE_CATEGORIA[c] as ClaveTexto)}
                </option>
              ))}
            </select>
          </div>
          <LuxButton type="submit" variant="ghost">
            <Search size={14} />
            {t('comun.buscar')}
          </LuxButton>
        </form>
      </LuxCard>

      {/*
        ⚠️ **De dónde sale el dólar y de cuándo es.** El importe se calcula con
        una tasa que se movió ayer: sin decir la fecha y la fuente, alguien
        llega al mostrador esperando pagar exactamente eso. Solo aparece cuando
        hay tasa; sin ella no hay nada que explicar.
      */}
      {cambio.disponible ? (
        <p className="text-[10px] text-neutral-400">
          {t('moneda.tasaDel')} {fechaCorta(cambio.fecha)} {t('moneda.segun')}{' '}
          {cambio.fuente}. {t('moneda.avisoAproximado')}
        </p>
      ) : null}

      {/*
        ⚠️ **Con la API caída no se pinta el vacío (EX-11).** Antes salían las
        dos cosas juntas y el consejo era falso: se le pedía al visitante que
        «pruebe con otra marca o quite los filtros» cuando el problema era que
        el servidor no respondía. Ningún filtro lo iba a arreglar.
      */}
      {productos.length === 0 ? (
        error ? null : (
          <LuxCard className="p-12 text-center">
            <p className="text-sm text-neutral-500">
              {cargando ? t('catalogo.cargando') : t('catalogo.ex11')}
            </p>
            {!cargando ? (
              <p className="mt-2 text-xs text-neutral-400">
                {t('catalogo.ex11.detalle')}
              </p>
            ) : null}
          </LuxCard>
        )
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
                  aria-label={`${t('catalogo.verDetalle')} ${p.nombre}`}
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
                        {t('catalogo.sinFoto')}
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
                    {[
                      t(CLAVE_CATEGORIA[p.categoria] as ClaveTexto),
                      p.color,
                      p.material,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  <Precio
                    monto={p.precio}
                    cambio={cambio}
                    className="mt-3 block text-lg font-semibold"
                  />
                  <LuxButton
                    type="button"
                    variant="tinta"
                    className="mt-4 w-full"
                    onClick={() => consultar(p)}
                  >
                    <MessageCircle size={13} />
                    {t('catalogo.consultar')}
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
                aria-label={t('catalogo.cerrarDetalle')}
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
                    [t('catalogo.ficha.color'), detalle.color],
                    [t('catalogo.ficha.material'), detalle.material],
                    [
                      t('catalogo.ficha.calibre'),
                      detalle.calibre ? `${detalle.calibre} mm` : null,
                    ],
                    [
                      t('catalogo.ficha.indice'),
                      detalle.indiceRefraccion ? String(detalle.indiceRefraccion) : null,
                    ],
                    [t('catalogo.ficha.filtro'), detalle.filtro],
                    [t('catalogo.ficha.tratamiento'), detalle.tratamiento],
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
                <Precio
                  monto={detalle.precio}
                  cambio={cambio}
                  className="text-2xl font-semibold"
                />
                <LuxButton
                  type="button"
                  variant="tinta"
                  onClick={() => {
                    consultar(detalle);
                    setDetalle(null);
                  }}
                >
                  <MessageCircle size={13} />
                  {t('catalogo.consultar')}
                </LuxButton>
              </div>
            </div>
          </LuxCard>
        </div>
      ) : null}
    </div>
  );
};
