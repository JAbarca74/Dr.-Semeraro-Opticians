// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SelectorIdioma } from './SelectorIdioma';
import { IdiomaProvider, useIdioma } from '../core/i18n/idioma.context';

/** Pinta el selector junto a un testigo que muestra el idioma activo y un texto. */
const Testigo = () => {
  const { idioma, t } = useIdioma();
  return (
    <>
      <SelectorIdioma />
      <p data-testid="activo">{idioma}</p>
      <p data-testid="texto">{t('comun.guardar')}</p>
    </>
  );
};

const montar = () =>
  render(
    <IdiomaProvider>
      <Testigo />
    </IdiomaProvider>,
  );

/**
 * ⚠️ **jsdom se presenta como `en-US`**, así que sin fijar esto el idioma
 * inicial de cada prueba sería inglés —que es el comportamiento correcto del
 * proveedor, pero convierte cualquier aserción sobre el español en una
 * casualidad—. Se declara el navegador que quiere cada prueba.
 */
const navegadorEn = (idioma: string) =>
  Object.defineProperty(window.navigator, 'language', {
    value: idioma,
    configurable: true,
  });

beforeEach(() => {
  localStorage.clear();
  document.documentElement.lang = '';
  navegadorEn('es-CR');
});
afterEach(cleanup);

describe('SelectorIdioma', () => {
  it('ofrece los tres idiomas, cada uno en el suyo', async () => {
    montar();

    expect(await screen.findByRole('option', { name: 'Español' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Italiano' })).toBeInTheDocument();
  });

  it('es un control de verdad: cambiarlo traduce la pantalla', async () => {
    // El `ES / EN` anterior era un <span> de adorno. Esto verifica lo contrario.
    montar();
    expect(screen.getByTestId('texto')).toHaveTextContent('Guardar');

    await userEvent.selectOptions(screen.getByRole('combobox'), 'en');

    expect(screen.getByTestId('activo')).toHaveTextContent('en');
    expect(screen.getByTestId('texto')).toHaveTextContent('Save');
  });

  it('también al italiano', async () => {
    montar();
    await userEvent.selectOptions(screen.getByRole('combobox'), 'it');
    expect(screen.getByTestId('texto')).toHaveTextContent('Salva');
  });

  it('tiene nombre accesible: el icono del globo no lo da', async () => {
    montar();
    expect(
      screen.getByRole('combobox', { name: /cambiar idioma/i }),
    ).toBeInTheDocument();
  });
});

describe('IdiomaProvider', () => {
  it('recuerda la elección entre visitas', async () => {
    montar();
    await userEvent.selectOptions(screen.getByRole('combobox'), 'it');

    expect(localStorage.getItem('optica_idioma')).toBe('it');

    cleanup();
    montar();
    expect(screen.getByTestId('activo')).toHaveTextContent('it');
  });

  it('sincroniza <html lang>, que es de donde lo leen los lectores de pantalla', async () => {
    montar();
    expect(document.documentElement.lang).toBe('es');

    await userEvent.selectOptions(screen.getByRole('combobox'), 'en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('un valor corrupto en el almacenamiento no rompe la aplicación', () => {
    localStorage.setItem('optica_idioma', 'klingon');
    montar();
    expect(screen.getByTestId('activo')).toHaveTextContent('es');
  });

  it('sin elección previa, arranca en el idioma del navegador', () => {
    // Es el punto de la funcionalidad: un paciente extranjero entra al
    // catálogo y lo ve en su idioma sin tener que buscar el selector.
    navegadorEn('it-IT');
    montar();
    expect(screen.getByTestId('activo')).toHaveTextContent('it');
    expect(screen.getByTestId('texto')).toHaveTextContent('Salva');
  });

  it('un navegador en un idioma que no servimos cae al español', () => {
    navegadorEn('fr-FR');
    montar();
    expect(screen.getByTestId('activo')).toHaveTextContent('es');
  });

  it('la elección guardada gana sobre el navegador', () => {
    navegadorEn('en-US');
    localStorage.setItem('optica_idioma', 'es');
    montar();
    expect(screen.getByTestId('activo')).toHaveTextContent('es');
  });

  it('usar el hook fuera del proveedor avisa con claridad', () => {
    // Sin esto el fallo sería un `undefined is not an object` sin pista alguna.
    expect(() => render(<Testigo />)).toThrow(/dentro de <IdiomaProvider>/);
  });
});
