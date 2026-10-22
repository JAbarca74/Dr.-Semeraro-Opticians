// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const mockParametros = vi.fn();
vi.mock('./catalogo.service', () => ({
  parametrosPublicos: () => mockParametros(),
}));

import { useCanalContacto } from './contacto';

describe('useCanalContacto', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockParametros.mockReset();
  });

  it('si la API de parámetros falla, no revienta y avisa al intentar abrir', async () => {
    mockParametros.mockRejectedValue(new Error('sin red'));
    const { result } = renderHook(() => useCanalContacto());
    await waitFor(() => expect(mockParametros).toHaveBeenCalled());

    let abierto = true;
    act(() => {
      abierto = result.current.abrirWhatsapp('Hola');
    });
    expect(abierto).toBe(false);
    expect(result.current.nombreOptica).toBe('la óptica');
    expect(result.current.aviso).toMatch(/No se pudo abrir WhatsApp/);
  });

  it('limpiarAviso borra el aviso', async () => {
    mockParametros.mockResolvedValue({});
    const { result } = renderHook(() => useCanalContacto());
    await waitFor(() => expect(mockParametros).toHaveBeenCalled());

    act(() => {
      result.current.abrirWhatsapp('Hola');
    });
    expect(result.current.aviso).not.toBe('');
    act(() => result.current.limpiarAviso());
    expect(result.current.aviso).toBe('');
  });
});
