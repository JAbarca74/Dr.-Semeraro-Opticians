import { MessageCircle } from 'lucide-react';
import { useCanalContacto } from '../core/api/contacto';
import { MENSAJE_CONTACTO_RAPIDO } from '../core/models/cita-whatsapp';

/**
 * Icono flotante de WhatsApp — **flujo alterno «Contacto rápido» de CU-11**.
 *
 * El caso de uso lo describe tal cual: *«El paciente presiona el icono flotante
 * de WhatsApp sin llenar el formulario → abre el chat con un saludo genérico»*.
 * Por eso vive en el layout público y no en una página: tiene que estar en
 * **todas**, que es lo que lo hace un atajo.
 *
 * **EX-13** lo resuelve `useCanalContacto`, igual que el formulario largo: si el
 * navegador bloquea la ventana, el aviso con el teléfono aparece aquí mismo.
 */
export const BotonWhatsappFlotante = () => {
  const { aviso, abrirWhatsapp } = useCanalContacto();

  return (
    <>
      {aviso ? (
        <p
          role="alert"
          className="fixed bottom-24 right-5 z-50 max-w-60 border border-amber-300/40 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 shadow-lg dark:border-amber-900/30 dark:bg-amber-950/90 dark:text-amber-300"
        >
          {aviso}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => abrirWhatsapp(MENSAJE_CONTACTO_RAPIDO)}
        aria-label="Consultar disponibilidad de citas por WhatsApp"
        title="Consultar por WhatsApp"
        className="transition-luxe fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-lux-tinta text-white shadow-lg hover:bg-lux-blue dark:hover:bg-lux-tinta-claro dark:hover:text-black"
      >
        <MessageCircle size={20} strokeWidth={1.8} />
      </button>
    </>
  );
};
