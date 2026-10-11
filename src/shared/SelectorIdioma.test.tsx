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

/** Abre el menú y elige la opción por su nombre. */
const elegirIdioma = async (nombre: string) => {
  await userEvent.click(screen.getByRole('combobox'));
  await userEvent.click(screen.getByRole('option', { name: nombre }));
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
    await userEvent.click(screen.getByRole('combobox'));

    expect(
      await screen.findByRole('option', { name: 'Español' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'English' })).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'Italiano' }),
    ).toBeInTheDocument();
  });

  it('empieza cerrado y marca el idioma activo al abrir', async () => {
    montar();
    expect(screen.queryByRole('listbox')).toBeNull();

    await userEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('combobox')).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    expect(screen.getByRole('option', { name: 'Español' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('option', { name: 'English' })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('un segundo clic en el botón lo cierra', async () => {
    montar();
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('combobox'));
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('un clic fuera lo cierra sin cambiar el idioma', async () => {
    montar();
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByTestId('texto'));
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByTestId('activo')).toHaveTextContent('es');
  });

  it('se maneja con teclado: abre, navega, elige y devuelve el foco', async () => {
    montar();
    screen.getByRole('combobox').focus();

    await userEvent.keyboard('{ArrowDown}'); // abre
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await userEvent.keyboard('{ArrowDown}'); // es -> en
    await userEvent.keyboard('{Enter}');

    expect(screen.getByTestId('activo')).toHaveTextContent('en');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByRole('combobox')).toHaveFocus();
  });

  it('Inicio, Fin, flecha arriba (con vuelta) y Espacio', async () => {
    montar();
    screen.getByRole('combobox').focus();
    await userEvent.keyboard('{Enter}'); // abre sobre «es»
    await userEvent.keyboard('{ArrowUp}'); // vuelve al último
    expect(
      screen.getByRole('combobox').getAttribute('aria-activedescendant'),
    ).toMatch(/-it$/);
    await userEvent.keyboard('{Home}');
    expect(
      screen.getByRole('combobox').getAttribute('aria-activedescendant'),
    ).toMatch(/-es$/);
    await userEvent.keyboard('{End}');
    await userEvent.keyboard(' ');
    expect(screen.getByTestId('activo')).toHaveTextContent('it');
  });

  it('Escape cierra sin elegir y Tab también', async () => {
    montar();
    screen.getByRole('combobox').focus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(screen.getByTestId('activo')).toHaveTextContent('es');

    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    await userEvent.keyboard('{Tab}');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('las teclas ajenas con el menú cerrado no lo abren', async () => {
    montar();
    screen.getByRole('combobox').focus();
    await userEvent.keyboard('a');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('el ratón resalta la opción bajo el puntero', async () => {
    montar();
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.hover(screen.getByRole('option', { name: 'English' }));
    expect(
      screen.getByRole('combobox').getAttribute('aria-activedescendant'),
    ).toMatch(/-en$/);
  });

  it('es un control de verdad: cambiarlo traduce la pantalla', async () => {
    // El `ES / EN` anterior era un <span> de adorno. Esto verifica lo contrario.
    montar();
    expect(screen.getByTestId('texto')).toHaveTextContent('Guardar');

    await elegirIdioma('English');

    expect(screen.getByTestId('activo')).toHaveTextContent('en');
    expect(screen.getByTestId('texto')).toHaveTextContent('Save');
  });

  it('también al italiano', async () => {
    montar();
    await elegirIdioma('Italiano');
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
    await elegirIdioma('Italiano');

    expect(localStorage.getItem('optica_idioma')).toBe('it');

    cleanup();
    montar();
    expect(screen.getByTestId('activo')).toHaveTextContent('it');
  });

  it('sincroniza <html lang>, que es de donde lo leen los lectores de pantalla', async () => {
    montar();
    expect(document.documentElement.lang).toBe('es');

    await elegirIdioma('English');
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
