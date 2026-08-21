import { useId, useState } from 'react';
import { PAISES, etiquetaPais } from './paises';
import { partirTelefono, unirTelefono } from './telefono';

/**
 * Campo de teléfono con selector de país.
 *
 * Recibe y devuelve **un solo string** (`+506 72221959`), de modo que encaja
 * en los formularios existentes sin cambiar sus modelos ni la base.
 *
 * Las clases se pasan por props porque el proyecto mantiene dos kits de UI —el
 * del panel administrativo y el de recepción— y este campo se usa en los dos.
 */
export const TelefonoInput = ({
  etiqueta,
  valor,
  onChange,
  labelClass,
  inputClass,
  requerido = false,
}: {
  etiqueta: string;
  valor?: string | null;
  onChange: (valor: string) => void;
  labelClass: string;
  inputClass: string;
  requerido?: boolean;
}) => {
  const id = useId();
  const { prefijo: prefijoDelValor, numero } = partirTelefono(valor);

  /**
   * El prefijo se recuerda aparte mientras no hay número escrito.
   *
   * Sin esto, elegir el país antes de teclear el número —que es el orden
   * natural— perdía la elección: `unirTelefono` devuelve cadena vacía si no hay
   * número, y al volver a leerla se reponía el país por defecto. Cuando ya hay
   * número manda lo que diga el valor, que es la fuente de verdad.
   */
  const [prefijoElegido, setPrefijoElegido] = useState(prefijoDelValor);
  const prefijo = numero ? prefijoDelValor : prefijoElegido;

  return (
    <div>
      {/* `label` de verdad, asociado al campo del número: así el texto visible
          nombra al input y el selector de país lleva su propia etiqueta, sin
          que ambos respondan al mismo nombre accesible. */}
      <label className={labelClass} htmlFor={id}>
        {etiqueta}
      </label>
      {/* `flex-wrap` + un mínimo en el número: en columnas estrechas —el
          formulario de recepción va a dos columnas— el campo baja a la línea
          siguiente y ocupa el ancho entero, en vez de quedarse en 79 px donde
          no se lee ni un teléfono de ocho dígitos. */}
      <div className="flex flex-wrap gap-2">
        {/* Los anchos van en `style` y no en clases: los dos kits de UI del
            proyecto traen `w-full` en `inputClass`, y entre dos utilidades de
            anchura gana la que Tailwind emita después, no la que se escriba
            última aquí. En línea es la única forma de que el reparto sea
            estable en ambos kits — sin esto, el select se comía la fila y el
            número quedaba en 30 px. */}
        <select
          className={`${inputClass} pr-1`}
          style={{ flex: '0 0 7.5rem', width: '7.5rem' }}
          value={prefijo}
          aria-label={`Código de país · ${etiqueta}`}
          onChange={(e) => {
            setPrefijoElegido(e.target.value);
            onChange(unirTelefono(e.target.value, numero));
          }}
        >
          {PAISES.map((p) => (
            // La clave lleva el ISO porque hay prefijos repetidos: +1 lo
            // comparten Estados Unidos y Canadá, y +7 Rusia y Kazajistán.
            <option key={p.iso} value={p.prefijo} title={p.nombre}>
              {etiquetaPais(p)}
            </option>
          ))}
        </select>
        <input
          id={id}
          className={inputClass}
          style={{ flex: '1 1 8rem', minWidth: '8rem' }}
          value={numero}
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="8888 8888"
          required={requerido}
          onChange={(e) => onChange(unirTelefono(prefijo, e.target.value))}
        />
      </div>
    </div>
  );
};
