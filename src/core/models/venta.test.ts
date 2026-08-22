import { describe, expect, it } from 'vitest';
import {
  EstadoVenta,
  agregarAlCarrito,
  etiquetaEstadoVenta,
  fechaHoraLarga,
  lineasSinExistencias,
  totalCarrito,
  type LineaCarrito,
} from './venta';

const linea = (cambios: Partial<LineaCarrito> = {}): LineaCarrito => ({
  idProducto: 1,
  sku: 'RB-2140-51',
  nombre: 'Ray-Ban Wayfarer',
  precio: 100,
  cantidad: 1,
  stockDisponible: 10,
  ...cambios,
});

describe('etiquetaEstadoVenta', () => {
  it('nombra los dos estados', () => {
    expect(etiquetaEstadoVenta(EstadoVenta.ACTIVA)).toBe('Activa');
    expect(etiquetaEstadoVenta(EstadoVenta.ANULADA)).toBe('Anulada');
  });

  it('devuelve el valor crudo si llegara uno desconocido', () => {
    expect(etiquetaEstadoVenta('devuelta' as EstadoVenta)).toBe('devuelta');
  });
});

describe('totalCarrito', () => {
  it('suma cantidad por precio de cada línea', () => {
    expect(totalCarrito([linea({ cantidad: 3 }), linea({ idProducto: 2, precio: 49.99, cantidad: 2 })])).toBe(399.98);
  });

  it('un carrito vacío vale cero', () => {
    expect(totalCarrito([])).toBe(0);
  });

  it('redondea a dos decimales en vez de arrastrar binario', () => {
    expect(totalCarrito([linea({ precio: 0.1, cantidad: 3 })])).toBe(0.3);
  });
});

describe('agregarAlCarrito', () => {
  it('añade un producto que no estaba', () => {
    const carrito = agregarAlCarrito([], linea());
    expect(carrito).toHaveLength(1);
  });

  it('consolida el mismo producto en vez de duplicar la línea', () => {
    const carrito = agregarAlCarrito([linea({ cantidad: 3 })], linea({ cantidad: 2 }));

    expect(carrito).toHaveLength(1);
    expect(carrito[0].cantidad).toBe(5);
  });

  it('no toca las líneas de otros productos', () => {
    const carrito = agregarAlCarrito(
      [linea({ idProducto: 1, cantidad: 3 }), linea({ idProducto: 2, cantidad: 1 })],
      linea({ idProducto: 2, cantidad: 4 }),
    );

    expect(carrito.find((l) => l.idProducto === 1)?.cantidad).toBe(3);
    expect(carrito.find((l) => l.idProducto === 2)?.cantidad).toBe(5);
  });
});

describe('lineasSinExistencias', () => {
  it('señala la línea que pide más de lo que hay', () => {
    const sin = lineasSinExistencias([
      linea({ cantidad: 11, stockDisponible: 10 }),
      linea({ idProducto: 2, cantidad: 2, stockDisponible: 10 }),
    ]);

    expect(sin).toHaveLength(1);
    expect(sin[0].idProducto).toBe(1);
  });

  it('pedir exactamente lo que queda sí se permite', () => {
    expect(lineasSinExistencias([linea({ cantidad: 10, stockDisponible: 10 })])).toEqual([]);
  });

  it('un carrito que cabe en bodega no señala nada', () => {
    expect(lineasSinExistencias([linea()])).toEqual([]);
  });
});

describe('fechaHoraLarga', () => {
  it('incluye fecha y hora de la venta', () => {
    const texto = fechaHoraLarga('2026-08-22T15:30:00.000Z');
    expect(texto).toMatch(/2026/);
    expect(texto).toMatch(/:/);
  });
});
