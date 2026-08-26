// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { descargarArchivo } from './descarga';

describe('descargarArchivo', () => {
  const createObjectURL = vi.fn(() => 'blob:mock');
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  const conEnlaceEspiado = (click: () => void, nombres: string[]) => {
    const original = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = original(tag) as HTMLAnchorElement;
      if (tag === 'a') {
        el.click = () => {
          nombres.push(el.download);
          click();
        };
      }
      return el;
    });
  };

  it('dispara el enlace con el nombre pedido y limpia lo que creó', () => {
    const nombres: string[] = [];
    const click = vi.fn();
    conEnlaceEspiado(click, nombres);

    descargarArchivo('metricas.pdf', new Blob(['%PDF'], { type: 'application/pdf' }));

    expect(click).toHaveBeenCalledOnce();
    expect(nombres).toEqual(['metricas.pdf']);
    expect(createObjectURL).toHaveBeenCalledOnce();
    // Ni URL viva ni enlace suelto: cada descarga dejaría basura si no.
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    expect(document.querySelector('a')).toBeNull();
  });
});
