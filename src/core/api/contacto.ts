import { useEffect, useState } from 'react';
import { parametrosPublicos } from './catalogo.service';
import { enlaceWhatsapp, numeroLegible } from '../models/catalogo';

/**
 * Canal de contacto de la óptica, compartido por CU-09, CU-11, CU-13 y CU-14.
 *
 * Las cuatro pantallas hacían **lo mismo**: pedir los parámetros públicos,
 * intentar abrir `wa.me` y, si no se puede, ofrecer el teléfono. Estaba copiado
 * cuatro veces y las excepciones **EX-13** y **EX-15** piden literalmente el
 * mismo comportamiento, así que vive en un solo sitio.
 *
 * ⚠️ **Esto NO es la Cloud API de Meta.** Es redirección por enlace: no lleva
 * credenciales ni cuesta nada por mensaje. El envío automático con
 * `WHATSAPP_ACCESS_TOKEN` es otro mecanismo y vive en `DSO-36`.
 */
export interface CanalContacto {
  nombreOptica: string;
  /** Aviso de EX-13/EX-15 cuando no se pudo abrir; cadena vacía si todo fue bien. */
  aviso: string;
  /** Abre WhatsApp con el mensaje ya escrito. Devuelve `true` si lo consiguió. */
  abrirWhatsapp: (mensaje: string) => boolean;
  limpiarAviso: () => void;
}

export const useCanalContacto = (): CanalContacto => {
  const [nombreOptica, setNombreOptica] = useState('la óptica');
  const [whatsapp, setWhatsapp] = useState('');
  const [telefono, setTelefono] = useState('');
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    parametrosPublicos()
      .then((p) => {
        setWhatsapp(p['optica.whatsapp'] ?? '');
        setTelefono(p['optica.telefono'] ?? '');
        setNombreOptica(p['optica.nombre'] ?? 'la óptica');
      })
      .catch(() => {
        // Sin parámetros no se puede redirigir; el aviso lo dirá al pulsar.
      });
  }, []);

  const abrirWhatsapp = (mensaje: string): boolean => {
    setAviso('');
    const respaldo = telefono
      ? `Llámenos al ${telefono}.`
      : 'Por favor comuníquese con la óptica por teléfono.';

    // Los dos modos de fallo que cubren EX-13 y EX-15: sin canal configurado, y
    // ventana bloqueada por el navegador. El CU pide lo mismo en ambos.
    if (!whatsapp) {
      setAviso(`No se pudo abrir WhatsApp. ${respaldo}`);
      return false;
    }
    const ventana = window.open(enlaceWhatsapp(whatsapp, mensaje), '_blank');
    if (!ventana) {
      setAviso(
        `No se pudo abrir WhatsApp. ${
          telefono ? respaldo : `Llámenos al ${numeroLegible(whatsapp)}.`
        }`,
      );
      return false;
    }
    return true;
  };

  return {
    nombreOptica,
    aviso,
    abrirWhatsapp,
    limpiarAviso: () => setAviso(''),
  };
};
