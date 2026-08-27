/**
 * Catálogo base en español (`DSO-53`).
 *
 * ⚠️ **Este archivo es la fuente de verdad de las claves.** `en.ts` e `it.ts`
 * se tipan contra él, así que **añadir una clave aquí obliga a traducirla en
 * los otros dos o el proyecto no compila**. Es deliberado: el modo habitual de
 * que una aplicación multiidioma se pudra es que alguien añada un texto y
 * traduzca solo el suyo, y meses después un usuario vea español suelto en
 * mitad de una pantalla en italiano.
 *
 * Convención de claves: `ambito.pantalla.elemento`, en minúsculas y sin tildes.
 * El ámbito `comun` es para lo que aparece en más de una pantalla.
 */
export const es = {
  // --- Idiomas y selector ---
  'idioma.es': 'Español',
  'idioma.en': 'Inglés',
  'idioma.it': 'Italiano',
  'idioma.selector.etiqueta': 'Cambiar idioma',

  // --- Cabeceras y utilidades comunes ---
  'comun.tema.claro': 'Cambiar a modo claro',
  'comun.tema.oscuro': 'Cambiar a modo oscuro',
  'comun.cargando': 'Cargando…',
  'comun.reintentar': 'Reintentar',
  'comun.cerrar': 'Cerrar',
  'comun.cancelar': 'Cancelar',
  'comun.guardar': 'Guardar',
  'comun.buscar': 'Buscar',
  'comun.volver': 'Volver',
  'comun.sesion.salir': 'Cerrar sesión',
  'comun.sesion.entrar': 'Iniciar sesión',
  'comun.error.generico': 'Ocurrió un error',
  'comun.error.sinConexion':
    'No se pudo conectar con el servidor. Verifique que la API esté en ejecución e inténtelo de nuevo.',

  // --- Navegación del entorno privado ---
  'nav.admin.panel': 'Panel',
  'nav.admin.personas': 'Personas',
  'nav.admin.expedientes': 'Expedientes',
  'nav.admin.bodega': 'Bodega',
  'nav.admin.ventas': 'Caja & Ventas',
  'nav.admin.citas': 'Citas',
  'nav.admin.laboratorio': 'Lab',
  'nav.admin.usuarios': 'Usuarios',
  'nav.admin.auditoria': 'Auditoría',
  'nav.admin.metricas': 'Métricas',
  'nav.admin.cuenta': 'Mi cuenta',

  // --- Navegación pública ---
  'nav.publico.inicio': 'Inicio',
  'nav.publico.catalogo': 'Catálogo',
  'nav.publico.especialista': 'Especialista',
  'nav.publico.portal': 'Mi receta',
  'nav.publico.agendar': 'Agendar cita',
} as const;

/**
 * Toda clave válida del sistema. `t()` solo acepta estas, así que un error de
 * tecleo es **un fallo de compilación**, no un texto raro en producción.
 */
export type ClaveTexto = keyof typeof es;

/** La forma que deben cumplir el resto de catálogos: todas las claves, sin faltar una. */
export type Catalogo = Record<ClaveTexto, string>;
