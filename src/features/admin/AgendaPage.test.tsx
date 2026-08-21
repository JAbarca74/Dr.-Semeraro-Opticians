// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgendaPage } from './AgendaPage';
import { listarPersonas } from '../../core/api/personas.service';
import {
  cambiarEstadoCita,
  crearCita,
  crearDisponibilidad,
  cuposDe,
  desactivarDisponibilidad,
  listarCitas,
  listarDisponibilidad,
  reprogramarCita,
} from '../../core/api/agenda.service';
import {
  generarRecordatorios,
  marcarRecordatorioEnviado,
} from '../../core/api/whatsapp.service';
import { TipoPersona } from '../../core/models/persona';
import { Rol } from '../../core/models/rol';
import { EstadoCita } from '../../core/models/agenda';
import { EstadoEnvio, TipoComunicacion } from '../../core/models/whatsapp';

vi.mock('../../core/api/personas.service');
vi.mock('../../core/api/agenda.service');
vi.mock('../../core/api/whatsapp.service');

const mockHasRole = vi.fn();
vi.mock('../../core/auth/auth.context', () => ({
  useAuth: () => ({ hasRole: mockHasRole }),
}));

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
      div: react.forwardRef((props: any, ref: any) => <div ref={ref} {...stripProps(props)} />),
      p: react.forwardRef((props: any, ref: any) => <p ref={ref} {...stripProps(props)} />),
      header: react.forwardRef((props: any, ref: any) => (
        <header ref={ref} {...stripProps(props)} />
      )),
    },
    stagger: {},
    fadeUp: {},
    fadeUpItem: {},
  };
});

const personas = [
  {
    idPersona: 7,
    cedula: '1-1111-1111',
    nombre: 'Dra. Elena Solís',
    tipo: TipoPersona.EMPLEADO,
  },
  {
    idPersona: 5,
    cedula: '2-2222-2222',
    nombre: 'Juan Pérez',
    tipo: TipoPersona.PACIENTE,
  },
];

/** Lunes 08:00–10:00, cupos de 30 min. El 2026-08-24 fue lunes. */
const bloqueLunes = {
  idDisponibilidadMedica: 1,
  idEmpleado: 7,
  diaSemana: 1,
  horaInicio: '08:00:00',
  horaFin: '10:00:00',
  duracionMin: 30,
  activo: true,
};

const LUNES = '2026-08-24';

const citaDe9 = {
  idCita: 10,
  idPaciente: 5,
  idDisponibilidad: 1,
  fechaHora: `${LUNES}T09:00:00`,
  estado: EstadoCita.CONFIRMADA,
  telefono: '8710-1122',
  motivo: 'Control anual',
};

const cupos = [
  { hora: '08:00', ocupado: false, idCita: null },
  { hora: '08:30', ocupado: false, idCita: null },
  { hora: '09:00', ocupado: true, idCita: 10 },
  { hora: '09:30', ocupado: false, idCita: null },
];

/**
 * Sitúa el reloj en el lunes de referencia: la página abre en «hoy», y de ese
 * día depende qué bloques tienen cupos. `shouldAdvanceTime` deja que el tiempo
 * siga corriendo solo, que es lo que necesitan `findBy*` y `userEvent` para no
 * quedarse esperando para siempre.
 */
const fijarLunes = () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(new Date(`${LUNES}T07:00:00`));
};

beforeEach(() => {
  vi.clearAllMocks();
  fijarLunes();
  // Por defecto, quien mira es Doctor o Administrador: ve las dos pestañas.
  mockHasRole.mockReturnValue(true);
  vi.mocked(listarPersonas).mockResolvedValue(personas as never);
  vi.mocked(listarDisponibilidad).mockResolvedValue([bloqueLunes] as never);
  vi.mocked(listarCitas).mockResolvedValue([citaDe9] as never);
  vi.mocked(cuposDe).mockResolvedValue(cupos as never);
});

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

/** userEvent necesita su propio avance de reloj cuando los timers son falsos. */
const usuario = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

