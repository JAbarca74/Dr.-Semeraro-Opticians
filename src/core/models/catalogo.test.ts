import { describe, expect, it } from 'vitest';
import {
  agregarAlApartado,
  construirMensajeApartado,
  enlaceWhatsapp,
  numeroLegible,
  totalApartado,
  type LineaApartado,
} from './catalogo';

const linea = (cambios: Partial<LineaApartado> = {}): LineaApartado => ({
  idProducto: 1,
  sku: 'RB-2140-51',
  nombre: 'Ray-Ban Wayfarer',
  marca: 'Ray-Ban',
  precio: 100,
  cantidad: 1,
  ...cambios,
});

const solicitante = { nombre: 'Ana Rojas', telefono: '8888-1111' };

describe('totalApartado', () => {
  it('suma cantidad por precio', () => {
    expect(totalApartado([linea({ cantidad: 2 }), linea({ idProducto: 2, precio: 50 })])).toBe(250);
  });

  it('un apartado vacío vale cero', () => {
    expect(totalApartado([])).toBe(0);
  });

  it('redondea a dos decimales', () => {
    expect(totalApartado([linea({ precio: 0.1, cantidad: 3 })])).toBe(0.3);
  });
});

describe('agregarAlApartado', () => {
  it('añade un producto nuevo', () => {
    expect(agregarAlApartado([], linea())).toHaveLength(1);
  });

  it('suma la cantidad si el producto ya estaba', () => {
    const apartado = agregarAlApartado([linea({ cantidad: 2 })], linea());
    expect(apartado).toHaveLength(1);
    expect(apartado[0].cantidad).toBe(3);
  });

  it('no toca las líneas de otros productos', () => {
    const apartado = agregarAlApartado(
      [linea({ idProducto: 1, cantidad: 2 }), linea({ idProducto: 2, cantidad: 1 })],
      linea({ idProducto: 2 }),
    );
    expect(apartado.find((l) => l.idProducto === 1)?.cantidad).toBe(2);
    expect(apartado.find((l) => l.idProducto === 2)?.cantidad).toBe(2);
  });
});

describe('construirMensajeApartado', () => {
  it('dice quién escribe y cómo contactarlo', () => {
    const mensaje = construirMensajeApartado([linea()], solicitante);
    expect(mensaje).toContain('Ana Rojas');
    expect(mensaje).toContain('8888-1111');
  });

  it('detalla cantidad, modelo, marca y SKU de cada línea', () => {
    const mensaje = construirMensajeApartado([linea({ cantidad: 2 })], solicitante);
    expect(mensaje).toContain('2 × Ray-Ban Wayfarer (Ray-Ban) — RB-2140-51');
  });

  it('incluye el total de referencia', () => {
    const mensaje = construirMensajeApartado([linea({ cantidad: 2 })], solicitante);
    expect(mensaje).toMatch(/Total de referencia:.*200/);
  });

  it('nombra la óptica cuando se le pasa', () => {
    const mensaje = construirMensajeApartado([linea()], solicitante, 'Óptica Dr. Semeraro');
    expect(mensaje).toContain('Óptica Dr. Semeraro');
  });

  it('sin nombre de óptica usa un genérico, no queda un hueco', () => {
    const mensaje = construirMensajeApartado([linea()], solicitante);
    expect(mensaje).toContain('la óptica');
  });

  it('recorta los espacios de los datos del solicitante', () => {
    const mensaje = construirMensajeApartado([linea()], {
      nombre: '  Ana Rojas  ',
      telefono: ' 8888-1111 ',
    });
    expect(mensaje).toContain('soy Ana Rojas (tel. 8888-1111)');
  });

  it('lista todas las líneas, no solo la primera', () => {
    const mensaje = construirMensajeApartado(
      [linea(), linea({ idProducto: 2, nombre: 'Oakley Pitch', marca: 'Oakley', sku: 'OK-1' })],
      solicitante,
    );
    expect(mensaje).toContain('Ray-Ban Wayfarer');
    expect(mensaje).toContain('Oakley Pitch');
  });
});

describe('enlaceWhatsapp', () => {
  it('deja el número solo en dígitos', () => {
    expect(enlaceWhatsapp('+506 8888-7777', 'hola')).toContain('wa.me/50688887777');
  });

  it('codifica el mensaje para que viaje en la URL', () => {
    const url = enlaceWhatsapp('50688887777', 'Hola, soy Ana\ny quiero esto');
    expect(url).toContain('text=');
    expect(url).not.toContain('\n');
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
