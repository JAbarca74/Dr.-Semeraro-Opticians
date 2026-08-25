import { describe, expect, it } from 'vitest';
import {
  ETAPAS_PEDIDO,
  construirMensajePedido,
  fechaCorta,
  refraccionLegible,
  type PedidoPaciente,
} from './portal';

const pedido = (cambios: Partial<PedidoPaciente> = {}): PedidoPaciente => ({
  idOrdenLaboratorio: 7,
  idVenta: 12,
  fechaSolicitud: '2026-08-20T10:00:00Z',
  laboratorio: 'Óptica Lab CR',
  especificaciones: 'Monofocal antirreflejo',
  etapa: 'En fabricación',
  indiceEtapa: 1,
  fechaEstimadaEntrega: '2026-09-11',
  retrasado: false,
  actualizadoAl: '2026-08-24T18:00:00Z',
  ...cambios,
});

describe('ETAPAS_PEDIDO', () => {
  it('son exactamente las cuatro que promete CU-14, en orden', () => {
    expect(ETAPAS_PEDIDO).toEqual([
      'Recibido',
      'En fabricación',
      'Listo para retirar',
      'Entregado',
    ]);
  });
});

describe('construirMensajePedido', () => {
  it('lleva el número de pedido, como pide el flujo alterno de CU-14', () => {
    const m = construirMensajePedido(pedido(), 'Óptica Dr. Semeraro');
    expect(m).toContain('n.º 7');
  });

  it('nombra la óptica y la etapa en que está', () => {
    const m = construirMensajePedido(pedido(), 'Óptica Dr. Semeraro');
    expect(m).toContain('Óptica Dr. Semeraro');
    expect(m).toContain('En fabricación');
  });

  it('sin nombre de óptica usa un genérico', () => {
    expect(construirMensajePedido(pedido())).toContain('la óptica');
  });
});

describe('fechaCorta', () => {
  it('formatea a día/mes/año', () => {
    expect(fechaCorta('2026-09-11')).toBe('11/09/2026');
  });

  it('sin fecha devuelve una raya, no «null»', () => {
    expect(fechaCorta(null)).toBe('—');
  });
});

describe('refraccionLegible', () => {
  it('escribe esfera, cilindro y eje con dos decimales', () => {
    const texto = refraccionLegible({
      ojo: 'OD',
      esfera: -1.25,
      cilindro: -0.5,
      eje: 180,
      adicion: null,
    });
    expect(texto).toBe('Esf -1.25 · Cil -0.50 · Eje 180°');
  });

  it('añade la adición solo cuando existe', () => {
    const texto = refraccionLegible({
      ojo: 'OI',
      esfera: -1,
      cilindro: -0.75,
      eje: 175,
      adicion: 1,
    });
    expect(texto).toContain('Add 1.00');
  });
});
