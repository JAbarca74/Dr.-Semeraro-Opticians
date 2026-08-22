import { describe, expect, it } from 'vitest';
import {
  construirMensajeConsulta,
  enlaceWhatsapp,
  numeroLegible,
  type ProductoVitrina,
} from './catalogo';
import { CategoriaProducto } from './inventario';

const producto = (cambios: Partial<ProductoVitrina> = {}): ProductoVitrina => ({
  idProducto: 1,
  sku: 'RB-2140-51',
  nombre: 'Ray-Ban Wayfarer',
  marca: 'Ray-Ban',
  categoria: CategoriaProducto.ARO,
  precio: 189.5,
  color: 'Negro',
  material: 'Acetato',
  calibre: null,
  indiceRefraccion: null,
  filtro: null,
  tratamiento: null,
  imagenUrl: null,
  ...cambios,
});

describe('construirMensajeConsulta', () => {
  it('CU-09 paso 8: incluye el nombre del producto en el mensaje', () => {
    expect(construirMensajeConsulta(producto())).toContain('Ray-Ban Wayfarer');
  });

  it('añade marca y SKU para que no se confunda con un modelo parecido', () => {
    const mensaje = construirMensajeConsulta(producto());
    expect(mensaje).toContain('Ray-Ban');
    expect(mensaje).toContain('RB-2140-51');
  });

  it('nombra la óptica cuando se le pasa', () => {
    expect(construirMensajeConsulta(producto(), 'Óptica Dr. Semeraro')).toContain(
      'Óptica Dr. Semeraro',
    );
  });

  it('sin nombre de óptica usa un genérico, no deja un hueco', () => {
    expect(construirMensajeConsulta(producto())).toContain('su catálogo');
  });

  it('NO lleva datos personales del visitante', () => {
    // La vista es informativa: la conversación la abre la persona desde su
    // propio WhatsApp, que ya aporta su número. Pedir nombre y teléfono sería
    // recoger datos personales sin necesidad.
    const mensaje = construirMensajeConsulta(producto());
    expect(mensaje).not.toMatch(/tel\.|teléfono|soy /i);
  });

  it('no menciona precio ni existencias', () => {
    const mensaje = construirMensajeConsulta(producto());
    expect(mensaje).not.toContain('189');
    expect(mensaje).not.toMatch(/stock|existencias/i);
  });
});

describe('enlaceWhatsapp', () => {
  it('deja el número solo en dígitos', () => {
    expect(enlaceWhatsapp('+506 8888-7777', 'hola')).toContain('wa.me/50688887777');
  });

  it('codifica el mensaje para que viaje en la URL', () => {
    const url = enlaceWhatsapp('50688887777', 'Hola, me interesa este modelo');
    expect(url).toContain('text=');
    expect(url).not.toContain(' ');
  });
});

describe('numeroLegible', () => {
  it('formatea un número tico quitando el código de país', () => {
    expect(numeroLegible('50688887777')).toBe('8888-7777');
  });

  it('formatea también uno ya local', () => {
    expect(numeroLegible('8888-7777')).toBe('8888-7777');
  });

  it('un número con otro largo se muestra tal cual, sin inventar formato', () => {
    expect(numeroLegible('+1 202 555 0100')).toBe('12025550100');
  });
});
