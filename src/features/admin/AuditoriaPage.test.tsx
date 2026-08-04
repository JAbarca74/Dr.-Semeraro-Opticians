// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuditoriaPage } from './AuditoriaPage';
import {
  listarAccesos,
  listarLogs,
  listarTablasAuditadas,
} from '../../core/api/auditoria.service';
import { listarUsuarios } from '../../core/api/usuarios.service';
import { descargarCsv } from '../../shared/csv';
import { OperacionAuditoria } from '../../core/models/auditoria';
import { Rol } from '../../core/models/rol';

vi.mock('../../core/api/auditoria.service');
vi.mock('../../core/api/usuarios.service');
vi.mock('../../shared/csv', async () => {
  const real =
    await vi.importActual<typeof import('../../shared/csv')>('../../shared/csv');
  return { ...real, descargarCsv: vi.fn() };
});

vi.mock('framer-motion', async () => {
  const react = await import('react');
  const PROPS_ANIMACION = ['initial', 'animate', 'exit', 'variants'];
  const stripProps = (props: any) =>
    Object.fromEntries(
      Object.entries(props).filter(([clave]) => !PROPS_ANIMACION.includes(clave)),
    );
  return {
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: {
      div: react.forwardRef((props: any, ref: any) => (
        <div ref={ref} {...stripProps(props)} />
      )),
      p: react.forwardRef((props: any, ref: any) => (
        <p ref={ref} {...stripProps(props)} />
      )),
      header: react.forwardRef((props: any, ref: any) => (
        <header ref={ref} {...stripProps(props)} />
      )),
    },
    stagger: {},
    fadeUp: {},
    fadeUpItem: {},
  };
});

const mockCambios = [
  {
    idLogAuditoria: '2',
    fecha: '2026-08-04T10:00:00.000Z',
    usuario: { idUsuario: 1, email: 'admin@optica.local' },
    tabla: 'persona',
    registroId: 12,
    operacion: OperacionAuditoria.UPDATE,
    valorAnterior: null,
    valorNuevo: { telefono: '8888-0000' },
    ip: '127.0.0.1',
  },
  {
    idLogAuditoria: '1',
    fecha: '2026-08-03T09:00:00.000Z',
    usuario: null,
    tabla: 'evaluacion_clinica',
    registroId: 5,
    operacion: OperacionAuditoria.INSERT,
    valorAnterior: { notas: 'previa' },
    valorNuevo: { notas: 'nueva' },
    ip: null,
  },
];

const mockAccesos = [
  {
    idBitacoraAcceso: 3,
    fecha: '2026-08-04T11:00:00.000Z',
    usuario: { idUsuario: 2, email: 'doctor@optica.local' },
    exitoso: false,
    ip: '10.0.0.5',
  },
];

const paginaCambios = {
  total: 2,
  pagina: 1,
  limite: 50,
  registros: mockCambios,
};
const paginaAccesos = {
  total: 1,
  pagina: 1,
  limite: 50,
  registros: mockAccesos,
};

/**
 * Los rótulos de los eventos («persona», «Modificación», el correo del usuario)
 * también aparecen en los `<select>` de filtros, así que las consultas se
 * acotan a la tabla para no chocar con las opciones.
 */
const celda = async (texto: string | RegExp) =>
  within(await screen.findByRole('table')).findByRole('cell', { name: texto });

