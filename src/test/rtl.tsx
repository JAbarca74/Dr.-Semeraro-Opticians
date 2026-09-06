import { render as renderRtl } from '@testing-library/react';
import type { ReactElement } from 'react';
import { IdiomaProvider } from '../core/i18n/idioma.context';

/**
 * `render` de pruebas envuelto en `IdiomaProvider` (`DSO-54`).
 *
 * Desde que las pantallas usan `useIdioma()`, montarlas sueltas revienta con
 * «useIdioma debe usarse dentro de <IdiomaProvider>». En vez de repetir el
 * envoltorio en cada prueba, se cambia el import y ya.
 *
 * ⚠️ **Fija el español antes de montar, y no es un detalle.** `IdiomaProvider`
 * cae al idioma del navegador cuando no hay elección guardada, y **jsdom se
 * presenta como `en-US`**: sin esto, cada prueba que afirma un texto en español
 * fallaría por un motivo que no tiene nada que ver con lo que mide. Una prueba
 * que quiera otro idioma lo deja puesto en `localStorage` antes de llamar.
 *
 * ⚠️ **Se reexporta a mano y no con `export *`.** Un `export *` que incluya
 * `render` compite con el de aquí y gana el de la librería según cómo resuelva
 * el empaquetador: las pruebas volvían a montar sin proveedor sin que el import
 * pareciera mal.
 */
export const render = (ui: ReactElement) => {
  if (!localStorage.getItem('optica_idioma')) {
    localStorage.setItem('optica_idioma', 'es');
  }
  return renderRtl(<IdiomaProvider>{ui}</IdiomaProvider>);
};

export {
  cleanup,
  screen,
  waitFor,
  within,
  fireEvent,
  act,
} from '@testing-library/react';
