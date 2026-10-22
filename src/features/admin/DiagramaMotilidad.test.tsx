// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '../../test/rtl';
import { DiagramaMotilidad } from './DiagramaMotilidad';

describe('DiagramaMotilidad con teclado', () => {
  afterEach(() => cleanup());

  const posicionPrimaria = () => screen.getByLabelText(/OD posición primaria/);

  it('Enter y Espacio alternan la posición, igual que un clic', () => {
    const onChange = vi.fn();
    render(<DiagramaMotilidad ojo="OD" valor={{}} onChange={onChange} />);

    fireEvent.keyDown(posicionPrimaria(), { key: 'Enter' });
    expect(onChange).toHaveBeenLastCalledWith({ centro: 'normal' });

    fireEvent.keyDown(posicionPrimaria(), { key: ' ' });
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('ignora el resto de teclas', () => {
    const onChange = vi.fn();
    render(<DiagramaMotilidad ojo="OD" valor={{}} onChange={onChange} />);

    fireEvent.keyDown(posicionPrimaria(), { key: 'Tab' });
    expect(onChange).not.toHaveBeenCalled();
  });
});
