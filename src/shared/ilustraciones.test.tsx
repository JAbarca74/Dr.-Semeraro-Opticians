// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup } from '@testing-library/react';
import { render, screen } from '../test/rtl';
import {
  BarraEtapa,
  Cargando,
  EstadoVacio,
  Exito,
  IlustracionLentes,
  SelloVerificacion,
  SpinnerLentes,
} from './ilustraciones';
import { LogoBuho } from './LogoBuho';

afterEach(cleanup);

describe('ilustraciones', () => {
  it('Cargando anuncia el texto como estado y lleva el spinner', () => {
    render(<Cargando>Cargando…</Cargando>);
    expect(screen.getByRole('status')).toHaveTextContent('Cargando…');
    expect(screen.getByTestId('spinner-lentes')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('SpinnerLentes acepta tamaño propio', () => {
    render(<SpinnerLentes className="h-8 w-14" />);
    expect(screen.getByTestId('spinner-lentes')).toHaveClass('h-8');
  });

  it('EstadoVacio conserva el texto y añade la ilustración decorativa', () => {
    render(<EstadoVacio>Sin datos</EstadoVacio>);
    expect(screen.getByText('Sin datos')).toBeInTheDocument();
    expect(screen.getByTestId('ilustracion-lentes')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
  });

  it('IlustracionLentes acepta clases propias', () => {
    render(<IlustracionLentes className="h-40 w-72" />);
    expect(screen.getByTestId('ilustracion-lentes')).toHaveClass('h-40');
  });

  it('SelloVerificacion distingue válido de inválido', () => {
    const { rerender } = render(<SelloVerificacion valido />);
    expect(screen.getByTestId('sello-valido')).toBeInTheDocument();
    rerender(<SelloVerificacion valido={false} className="h-5 w-5" />);
    expect(screen.getByTestId('sello-invalido')).toHaveClass('h-5');
  });

  it('Exito anuncia el mensaje y lleva el sello', () => {
    render(<Exito>Venta #1 cobrada</Exito>);
    expect(screen.getByRole('status')).toHaveTextContent('Venta #1 cobrada');
    expect(screen.getByTestId('sello-valido')).toBeInTheDocument();
  });

  it('BarraEtapa marca si la etapa fue alcanzada', () => {
    render(
      <>
        <BarraEtapa alcanzada indice={0} />
        <BarraEtapa alcanzada={false} indice={1} />
      </>,
    );
    const barras = screen.getAllByTestId('barra-etapa');
    expect(barras[0]).toHaveAttribute('data-alcanzada', 'true');
    expect(barras[1]).toHaveAttribute('data-alcanzada', 'false');
  });

  it('LogoBuho solo parpadea cuando se le pide', () => {
    const { container, rerender } = render(<LogoBuho />);
    expect(container.querySelector('.animate-parpadeo')).toBeNull();
    rerender(<LogoBuho parpadeo />);
    expect(container.querySelectorAll('.animate-parpadeo')).toHaveLength(2);
  });
});