describe('AuditoriaPage', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
    (listarLogs as any).mockResolvedValue(paginaCambios);
    (listarAccesos as any).mockResolvedValue(paginaAccesos);
    (listarTablasAuditadas as any).mockResolvedValue([
      'evaluacion_clinica',
      'persona',
    ]);
    (listarUsuarios as any).mockResolvedValue([
      {
        idUsuario: 1,
        idPersona: 10,
        email: 'admin@optica.local',
        rol: Rol.ADMINISTRADOR,
        activo: true,
      },
    ]);
  });

  afterEach(() => cleanup());

  describe('1. Carga inicial', () => {
    it('CU-08 paso 2: pide los últimos 50 eventos y los muestra', async () => {
      render(<AuditoriaPage />);

      await waitFor(() =>
        expect(listarLogs).toHaveBeenCalledWith(
          expect.objectContaining({ limite: 50, pagina: 1 }),
        ),
      );
      expect(await celda('persona')).toBeInTheDocument();
      expect(await celda('evaluacion_clinica')).toBeInTheDocument();
      expect(await celda('admin@optica.local')).toBeInTheDocument();
    });

    it('Traduce la operación al español y marca como «Sistema» el evento sin autor', async () => {
      render(<AuditoriaPage />);

      expect(await celda('Modificación')).toBeInTheDocument();
      expect(await celda('Creación')).toBeInTheDocument();
      expect(await celda('Sistema')).toBeInTheDocument();
    });

    it('EX-10: sin coincidencias muestra «No se encontraron registros»', async () => {
      (listarLogs as any).mockResolvedValue({
        total: 0,
        pagina: 1,
        limite: 50,
        registros: [],
      });

      render(<AuditoriaPage />);

      expect(
        await screen.findByText('No se encontraron registros.'),
      ).toBeInTheDocument();
    });

    it('Si la consulta falla, muestra el mensaje de error', async () => {
      (listarLogs as any).mockRejectedValue(new Error('boom'));

      render(<AuditoriaPage />);

      expect(
        await screen.findByText(/No se pudo consultar la auditoría/i),
      ).toBeInTheDocument();
    });
  });

  describe('2. Filtros', () => {
    it('CU-08 pasos 3 y 4: filtrar por tabla vuelve a consultar con ese filtro', async () => {
      render(<AuditoriaPage />);
      await celda('persona');

      await user.selectOptions(screen.getByLabelText('Tabla'), 'persona');

      await waitFor(() =>
        expect(listarLogs).toHaveBeenLastCalledWith(
          expect.objectContaining({ tabla: 'persona' }),
        ),
      );
    });

    it('Filtrar por usuario manda el identificador numérico', async () => {
      render(<AuditoriaPage />);
      await celda('persona');

      await user.selectOptions(screen.getByLabelText('Usuario'), '1');

      await waitFor(() =>
        expect(listarLogs).toHaveBeenLastCalledWith(
          expect.objectContaining({ idUsuario: 1 }),
        ),
      );
    });

    it('Limpiar filtros vuelve a la consulta sin criterios', async () => {
      render(<AuditoriaPage />);
      await celda('persona');
      await user.selectOptions(screen.getByLabelText('Tabla'), 'persona');

      await user.click(screen.getByRole('button', { name: /limpiar filtros/i }));

      await waitFor(() =>
        expect(listarLogs).toHaveBeenLastCalledWith(
          expect.objectContaining({ tabla: undefined, idUsuario: undefined }),
        ),
      );
    });
  });

  describe('3. Detalle del evento', () => {
    it('CU-08 pasos 5 y 6: al hacer clic muestra el valor nuevo del registro', async () => {
      render(<AuditoriaPage />);

      await user.click(await celda('persona'));

      expect(await screen.findByText('Detalle del evento')).toBeInTheDocument();
      expect(screen.getByText(/8888-0000/)).toBeInTheDocument();
    });

    it('Avisa cuando el sistema no conservó el valor previo', async () => {
      render(<AuditoriaPage />);

      await user.click(await celda('persona'));

      expect(
        await screen.findByText(
          'El sistema aún no conserva el valor previo de esta operación.',
        ),
      ).toBeInTheDocument();
    });

    it('Muestra el valor anterior cuando sí existe', async () => {
      render(<AuditoriaPage />);

      await user.click(await celda('evaluacion_clinica'));

      expect(await screen.findByText(/"previa"/)).toBeInTheDocument();
    });

    it('El botón de cerrar oculta el detalle', async () => {
      render(<AuditoriaPage />);
      await user.click(await celda('persona'));
      await screen.findByText('Detalle del evento');

      await user.click(screen.getByLabelText('Cerrar detalle'));

      expect(screen.queryByText('Detalle del evento')).not.toBeInTheDocument();
    });
  });

  describe('4. Bitácora de accesos', () => {
    it('Cambiar de vista consulta los accesos y marca el intento fallido', async () => {
      render(<AuditoriaPage />);
      await celda('persona');

      await user.click(
        screen.getByRole('button', { name: /accesos al sistema/i }),
      );

      await waitFor(() => expect(listarAccesos).toHaveBeenCalled());
      expect(await screen.findByText('Fallido')).toBeInTheDocument();
      expect(screen.getByText('doctor@optica.local')).toBeInTheDocument();
    });

    it('El filtro «solo fallidos» viaja como exitoso=false', async () => {
      render(<AuditoriaPage />);
      await user.click(
        screen.getByRole('button', { name: /accesos al sistema/i }),
      );
      await screen.findByText('Fallido');

      await user.selectOptions(screen.getByLabelText('Resultado'), 'fallidos');

      await waitFor(() =>
        expect(listarAccesos).toHaveBeenLastCalledWith(
          expect.objectContaining({ exitoso: false }),
        ),
      );
    });
  });

  describe('5. Exportación', () => {
    it('Flujo alterno: «Descargar reporte» genera el CSV de la vista actual', async () => {
      render(<AuditoriaPage />);
      await celda('persona');

      await user.click(
        screen.getByRole('button', { name: /descargar reporte/i }),
      );

      expect(descargarCsv).toHaveBeenCalledOnce();
      const [nombre, contenido] = (descargarCsv as any).mock.calls[0];
      expect(nombre).toMatch(/^auditoria-cambios-\d{4}-\d{2}-\d{2}\.csv$/);
      expect(contenido).toContain('"Valor anterior"');
      expect(contenido).toContain('admin@optica.local');
    });

    it('En la vista de accesos exporta el archivo de accesos', async () => {
      render(<AuditoriaPage />);
      await user.click(
        screen.getByRole('button', { name: /accesos al sistema/i }),
      );
      await screen.findByText('Fallido');

      await user.click(
        screen.getByRole('button', { name: /descargar reporte/i }),
      );

      const [nombre, contenido] = (descargarCsv as any).mock.calls[0];
      expect(nombre).toMatch(/^auditoria-accesos-/);
      expect(contenido).toContain('"Fallido"');
    });

    it('Sin registros el botón de descarga queda deshabilitado', async () => {
      (listarLogs as any).mockResolvedValue({
        total: 0,
        pagina: 1,
        limite: 50,
        registros: [],
      });

      render(<AuditoriaPage />);

      await screen.findByText('No se encontraron registros.');
      expect(
        screen.getByRole('button', { name: /descargar reporte/i }),
      ).toBeDisabled();
    });
  });
});
