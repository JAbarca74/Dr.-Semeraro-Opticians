import type { Catalogo } from './es';

/**
 * Catálogo en inglés (`DSO-53`).
 *
 * ⚠️ El tipo `Catalogo` obliga a que estén **todas** las claves de `es.ts`. Si
 * falta una, `tsc` falla y `npm run build` no pasa. No hay forma de dejar el
 * inglés a medias sin enterarse.
 */
export const en: Catalogo = {
  'idioma.es': 'Spanish',
  'idioma.en': 'English',
  'idioma.it': 'Italian',
  'idioma.selector.etiqueta': 'Change language',

  'comun.tema.claro': 'Switch to light mode',
  'comun.tema.oscuro': 'Switch to dark mode',
  'comun.cargando': 'Loading…',
  'comun.reintentar': 'Try again',
  'comun.cerrar': 'Close',
  'comun.cancelar': 'Cancel',
  'comun.guardar': 'Save',
  'comun.buscar': 'Search',
  'comun.volver': 'Back',
  'comun.sesion.salir': 'Sign out',
  'comun.sesion.entrar': 'Sign in',
  'comun.error.generico': 'Something went wrong',
  'comun.error.sinConexion':
    'Could not reach the server. Check that the API is running and try again.',

  'nav.admin.panel': 'Dashboard',
  'nav.admin.personas': 'People',
  'nav.admin.expedientes': 'Records',
  'nav.admin.bodega': 'Stock',
  'nav.admin.ventas': 'Sales',
  'nav.admin.citas': 'Appointments',
  'nav.admin.laboratorio': 'Lab',
  'nav.admin.usuarios': 'Users',
  'nav.admin.auditoria': 'Audit log',
  'nav.admin.metricas': 'Metrics',
  'nav.admin.cuenta': 'My account',

  'nav.publico.inicio': 'Home',
  'nav.publico.catalogo': 'Catalogue',
  'nav.publico.especialista': 'Specialist',
  'nav.publico.portal': 'My prescription',
  'nav.publico.agendar': 'Book an appointment',
};
