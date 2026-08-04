import { LogoBuho } from './LogoBuho';

type Props = {
  /** Clases extra para el contenedor (por ejemplo, ajustes de separación). */
  className?: string;
  /** Tamaño del isotipo. `sm` en los shells internos, `md` en el login. */
  tamano?: 'sm' | 'md';
};

const ALTURA = {
  sm: 'h-8 w-auto md:h-9',
  md: 'h-9 w-auto md:h-10',
} as const;

const TEXTO = {
  sm: { optica: 'text-sm md:text-base', doctor: 'text-xs md:text-sm' },
  md: { optica: 'text-base md:text-lg', doctor: 'text-sm md:text-base' },
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
 */
export function MarcaOptica({ className = '', tamano = 'sm' }: Props) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <LogoBuho className={ALTURA[tamano]} />
      <span className={`font-marca font-medium uppercase tracking-luxe ${TEXTO[tamano].optica}`}>
        Óptica
      </span>
      <span className={`font-marca font-normal text-lux-gold ${TEXTO[tamano].doctor}`}>
        Dr. Luigi Semeraro
      </span>
    </span>
  );
}
