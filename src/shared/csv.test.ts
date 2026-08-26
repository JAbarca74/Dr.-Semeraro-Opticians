// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { aCsv, celdaCsv, descargarCsv } from './csv';

describe('celdaCsv', () => {
  it('cita el valor y duplica las comillas internas', () => {
    expect(celdaCsv('dice "hola"')).toBe('"dice ""hola"""');
  });

  it('devuelve cadena vacía para null e undefined', () => {
    expect(celdaCsv(null)).toBe('');
    expect(celdaCsv(undefined)).toBe('');
  });

  it('serializa los objetos como JSON', () => {
    expect(celdaCsv({ telefono: '8888-0000' })).toBe(
      '"{""telefono"":""8888-0000""}"',
    );
  });

  it('convierte números y booleanos a texto', () => {
    expect(celdaCsv(12)).toBe('"12"');
    expect(celdaCsv(false)).toBe('"false"');
  });
});

describe('celdaCsv · inyección de fórmulas (`DSO-48`)', () => {
  it('neutraliza lo que empiece por «=», que Excel ejecutaría', () => {
    // Las comillas del RFC no bastan: Excel evalúa la celda igual.
    expect(celdaCsv('=1+1')).toBe(`"'=1+1"`);
  });

  it('también «+», «-» y «@»', () => {
    expect(celdaCsv('+A1')).toBe(`"'+A1"`);
    expect(celdaCsv('-5+3')).toBe(`"'-5+3"`);
    expect(celdaCsv('@SUM(A1)')).toBe(`"'@SUM(A1)"`);
  });

  it('un número negativo también se protege: es el precio de no ejecutar nada', () => {
    expect(celdaCsv(-12)).toBe(`"'-12"`);
  });

  it('el texto normal no se toca', () => {
    expect(celdaCsv('Armazón Ray-Ban')).toBe('"Armazón Ray-Ban"');
    expect(celdaCsv(758)).toBe('"758"');
  });
});

describe('aCsv', () => {
  it('arma encabezados y filas separados por CRLF', () => {
    const csv = aCsv(
      ['Fecha', 'Usuario'],
      [
        ['2026-08-04', 'admin@optica.local'],
        ['2026-08-03', null],
      ],
    );

    expect(csv).toBe(
      '"Fecha","Usuario"\r\n"2026-08-04","admin@optica.local"\r\n"2026-08-03",',
    );
  });

  it('sin filas deja solo el encabezado', () => {
    expect(aCsv(['Fecha'], [])).toBe('"Fecha"');
  });
});

describe('descargarCsv', () => {
  let ultimoBlob: Blob | null = null;
  const createObjectURL = vi.fn((blob: Blob) => {
    ultimoBlob = blob;
    return 'blob:mock';
  });
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    ultimoBlob = null;
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = revokeObjectURL;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('crea un enlace temporal, lo dispara y limpia lo que creó', () => {
    const click = vi.fn();
    const original = document.createElement.bind(document);
    const spy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tag: string) => {
        const el = original(tag) as HTMLAnchorElement;
        if (tag === 'a') el.click = click;
        return el;
      });

    descargarCsv('auditoria.csv', '"Fecha"\r\n"2026-08-04"');

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    // El enlace no debe quedar suelto en el documento.
    expect(document.querySelector('a')).toBeNull();

    spy.mockRestore();
  });

  it('antepone el BOM para que Excel muestre bien las tildes', () => {
    const original = document.createElement.bind(document);
    const spy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tag: string) => {
        const el = original(tag) as HTMLAnchorElement;
        if (tag === 'a') el.click = vi.fn();
        return el;
      });

    descargarCsv('auditoria.csv', 'á');

    // 'á' son 2 bytes en UTF-8 y el BOM otros 3.
    expect(ultimoBlob?.size).toBe(5);
    expect(ultimoBlob?.type).toContain('text/csv');

    spy.mockRestore();
  });
});
