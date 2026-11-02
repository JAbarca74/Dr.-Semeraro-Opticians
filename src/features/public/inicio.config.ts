/** Ubicación confirmada por el cliente; iframe obtenido de Compartir en Google Maps. */
export const UBICACION_OPTICA = {
  mapsUrl: 'https://maps.app.goo.gl/MoTmSjh4X7YdYHNB8?g_st=aw',
  embedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3936.551163158311!2d-83.7056279!3d9.3729262!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8fa14f7174719d8f%3A0xd56bc06bc1dd6afb!2sZoetry%20Medical%20Center!5e0!3m2!1ses-419!2scr!4v1793605210934!5m2!1ses-419!2scr',
  referencia: 'Zoetry Medical Center',
  direccion:
    '50 mts sur de oficinas centrales de Coopealianza, San Isidro de El General, San José, Costa Rica.',
} as const;

interface FotoConsultorio {
  src: string;
  width: number;
  height: number;
  descripcion: Record<'es' | 'en' | 'it', string>;
}

export const FOTO_MONTURAS = '/images/inicio/monturas-iluminadas.webp';
export const FOTO_FACHADA = '/images/inicio/fachada-zoetry.webp';

export const CONTACTO_OPTICA = {
  whatsapp: '50670853353',
  telefonoVisible: '7085 3353',
  correo: 'odsemeraro@icloud.com',
  facebook: 'https://www.facebook.com/share/19dGAEd5TM/',
  instagram:
    'https://www.instagram.com/opticasemeraro?dlrf=MWQ2ZDI2aHd5bnc4Yg==',
} as const;

export const FOTOS_CONSULTORIO: readonly FotoConsultorio[] = [
  {
    src: '/images/inicio/examen-lampara-hendidura.webp',
    width: 1086,
    height: 1448,
    descripcion: {
      es: 'Evaluación ocular con lámpara de hendidura.',
      en: 'Eye examination using a slit lamp.',
      it: 'Esame oculare con lampada a fessura.',
    },
  },
  {
    src: '/images/inicio/evaluacion-huvitz.webp',
    width: 1086,
    height: 1448,
    descripcion: {
      es: 'Evaluación visual con equipo optométrico Huvitz.',
      en: 'Vision assessment using Huvitz optometric equipment.',
      it: 'Valutazione visiva con strumentazione optometrica Huvitz.',
    },
  },
  {
    src: '/images/inicio/consulta-optometrica.webp',
    width: 1254,
    height: 1254,
    descripcion: {
      es: 'Especialista revisando documentos en el escritorio del consultorio.',
      en: 'Specialist reviewing documents at the practice desk.',
      it: 'Specialista che esamina documenti alla scrivania dello studio.',
    },
  },
];

export const DESCRIPCION_FACHADA = {
  es: 'Fachada de Zoëtry Medical Center y Clínica de Lentes de Contacto.',
  en: 'Exterior of Zoëtry Medical Center and the contact lens clinic.',
  it: 'Facciata di Zoëtry Medical Center e della clinica delle lenti a contatto.',
} as const;
