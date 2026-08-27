import type { Catalogo } from './es';

/**
 * Catálogo en italiano (`DSO-53`).
 *
 * ⚠️ Igual que `en.ts`: el tipo `Catalogo` exige las claves completas. El
 * italiano es el idioma que más riesgo tiene de quedarse atrás —es el último
 * que se añadió— y por eso el compilador es quien lo vigila, no la buena
 * voluntad de quien edite.
 */
export const it: Catalogo = {
  'idioma.es': 'Spagnolo',
  'idioma.en': 'Inglese',
  'idioma.it': 'Italiano',
  'idioma.selector.etiqueta': 'Cambia lingua',

  'comun.tema.claro': 'Passa alla modalità chiara',
  'comun.tema.oscuro': 'Passa alla modalità scura',
  'comun.cargando': 'Caricamento…',
  'comun.reintentar': 'Riprova',
  'comun.cerrar': 'Chiudi',
  'comun.cancelar': 'Annulla',
  'comun.guardar': 'Salva',
  'comun.buscar': 'Cerca',
  'comun.volver': 'Indietro',
  'comun.sesion.salir': 'Esci',
  'comun.sesion.entrar': 'Accedi',
  'comun.error.generico': 'Si è verificato un errore',
  'comun.error.sinConexion':
    'Impossibile contattare il server. Verifica che l’API sia in esecuzione e riprova.',

  'nav.admin.panel': 'Pannello',
  'nav.admin.personas': 'Persone',
  'nav.admin.expedientes': 'Cartelle cliniche',
  'nav.admin.bodega': 'Magazzino',
  'nav.admin.ventas': 'Cassa e vendite',
  'nav.admin.citas': 'Appuntamenti',
  'nav.admin.laboratorio': 'Laboratorio',
  'nav.admin.usuarios': 'Utenti',
  'nav.admin.auditoria': 'Registro attività',
  'nav.admin.metricas': 'Metriche',
  'nav.admin.cuenta': 'Il mio account',

  'nav.publico.inicio': 'Home',
  'nav.publico.catalogo': 'Catalogo',
  'nav.publico.especialista': 'Specialista',
  'nav.publico.portal': 'La mia ricetta',
  'nav.publico.agendar': 'Prenota una visita',
};
