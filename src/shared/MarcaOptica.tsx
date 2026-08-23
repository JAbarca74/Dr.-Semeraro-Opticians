import { LogoBuho } from './LogoBuho';

type Props = {
  /** Clases extra para el contenedor (por ejemplo, ajustes de separación). */
  className?: string;
  /** Tamaño del isotipo. `sm` en los shells internos, `md` en el login. */
  tamano?: 'sm' | 'md';
};

const ALTURA = {
  sm: 'h-7 w-auto md:h-8',
  md: 'h-9 w-auto md:h-10',
} as const;

/**
 * Un único tamaño por variante: «ÓPTICA» y «DR. LUIGI SEMERARO» se componen
 * **igual**. En el membrete impreso son la misma tipografía y la misma tinta;
 * tenerlas con pesos, cajas y tamaños distintos las hacía parecer dos marcas.
 *
 * `sm` es deliberadamente pequeño: el nombre completo en caja alta y con
 * `tracking` ancho mide ~25 caracteres, y a mayor tamaño la marca invadía los
 * enlaces de la barra de navegación. `md` (solo el login) puede ser mayor
 * porque ahí la marca va sola.
 */
const TEXTO = {
  sm: 'text-[10px] md:text-[11px]',
  md: 'text-base md:text-lg',
} as const;

/**
 * Logotipo de la óptica: isotipo del búho + «ÓPTICA Dr. Luigi Semeraro».
 *
 * Existe como componente único porque el logotipo aparece en los cuatro
 * encabezados (login, público, admin y recepción) y debe ser **idéntico** en
 * todos: repetir el marcado en cada layout lo hacía divergir.
 *
 * El nombre completo de la óptica es «Óptica Dr. Luigi Semeraro», así que va
 * seguido y **sin separador**: no son dos entidades distintas. La tipografía es
 * `font-marca` (Archivo), la grotesca del membrete impreso; ver
 * `.contexto/Imagenes/IDENTIDAD-PAPELERIA.md`.
 *
 * Las dos palabras se componen **idénticas** —misma familia, peso, caja,
 * `tracking`, tamaño y color— porque el impreso es monocromo y de una sola
 * tipografía. El isotipo va dentro del mismo `text-lux-tinta` y lo toma por
 * `currentColor`, así que búho y texto son siempre la misma tinta.
 */
export function MarcaOptica({ className = '', tamano = 'sm' }: Props) {
  // `whitespace-nowrap`: con el `tracking` ancho, «DR. LUIGI SEMERARO» partía
  // en dos líneas al competir con la barra de navegación.
  const texto = `whitespace-nowrap font-marca font-medium uppercase tracking-luxe ${TEXTO[tamano]}`;

  // En un teléfono el bloque entero mide 272 px y, con el botón de tema y el de
  // menú al otro lado, no cabe en 375: el encabezado se salía de la pantalla.
  // La variante `sm` —la de los tres shells— deja solo el búho y «Óptica» por
  // debajo de 640 px. El login usa `md` y conserva el logotipo completo, que
  // ahí va solo y tiene sitio de sobra.
  const apellido = tamano === 'sm' ? `${texto} hidden sm:inline` : texto;

  return (
    <span
      className={`flex shrink-0 items-center gap-3 text-lux-tinta ${className}`}
    >
      <LogoBuho className={`shrink-0 ${ALTURA[tamano]}`} />
      <span className={texto}>Óptica</span>
      <span className={apellido}>Dr. Luigi Semeraro</span>
    </span>
  );
}