describe('AgendaPage', () => {
  describe('1. Calendario del día — CU-05 paso 2', () => {
    it('pinta los cupos del bloque que atiende ese día', async () => {
      render(<AgendaPage />);
      expect(await screen.findByText(/Calendario del día/i)).toBeInTheDocument();
      expect(await screen.findByRole('button', { name: /08:00 Libre/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /09:30 Libre/i })).toBeInTheDocument();
    });

    it('marca ocupado el cupo que ya tiene cita y lo deja sin pulsar', async () => {
      render(<AgendaPage />);
      const ocupado = await screen.findByRole('button', { name: /09:00 Ocupado/i });
      expect(ocupado).toBeDisabled();
    });

    it('avisa cuando ese día no hay atención configurada', async () => {
      vi.mocked(listarDisponibilidad).mockResolvedValue([
        { ...bloqueLunes, diaSemana: 3 },
      ] as never);
      render(<AgendaPage />);
      expect(
        await screen.findByText(/No hay atención configurada para este día/i),
      ).toBeInTheDocument();
    });

    it('no ofrece cupos de un bloque inhabilitado', async () => {
      vi.mocked(listarDisponibilidad).mockResolvedValue([
        { ...bloqueLunes, activo: false },
      ] as never);
      render(<AgendaPage />);
      await waitFor(() =>
        expect(screen.queryByRole('button', { name: /08:00/i })).not.toBeInTheDocument(),
      );
    });
  });

  describe('2. Alta de cita — CU-05 pasos 3, 4 y 5', () => {
    it('el formulario aparece solo al elegir un cupo libre', async () => {
      const user = usuario();
      render(<AgendaPage />);
      expect(screen.queryByText(/Nueva cita —/i)).not.toBeInTheDocument();
      await user.click(await screen.findByRole('button', { name: /08:30 Libre/i }));
      expect(await screen.findByText(/Nueva cita —.*08:30/i)).toBeInTheDocument();
    });

    it('pide paciente, teléfono y motivo, como el paso 4', async () => {
      const user = usuario();
      render(<AgendaPage />);
      await user.click(await screen.findByRole('button', { name: /08:00 Libre/i }));
      expect(await screen.findByLabelText(/Paciente/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Teléfono de contacto/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Motivo/i)).toBeInTheDocument();
    });

    it('guarda la cita con la fecha y el cupo elegidos', async () => {
      const user = usuario();
      vi.mocked(crearCita).mockResolvedValue(citaDe9 as never);
      render(<AgendaPage />);
      await user.click(await screen.findByRole('button', { name: /08:30 Libre/i }));
      await user.selectOptions(await screen.findByLabelText(/Paciente/i), '5');
      await user.type(screen.getByLabelText(/Teléfono de contacto/i), '8710-1122');
      await user.click(screen.getByRole('button', { name: /Guardar cita/i }));

      await waitFor(() =>
        expect(crearCita).toHaveBeenCalledWith(
          expect.objectContaining({
            idPaciente: 5,
            idDisponibilidad: 1,
            fechaHora: `${LUNES}T08:30:00`,
          }),
        ),
      );
    });

    it('muestra el error del servidor si el cupo se ocupó mientras tanto (EX-06)', async () => {
      const user = usuario();
      vi.mocked(crearCita).mockRejectedValue({
        response: { data: { message: 'Ese cupo ya está ocupado por la cita #7.' } },
      });
      render(<AgendaPage />);
      await user.click(await screen.findByRole('button', { name: /08:30 Libre/i }));
      await user.selectOptions(await screen.findByLabelText(/Paciente/i), '5');
      await user.type(screen.getByLabelText(/Teléfono de contacto/i), '8710-1122');
      await user.click(screen.getByRole('button', { name: /Guardar cita/i }));

      expect(await screen.findByText(/ya está ocupado/i)).toBeInTheDocument();
    });

    it('cancelar cierra el formulario sin guardar', async () => {
      const user = usuario();
      render(<AgendaPage />);
      await user.click(await screen.findByRole('button', { name: /08:30 Libre/i }));
      await user.click(await screen.findByRole('button', { name: /Cancelar/i }));
      await waitFor(() =>
        expect(screen.queryByText(/Nueva cita —/i)).not.toBeInTheDocument(),
      );
      expect(crearCita).not.toHaveBeenCalled();
    });
  });

  describe('3. Reprogramación — mueve el cupo, no la etiqueta', () => {
    it('al pulsar Reprogramada pide elegir el cupo destino', async () => {
      const user = usuario();
      render(<AgendaPage />);
      await user.click(await screen.findByRole('button', { name: /Reprogramada/i }));
      expect(await screen.findByText(/Moviendo la cita de/i)).toBeInTheDocument();
      expect(cambiarEstadoCita).not.toHaveBeenCalled();
    });

    it('el clic en un cupo libre manda la nueva fecha y hora', async () => {
      const user = usuario();
      vi.mocked(reprogramarCita).mockResolvedValue(citaDe9 as never);
      render(<AgendaPage />);
      await user.click(await screen.findByRole('button', { name: /Reprogramada/i }));
      await user.click(await screen.findByRole('button', { name: /09:30 Libre/i }));

      await waitFor(() =>
        expect(reprogramarCita).toHaveBeenCalledWith(10, {
          nuevaFechaHora: `${LUNES}T09:30:00`,
          idDisponibilidad: 1,
        }),
      );
    });

    it('se puede desistir del movimiento', async () => {
      const user = usuario();
      render(<AgendaPage />);
      await user.click(await screen.findByRole('button', { name: /Reprogramada/i }));
      const aviso = await screen.findByText(/Moviendo la cita de/i);
      await user.click(within(aviso.closest('div')!).getByRole('button', { name: /Cancelar/i }));
      await waitFor(() => expect(reprogramarCita).not.toHaveBeenCalled());
    });
  });

  describe('4. Cambios de estado', () => {
    it('cancelar una cita llama al servicio', async () => {
      const user = usuario();
      vi.mocked(cambiarEstadoCita).mockResolvedValue(citaDe9 as never);
      render(<AgendaPage />);
      await user.click(await screen.findByRole('button', { name: /Cancelada/i }));
      await waitFor(() =>
        expect(cambiarEstadoCita).toHaveBeenCalledWith(10, EstadoCita.CANCELADA),
      );
    });

    it('muestra el estado de cada cita en la tabla', async () => {
      render(<AgendaPage />);
      expect(await screen.findByText('Confirmada')).toBeInTheDocument();
      expect(screen.getByText('Control anual')).toBeInTheDocument();
    });

    it('avisa cuando no hay citas ese día', async () => {
      vi.mocked(listarCitas).mockResolvedValue([] as never);
      render(<AgendaPage />);
      expect(await screen.findByText(/Sin citas para esta fecha/i)).toBeInTheDocument();
    });
  });

  describe('5. Recordatorios — CU-05 pasos 7 y 8', () => {
    const recordatorio = {
      idComunicacionWhatsapp: 1,
      idPaciente: 5,
      idCita: 10,
      idInteraccionIa: null,
      tipo: TipoComunicacion.RECORDATORIO,
      mensaje: 'Le recordamos su cita en Óptica Dr. Semeraro…',
      estadoEnvio: EstadoEnvio.PENDIENTE,
      enviadoEn: null,
      urlWhatsapp: 'https://wa.me/87101122?text=Le%20recordamos',
    };

    it('prepara los recordatorios y ofrece el enlace de WhatsApp', async () => {
      const user = usuario();
      vi.mocked(generarRecordatorios).mockResolvedValue([recordatorio] as never);
      render(<AgendaPage />);
      await user.click(
        await screen.findByRole('button', { name: /Preparar recordatorios/i }),
      );
      const enlace = await screen.findByRole('link', { name: /Abrir en WhatsApp/i });
      expect(enlace).toHaveAttribute('href', recordatorio.urlWhatsapp);
    });

    it('nacen pendientes: nadie los ha mandado todavía', async () => {
      const user = usuario();
      vi.mocked(generarRecordatorios).mockResolvedValue([recordatorio] as never);
      render(<AgendaPage />);
      await user.click(
        await screen.findByRole('button', { name: /Preparar recordatorios/i }),
      );
      expect(await screen.findByText('pendiente')).toBeInTheDocument();
    });

    it('marcar enviado actualiza la fila', async () => {
      const user = usuario();
      vi.mocked(generarRecordatorios).mockResolvedValue([recordatorio] as never);
      vi.mocked(marcarRecordatorioEnviado).mockResolvedValue({
        ...recordatorio,
        estadoEnvio: EstadoEnvio.ENVIADO,
      } as never);
      render(<AgendaPage />);
      await user.click(
        await screen.findByRole('button', { name: /Preparar recordatorios/i }),
      );
      await user.click(await screen.findByRole('button', { name: /Marcar enviado/i }));
      expect(await screen.findByText('enviado')).toBeInTheDocument();
    });

    it('avisa cuando no hay nada que recordar', async () => {
      const user = usuario();
      vi.mocked(generarRecordatorios).mockResolvedValue([] as never);
      render(<AgendaPage />);
      await user.click(
        await screen.findByRole('button', { name: /Preparar recordatorios/i }),
      );
      expect(
        await screen.findByText(/No hay citas confirmadas en las próximas 24 horas/i),
      ).toBeInTheDocument();
    });
  });

  describe('6. Reparto por rol — decisión del PO del 2026-08-20', () => {
    it('Administrador, Recepción y Doctor ven las dos pestañas', async () => {
      render(<AgendaPage />);
      expect(await screen.findByRole('button', { name: /Disponibilidad/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^Citas$/i })).toBeInTheDocument();
    });

    it('consulta el rol antes de ofrecer la configuración de horarios', async () => {
      render(<AgendaPage />);
      await screen.findByRole('button', { name: /Disponibilidad/i });
      // El Paciente no está en la lista: CU-06 le queda cerrado.
      expect(mockHasRole).toHaveBeenCalledWith([
        Rol.ADMINISTRADOR,
        Rol.RECEPCION,
        Rol.DOCTOR,
      ]);
    });

    it('un rol sin permiso no ve la pestaña ni CU-06 en el encabezado', async () => {
      mockHasRole.mockReturnValue(false);
      render(<AgendaPage />);
      expect(await screen.findByText('CU-05')).toBeInTheDocument();
      expect(screen.queryByText(/CU-06/)).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /Disponibilidad/i }),
      ).not.toBeInTheDocument();
    });

    it('aun sin poder configurar, conserva el calendario de citas', async () => {
      mockHasRole.mockReturnValue(false);
      render(<AgendaPage />);
      expect(await screen.findByRole('button', { name: /08:00 Libre/i })).toBeInTheDocument();
    });
  });

  describe('7. Disponibilidad — CU-06 paso 4', () => {
    const irADisponibilidad = async (user: ReturnType<typeof usuario>) => {
      await user.click(await screen.findByRole('button', { name: /Disponibilidad/i }));
    };

    it('bloquea el guardado si la hora de fin no es posterior a la de inicio', async () => {
      const user = usuario();
      render(<AgendaPage />);
      await irADisponibilidad(user);

      const horaFin = await screen.findByLabelText(/Hora fin/i);
      await user.clear(horaFin);
      await user.type(horaFin, '07:00');

      expect(
        await screen.findByText(/La hora de fin debe ser posterior a la de inicio/i),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Crear bloque/i })).toBeDisabled();
      expect(crearDisponibilidad).not.toHaveBeenCalled();
    });

    it('con un rango válido el botón se habilita', async () => {
      const user = usuario();
      render(<AgendaPage />);
      await irADisponibilidad(user);
      expect(await screen.findByRole('button', { name: /Crear bloque/i })).toBeEnabled();
    });

    it('muestra el error de EX-07 al desactivar un bloque con citas', async () => {
      const user = usuario();
      vi.mocked(desactivarDisponibilidad).mockRejectedValue({
        response: {
          data: {
            message:
              'No se puede desactivar el bloque: tiene 2 cita(s) agendada(s).',
          },
        },
      });
      render(<AgendaPage />);
      await irADisponibilidad(user);
      await user.click(await screen.findByRole('button', { name: /Desactivar/i }));
      expect(await screen.findByText(/tiene 2 cita\(s\) agendada\(s\)/i)).toBeInTheDocument();
    });
  });
});
