type Props = {
  className?: string;
  /** Texto accesible; se expone como `aria-label` del SVG. */
  title?: string;
  /** Los ojos parpadean de vez en cuando. Solo para pantallas de espera o de aviso. */
  parpadeo?: boolean;
};

/**
 * Isotipo de la Óptica Dr. Luigi Semeraro: búho de frente con anteojos.
 *
 * Reconstrucción vectorial del logo impreso en el expediente clínico
 * (ver `.contexto/Imagenes/IDENTIDAD-PAPELERIA.md`). Las proporciones no son a
 * ojo: salen de medir la máscara de tinta de la fotografía y de comparar el
 * trazado contra ella por superposición de píxeles (IoU ≈ 82 %, el techo
 * razonable frente a una foto de impresión con antialiasing).
 *
 * Lienzo 107 × 123 · aros r 19.5 en (26.5, 43.5) y (79, 43.5) · pupilas r 9.5
 * ligeramente convergentes hacia el centro, con brillo arriba a la derecha.
 *
 * Hereda el color mediante `currentColor`, así que sirve igual en tema claro y
 * oscuro. El brillo de las pupilas es el único color fijo (blanco).
 */
export function LogoBuho({
  className = '',
  title = 'Óptica Dr. Luigi Semeraro',
  parpadeo = false,
}: Props) {
  // `fill-box` hace que el origen sea el centro de cada pupila, no del lienzo.
  const ojo = parpadeo ? 'animate-parpadeo [transform-box:fill-box] origin-center' : undefined;
  return (
    <svg
      viewBox="0 0 107 123"
      className={className}
      role="img"
      aria-label={title}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Cabeza: orejas puntiagudas y frente que baja en V entre los dos aros */}
      <path
        d="M8,0 L13,19 L38,20 L53,32 L68,20 L93,19 L98,0
           C90,3 80,6.5 73,8.5 C66,4.5 59,3.5 53,4.5 C47,3.5 40,4.5 33,8.5 C26,6.5 16,3 8,0 Z"
        fill="currentColor"
      />

      {/* Patillas: salen en diagonal del aro y rematan en un trazo vertical */}
      <path
        d="M16,24.5 L4.5,28.5 M4.5,27.5 V35"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M91,24.5 L102.5,28.5 M102.5,27.5 V35"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {/* Aros y puente */}
      <circle cx="26.5" cy="43.5" r="19.5" stroke="currentColor" strokeWidth="5.5" />
      <circle cx="79" cy="43.5" r="19.5" stroke="currentColor" strokeWidth="5.5" />
      <path
        d="M44.5,37.5 C48,34.5 58,34.5 61.5,37.5"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinecap="round"
      />

      {/* Pupilas con su brillo */}
      <g className={ojo}>
        <circle cx="29" cy="42" r="9.5" fill="currentColor" />
        <circle cx="32.2" cy="38.6" r="2.1" fill="#fff" />
      </g>
      <g className={ojo}>
        <circle cx="77" cy="42" r="9.5" fill="currentColor" />
        <circle cx="80.2" cy="38.6" r="2.1" fill="#fff" />
      </g>

      {/* Pico en forma de gota */}
      <path
        d="M53,46 C58.5,51.5 59,58 57,64 C56,67 54.5,68.8 53,69.5
           C51.5,68.8 50,67 49,64 C47,58 47.5,51.5 53,46 Z"
        fill="currentColor"
      />

      {/* Cuerpo: contorno abierto que arranca bajo cada aro y cierra abajo */}
      <path
        d="M10,65 C8,74 8,86 9.5,93.5 C12,104 27,120.5 53,120.5
           C79,120.5 94,104 96.5,93.5 C98,86 98,74 96,65"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Alas en forma de hoja, apoyadas en el contorno del cuerpo */}
      <path
        d="M14.5,67.5 C10,76 8.5,86 9.5,94 C11.5,102 16,106.5 21,108
           C26,102 28.5,95 28,88 C27.5,80 22,71.5 14.5,67.5 Z"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path
        d="M92.5,67.5 C97,76 98.5,86 97.5,94 C95.5,102 91,106.5 86,108
           C81,102 78.5,95 79,88 C79.5,80 85,71.5 92.5,67.5 Z"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
