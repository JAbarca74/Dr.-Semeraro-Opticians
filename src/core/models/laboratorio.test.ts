import { describe, expect, it } from 'vitest';
import {
  EstadoOrden,
  ESTADOS_CERRADOS,
  destinosPermitidos,
  diasRetrasada,
  esTerminal,
  etiquetaEstado,
  fechaCorta,
  fechaHoraLarga,
  type OrdenLaboratorio,
} from './laboratorio';

const orden = (cambios: Partial<OrdenLaboratorio> = {}): OrdenLaboratorio => ({
  idOrdenLaboratorio: 42,
  idVenta: 7,
  laboratorioNombre: 'Óptica Lab CR',
  laboratorioContacto: null,
  laboratorioTelefono: null,
  estado: EstadoOrden.ENVIADO,
  estadoPrevio: null,
  especificaciones: 'Progresivos antirreflejo',
  fechaEstimadaEntrega: null,
  retrasadaDesde: null,
  createdAt: '2026-08-20T10:00:00.000Z',
  ...cambios,
});

describe('etiquetaEstado', () => {
  it('usa el vocabulario de CU-07, sin el guion bajo del enum', () => {
    expect(etiquetaEstado(EstadoOrden.EN_PROCESO)).toBe('En proceso');
    expect(etiquetaEstado(EstadoOrden.RECIBIDO)).toBe('Recibido en clínica');
    expect(etiquetaEstado(EstadoOrden.LISTO)).toBe('Listo para entrega');
  });

  it('devuelve el valor crudo si llegara un estado desconocido', () => {
    expect(etiquetaEstado('Entregado' as EstadoOrden)).toBe('Entregado');
  });
});

describe('destinosPermitidos', () => {
  it('avanza por el camino normal', () => {
    expect(destinosPermitidos(orden())).toEqual([
      EstadoOrden.EN_PROCESO,
      EstadoOrden.RETRASADO,
      EstadoOrden.CANCELADO,
    ]);
    expect(destinosPermitidos(orden({ estado: EstadoOrden.EN_PROCESO }))).toContain(
      EstadoOrden.RECIBIDO,
    );
  });

  it('EX-09: desde «En proceso» no ofrece «Listo»', () => {
    expect(
      destinosPermitidos(orden({ estado: EstadoOrden.EN_PROCESO })),
    ).not.toContain(EstadoOrden.LISTO);
  });

  it('una orden retrasada se reanuda por donde venía, nunca más adelante', () => {
    const retrasada = orden({
      estado: EstadoOrden.RETRASADO,
      estadoPrevio: EstadoOrden.EN_PROCESO,
    });
    const destinos = destinosPermitidos(retrasada);

    expect(destinos).toContain(EstadoOrden.EN_PROCESO);
    expect(destinos).toContain(EstadoOrden.RECIBIDO);
    expect(destinos).not.toContain(EstadoOrden.LISTO);
    expect(destinos).not.toContain(EstadoOrden.RETRASADO);
  });

  it('una orden retrasada sin estado previo se reanuda por el principio', () => {
    const destinos = destinosPermitidos(
      orden({ estado: EstadoOrden.RETRASADO, estadoPrevio: null }),
    );
    expect(destinos).toContain(EstadoOrden.ENVIADO);
    expect(destinos).toContain(EstadoOrden.EN_PROCESO);
  });

  it('los estados cerrados no ofrecen ningún destino', () => {
    for (const estado of ESTADOS_CERRADOS) {
      expect(destinosPermitidos(orden({ estado }))).toEqual([]);
    }
  });
});

describe('esTerminal', () => {
  it('marca «Listo» y «Cancelado» como terminales', () => {
    expect(esTerminal(orden({ estado: EstadoOrden.LISTO }))).toBe(true);
    expect(esTerminal(orden({ estado: EstadoOrden.CANCELADO }))).toBe(true);
  });

  it('una orden en curso no es terminal', () => {
    expect(esTerminal(orden({ estado: EstadoOrden.EN_PROCESO }))).toBe(false);
  });
});

describe('fechaCorta', () => {
  it('convierte la fecha del backend a formato local', () => {
    expect(fechaCorta('2026-09-05')).toBe('05/09/2026');
  });

  it('sin fecha muestra un guion, no «null»', () => {
    expect(fechaCorta(null)).toBe('—');
  });
});

describe('fechaHoraLarga', () => {
  it('incluye fecha y hora del cambio', () => {
    const texto = fechaHoraLarga('2026-08-20T15:30:00.000Z');
    expect(texto).toMatch(/2026/);
    expect(texto).toMatch(/:/);
  });
});

describe('diasRetrasada', () => {
  const ahora = new Date('2026-08-24T10:00:00.000Z');

  it('cuenta los días completos que lleva detenida', () => {
    const retrasada = orden({ retrasadaDesde: '2026-08-20T10:00:00.000Z' });
    expect(diasRetrasada(retrasada, ahora)).toBe(4);
  });

  it('menos de un día cuenta como cero', () => {
    const retrasada = orden({ retrasadaDesde: '2026-08-24T02:00:00.000Z' });
    expect(diasRetrasada(retrasada, ahora)).toBe(0);
  });

  it('nunca devuelve negativos', () => {
    const retrasada = orden({ retrasadaDesde: '2026-09-01T10:00:00.000Z' });
    expect(diasRetrasada(retrasada, ahora)).toBe(0);
  });

  it('una orden que no está retrasada no lleva días', () => {
    expect(diasRetrasada(orden())).toBe(0);
  });
});
