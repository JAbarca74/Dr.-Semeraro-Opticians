// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { cleanup, render, screen, within } from '../../test/rtl';
import { HomePage } from './HomePage';
import {
  FOTO_FACHADA,
  FOTO_MONTURAS,
  FOTOS_CONSULTORIO,
  UBICACION_OPTICA,
  CONTACTO_OPTICA,
} from './inicio.config';

afterEach(cleanup);

const pintar = () =>
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );

describe('Inicio de la óptica', () => {
  it('conserva las secciones aprobadas, añade contacto y mantiene un H1 y los servicios aprobados', () => {
    const { container } = pintar();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Óptica Dr. Luigi Semeraro',
    );
    expect(container.querySelectorAll('section')).toHaveLength(5);
    expect(
      screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent),
    ).toEqual([
      'Nuestros servicios',
      'Conoce nuestro consultorio',
      'Encuéntranos',
      'Contáctanos',
    ]);
    for (const nombre of [
      'Cuidado ocular primario',
      'Lentes de contacto especiales',
      'Terapia visual',
      'Optometría pediátrica',
    ]) {
      expect(screen.getByRole('heading', { name: nombre })).toBeInTheDocument();
    }
    const servicios = screen.getByRole('region', {
      name: 'Nuestros servicios',
    });
    expect(
      within(servicios).getByText('Variedad y calidad para tu visión'),
    ).toBeInTheDocument();
    expect(within(servicios).queryAllByRole('link')).toHaveLength(0);
    expect(within(servicios).queryAllByRole('button')).toHaveLength(0);
    expect(container.textContent).not.toMatch(
      /La estética de la precisión|Ecosistema digital|Aliados oficiales/,
    );
  });

  it('agenda por la ruta existente y ambos accesos a Maps comparten el destino confirmado', () => {
    pintar();
    expect(screen.getByRole('link', { name: /agendar cita/i })).toHaveAttribute(
      'href',
      '/agendar',
    );
    const mapas = screen.getAllByRole('link', { name: /cómo llegar/i });
    expect(mapas).toHaveLength(2);
    mapas.forEach((link) => {
      expect(link).toHaveAttribute('href', UBICACION_OPTICA.mapsUrl);
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
    expect(
      screen.getByTitle('Ubicación de la óptica en Zoetry Medical Center'),
    ).toHaveAttribute('src', UBICACION_OPTICA.embedUrl);
    expect(
      screen.getByTitle('Ubicación de la óptica en Zoetry Medical Center'),
    ).toHaveAttribute('loading', 'lazy');
  });

  it('integra las cinco fotos locales y conserva la carga diferida de galería y fachada', () => {
    const { container } = pintar();
    const fotos = screen.getAllByRole('img');
    expect(fotos).toHaveLength(6);
    const presentacion = screen.getByRole('region', {
      name: 'Óptica Dr. Luigi Semeraro',
    });
    const principal = within(presentacion).getByRole('img', {
      name: 'Exhibidor de monturas en la óptica',
    });
    expect(principal).toHaveAttribute('src', FOTO_MONTURAS);
    expect(principal).toHaveAttribute('width', '1672');
    expect(principal).toHaveAttribute('height', '941');
    expect(principal).toHaveAttribute('fetchpriority', 'high');
    expect(principal).not.toHaveAttribute('loading', 'lazy');
    expect(container.querySelector('img[src*="unsplash"]')).toBeNull();
    const consultorio = screen.getByRole('region', {
      name: 'Conoce nuestro consultorio',
    });
    const clinicas = within(consultorio).getAllByRole('img');
    expect(clinicas.map((foto) => foto.getAttribute('src'))).toEqual(
      FOTOS_CONSULTORIO.map((foto) => foto.src),
    );
    clinicas.forEach((foto) => {
      expect(foto).toHaveAttribute('loading', 'lazy');
      expect(foto).toHaveAttribute('width');
      expect(foto).toHaveAttribute('height');
    });
    const ubicacion = screen.getByRole('region', { name: 'Encuéntranos' });
    expect(within(ubicacion).getByRole('img')).toHaveAttribute(
      'src',
      FOTO_FACHADA,
    );
  });
  it('incluye el búho institucional, el ancla interna y los contactos proporcionados', () => {
    pintar();
    const presentacion = screen.getByRole('region', {
      name: 'Óptica Dr. Luigi Semeraro',
    });
    expect(
      within(presentacion)
        .getByRole('img', { name: 'Óptica Dr. Luigi Semeraro' })
        .tagName.toLowerCase(),
    ).toBe('svg');
    const acceso = within(presentacion).getByRole('link', {
      name: 'CONTÁCTANOS',
    });
    expect(acceso).toHaveAttribute('href', '#contactanos');
    expect(acceso).not.toHaveAttribute('target');
    const contacto = screen.getByRole('region', { name: 'Contáctanos' });
    expect(contacto).toHaveAttribute('id', 'contactanos');
    expect(
      within(contacto).getByRole('link', { name: /WhatsApp 7085 3353/ }),
    ).toHaveAttribute('href', 'https://wa.me/50670853353?text=');
    expect(
      within(contacto).getByRole('link', { name: /odsemeraro@icloud.com/ }),
    ).toHaveAttribute('href', 'mailto:odsemeraro@icloud.com');
    expect(
      within(contacto).getByRole('link', { name: /Facebook/ }),
    ).toHaveAttribute('href', CONTACTO_OPTICA.facebook);
    expect(
      within(contacto).getByRole('link', { name: /Instagram/ }),
    ).toHaveAttribute('href', CONTACTO_OPTICA.instagram);
  });
});
