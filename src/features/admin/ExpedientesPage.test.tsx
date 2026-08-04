// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { ExpedientesPage } from './ExpedientesPage';
import { listarPersonas } from '../../core/api/personas.service';
import {
  crearEvaluacion,
  emitirReceta,
  expedientePorPaciente,
  listarExpedientes,
} from '../../core/api/expedientes.service';
import { TipoPersona } from '../../core/models/persona';
import { Rol } from '../../core/models/rol';
import { Ojo } from '../../core/models/expediente';

vi.mock('../../core/api/personas.service');
vi.mock('../../core/api/expedientes.service');

const mockHasRole = vi.fn();
vi.mock('../../core/auth/auth.context', () => ({
  useAuth: () => ({ hasRole: mockHasRole }),
}));

vi.mock('framer-motion', async () => {
  const react = await import('react');
  // Props de animación que framer-motion consume y que no deben llegar al DOM.
  const PROPS_ANIMACION = ['initial', 'animate', 'exit', 'variants'];
  const stripProps = (props: any) =>
    Object.fromEntries(Object.entries(props).filter(([clave]) => !PROPS_ANIMACION.includes(clave)));
  return {
    AnimatePresence: ({ children }: any) => <>{children}</>,
    motion: {
      div: react.forwardRef((props: any, ref: any) => <div ref={ref} {...stripProps(props)} />),
      p: react.forwardRef((props: any, ref: any) => <p ref={ref} {...stripProps(props)} />),
      header: react.forwardRef((props: any, ref: any) => <header ref={ref} {...stripProps(props)} />),
    },
    stagger: {},
    fadeUp: {},
    fadeUpItem: {},
  };
});

const mockPacientes = [
  {
    idPersona: 1,
    cedula: '1-1111-1111',
    nombre: 'Juan Pérez',
    tipo: TipoPersona.PACIENTE,
    correo: '',
    telefono: '',
  },
  {
    idPersona: 2,
    cedula: '2-2222-2222',
    nombre: 'Marta Jiménez',
    tipo: TipoPersona.PACIENTE,
    correo: '',
    telefono: '',
  },
  {
    idPersona: 3,
    cedula: '3-3333-3333',
    nombre: 'Carlos Empleado',
    tipo: TipoPersona.EMPLEADO,
    correo: '',
    telefono: '',
  },
];

const mockExpedientesLista = [
  {
    idExpediente: 101,
    idPaciente: 1,
    fechaCreacion: '2023-01-01T00:00:00.000Z',
  },
];

const mockDetalleConRefraccion = {
  idExpediente: 101,
  idPaciente: 1,
  fechaCreacion: '2023-01-01T00:00:00.000Z',
  evaluaciones: [
    {
      idEvaluacionClinica: 201,
      fecha: '2023-01-15T10:00:00.000Z',
      diagnosticos: ['Miopía'],
      notas: 'Nota previa',
      doctor: { idUsuario: 9, nombre: 'Dr. López' },
      refracciones: [
        { ojo: Ojo.DERECHO, esfera: -1.5, cilindro: -0.5, eje: 180, adicion: 1 },
        { ojo: Ojo.IZQUIERDO, esfera: -2.0, cilindro: 0, eje: 0, adicion: 1 },
      ],
      receta: {
        idReceta: 301,
        hashSha256: 'abc123hash',
        codigoQr: 'data:image/png;base64,mock',
      },
    },
    {
      idEvaluacionClinica: 202,
      fecha: '2022-12-10T10:00:00.000Z',
      doctor: { idUsuario: 9, nombre: 'Dr. López' },
    },
  ],
};

const renderComponent = () =>
  render(
    <MemoryRouter>
      <ExpedientesPage />
    </MemoryRouter>,
  );

/**
 * Valor de un KPI a partir de su etiqueta. Cada tarjeta agrupa el número y su
 * rótulo en el mismo contenedor, con el número primero.
 */
const valorKpi = (etiqueta: string) =>
  screen.getByText(etiqueta).parentElement?.querySelector('span')?.textContent;

describe('ExpedientesPage', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
    (listarPersonas as any).mockResolvedValue(mockPacientes);
    (listarExpedientes as any).mockResolvedValue(mockExpedientesLista);
    (expedientePorPaciente as any).mockResolvedValue(mockDetalleConRefraccion);
    mockHasRole.mockImplementation((roles: Rol[]) =>
      roles.includes(Rol.DOCTOR),
    );
  });

  afterEach(() => {
    cleanup();
  });

  describe('1. Buscador y dashboard', () => {
    it('Muestra solo personas con tipo === Paciente (excluye Empleado)', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.getByText('Marta Jiménez')).toBeInTheDocument();
      });
      expect(screen.queryByText('Carlos Empleado')).not.toBeInTheDocument();
    });

    it('Los 3 KPI muestran total de pacientes, nº de expedientes abiertos y nº de coincidencias', async () => {
      renderComponent();
      // Los tres KPI comparten cifras ('02' sale dos veces), así que cada uno se
      // localiza por su etiqueta y se lee el valor que la acompaña.
      await waitFor(() => expect(valorKpi('Pacientes registrados')).toBe('02'));
      expect(valorKpi('Expedientes abiertos')).toBe('01');
      expect(valorKpi('Coincidencias del filtro')).toBe('02');
    });

    it('Al escribir una cédula parcial, la tabla filtra en tiempo real', async () => {
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument(),
      );

      const input = screen.getByRole('textbox', {
        name: /número de cédula o nombre/i,
      });
      await user.type(input, '2-2222');

      await waitFor(() => {
        expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument();
        expect(screen.getByText('Marta Jiménez')).toBeInTheDocument();
      });
    });

    it('Al escribir parte de un nombre, también filtra', async () => {
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument(),
      );

      const input = screen.getByRole('textbox', {
        name: /número de cédula o nombre/i,
      });
      await user.type(input, 'juan');

      await waitFor(() => {
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.queryByText('Marta Jiménez')).not.toBeInTheDocument();
      });
    });

    it('Con filtro sin resultados muestra "Ningún paciente coincide con la búsqueda"', async () => {
      renderComponent();
      await waitFor(() =>
        expect(screen.getByText('Juan Pérez')).toBeInTheDocument(),
      );

      const input = screen.getByRole('textbox', {
        name: /número de cédula o nombre/i,
      });
      await user.type(input, 'xyz');

      await waitFor(() => {
        expect(
          screen.getByText('Ningún paciente coincide con la búsqueda.'),
        ).toBeInTheDocument();
      });
    });

    it('Sin pacientes muestra "Aún no hay pacientes registrados"', async () => {
      (listarPersonas as any).mockResolvedValue([]);
      renderComponent();
      await waitFor(() => {
        expect(
          screen.getByText('Aún no hay pacientes registrados.'),
        ).toBeInTheDocument();
      });
    });

    it('Badge "Abierto" solo para los pacientes presentes en listarExpedientes', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Abierto')).toBeInTheDocument();
        expect(screen.getByText('Sin abrir')).toBeInTheDocument();
      });
    });
  });

  describe('2. División por rol', () => {
    it('Con rol Doctor: badge "Modo clínico", aparece formulario y botón', async () => {
      mockHasRole.mockImplementation((roles: Rol[]) =>
        roles.includes(Rol.DOCTOR),
      );
      renderComponent();

      await waitFor(() =>
        expect(screen.getByText('Modo clínico · Doctor')).toBeInTheDocument(),
      );

      await waitFor(() => screen.getByText('Juan Pérez'));
      await user.click(screen.getByText('Juan Pérez'));

      await waitFor(() => {
        expect(screen.getByText('Nueva evolución clínica')).toBeInTheDocument();
        expect(
          screen.getByRole('button', { name: /guardar y generar receta/i }),
        ).toBeInTheDocument();
      });
    });

    it('Con rol Administrador: badge "Modo supervisión", no aparece formulario, aparece aviso, y sin emitir receta', async () => {
      mockHasRole.mockImplementation(
        (roles: Rol[]) => roles.includes(Rol.ADMINISTRADOR) && !roles.includes(Rol.DOCTOR),
      );
      renderComponent();

      await waitFor(() =>
        expect(
          screen.getByText('Modo supervisión · solo lectura'),
        ).toBeInTheDocument(),
      );

      await waitFor(() => screen.getByText('Juan Pérez'));
      await user.click(screen.getByText('Juan Pérez'));

      await waitFor(() => {
        expect(
          screen.queryByText('Nueva evolución clínica'),
        ).not.toBeInTheDocument();
        // Texto exacto: el badge del encabezado también empieza por «Modo
        // supervisión», y una coincidencia parcial casaría con los dos.
        expect(screen.getByText('Modo supervisión.')).toBeInTheDocument();
        expect(screen.getByText('Sin receta.')).toBeInTheDocument();
        expect(
          screen.queryByRole('button', { name: /emitir receta con qr/i }),
        ).not.toBeInTheDocument();
      });
    });

    it('Ambos roles ven el historial de evoluciones y el hash de las recetas', async () => {
      renderComponent();
      await waitFor(() => screen.getByText('Juan Pérez'));
      await user.click(screen.getByText('Juan Pérez'));

      await waitFor(() => {
        expect(screen.getByText('Evoluciones registradas')).toBeInTheDocument();
        expect(screen.getByText('SHA-256: abc123hash')).toBeInTheDocument();
      });
    });
  });

  describe('3. Apertura de expediente y precarga', () => {
    it('Al hacer clic en una fila se llama expedientePorPaciente y muestra la ficha', async () => {
      renderComponent();
      await waitFor(() => screen.getByText('Juan Pérez'));
      await user.click(screen.getByText('Juan Pérez'));

      expect(expedientePorPaciente).toHaveBeenCalledWith(1);
      await waitFor(() => {
        expect(screen.getByText('Expediente activo')).toBeInTheDocument();
      });
    });

    it('Con rol Doctor se precargan refracciones de la evaluación más reciente y muestra aviso', async () => {
      mockHasRole.mockImplementation((roles: Rol[]) =>
        roles.includes(Rol.DOCTOR),
      );
      renderComponent();
      await waitFor(() => screen.getByText('Juan Pérez'));
      await user.click(screen.getByText('Juan Pérez'));

      await waitFor(() => {
        expect(
          screen.getByText(/Se precargaron los parámetros de la consulta del/i),
        ).toBeInTheDocument();
      });

      const inputsEsfera = screen.getAllByRole('spinbutton', {
        name: /esfera/i,
      });
      expect(inputsEsfera[0]).toHaveValue(-1.5); // OD
      expect(inputsEsfera[1]).toHaveValue(-2.0); // OI
    });

    it('Con rol Administrador NO se precarga nada', async () => {
      mockHasRole.mockImplementation(() => false);
      renderComponent();
      await waitFor(() => screen.getByText('Juan Pérez'));
      await user.click(screen.getByText('Juan Pérez'));

      await waitFor(() => {
        expect(
          screen.queryByText(/Se precargaron los parámetros de la consulta/i),
        ).not.toBeInTheDocument();
        expect(screen.queryAllByRole('spinbutton')).toHaveLength(0);
      });
    });

    it('Cambiar de paciente vuelve al buscador y limpia formulario', async () => {
      renderComponent();
      await waitFor(() => screen.getByText('Juan Pérez'));
      await user.click(screen.getByText('Juan Pérez'));

      await waitFor(() =>
        screen.getByRole('button', { name: /cambiar de paciente/i }),
      );
      await user.click(
        screen.getByRole('button', { name: /cambiar de paciente/i }),
      );

      await waitFor(() => {
        expect(screen.getByText('Buscador de pacientes')).toBeInTheDocument();
        expect(screen.queryByText('Expediente activo')).not.toBeInTheDocument();
      });
    });
  });

  describe('4. Validación de rangos', () => {
    beforeEach(async () => {
      (expedientePorPaciente as any).mockResolvedValue({
        ...mockDetalleConRefraccion,
        evaluaciones: [],
      });
      renderComponent();
      await waitFor(() => screen.getByText('Juan Pérez'));
      await user.click(screen.getByText('Juan Pérez'));
      await waitFor(() =>
        screen.getByRole('button', { name: /guardar y generar receta/i }),
      );
    });

    it('Valores fuera de rango muestran error y deshabilitan el botón', async () => {
      const inputsEsfera = screen.getAllByRole('spinbutton', {
        name: /esfera/i,
      });
      await user.type(inputsEsfera[0], '26'); // Fuera de +-25

      expect(await screen.findByText('Fuera de rango')).toBeInTheDocument();
      const boton = screen.getByRole('button', {
        name: /guardar y generar receta/i,
      });
      expect(boton).toBeDisabled();
    });

    it('Con valores válidos el botón se habilita', async () => {
      const inputsEsfera = screen.getAllByRole('spinbutton', {
        name: /esfera/i,
      });
      await user.type(inputsEsfera[0], '10');

      expect(screen.queryByText('Fuera de rango')).not.toBeInTheDocument();
      const boton = screen.getByRole('button', {
        name: /guardar y generar receta/i,
      });
      expect(boton).not.toBeDisabled();
    });
  });

  describe('5. Modal de descarte', () => {
    beforeEach(async () => {
      (expedientePorPaciente as any).mockResolvedValue({
        ...mockDetalleConRefraccion,
        evaluaciones: [],
      });
      renderComponent();
      await waitFor(() => screen.getByText('Juan Pérez'));
      await user.click(screen.getByText('Juan Pérez'));
      await waitFor(() => screen.getByRole('button', { name: /cancelar/i }));
    });

    it('Con formulario relleno, Cancelar abre diálogo. Descartar limpia y muestra aviso', async () => {
      const diagnosticos = screen.getByRole('textbox', {
        name: /diagnósticos/i,
      });
      await user.type(diagnosticos, 'Miopía leve');

      await user.click(screen.getByRole('button', { name: /cancelar/i }));

      const modal = await screen.findByRole('dialog');
      expect(modal).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Descartar' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(
        screen.getByText(
          'Se descartó la evolución en curso. No se guardó nada.',
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('textbox', { name: /diagnósticos/i }),
      ).toHaveValue('');
    });

    it('Volver cierra sin limpiar', async () => {
      const diagnosticos = screen.getByRole('textbox', {
        name: /diagnósticos/i,
      });
      await user.type(diagnosticos, 'Miopía leve');

      await user.click(screen.getByRole('button', { name: /cancelar/i }));

      const modal = await screen.findByRole('dialog');
      expect(modal).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: 'Volver' }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(
        screen.getByRole('textbox', { name: /diagnósticos/i }),
      ).toHaveValue('Miopía leve');
    });

    it('Con formulario vacío, Cancelar NO abre el diálogo', async () => {
      await user.click(screen.getByRole('button', { name: /cancelar/i }));

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('6. Guardado', () => {
    beforeEach(async () => {
      (expedientePorPaciente as any).mockResolvedValue({
        ...mockDetalleConRefraccion,
        evaluaciones: [],
      });
      renderComponent();
      await waitFor(() => screen.getByText('Juan Pérez'));
      await user.click(screen.getByText('Juan Pérez'));
      await waitFor(() =>
        screen.getByRole('button', { name: /guardar y generar receta/i }),
      );
    });

    it('Llama a crearEvaluacion y emitirReceta correctamente', async () => {
      (crearEvaluacion as any).mockResolvedValue({ idEvaluacionClinica: 99 });
      (emitirReceta as any).mockResolvedValue({});

      const diagnosticos = screen.getByRole('textbox', {
        name: /diagnósticos/i,
      });
      await user.type(diagnosticos, 'Diag 1\n\nDiag 2\n');

      const inputsEsfera = screen.getAllByRole('spinbutton', {
        name: /esfera/i,
      });
      await user.type(inputsEsfera[0], '1.0'); // OD

      await user.click(
        screen.getByRole('button', { name: /guardar y generar receta/i }),
      );

      await waitFor(() => {
        expect(crearEvaluacion).toHaveBeenCalledWith({
          idPaciente: 1,
          diagnosticos: ['Diag 1', 'Diag 2'],
          notas: undefined,
          refracciones: [
            {
              ojo: Ojo.DERECHO,
              esfera: 1,
              cilindro: 0,
              eje: 0,
              adicion: undefined,
            },
          ],
        });
        expect(emitirReceta).toHaveBeenCalledWith(99);
      });
    });

    it('Si emitirReceta falla, muestra aviso de evaluación guardada pero...', async () => {
      (crearEvaluacion as any).mockResolvedValue({ idEvaluacionClinica: 99 });
      (emitirReceta as any).mockRejectedValue(new Error('Fallo de red'));

      const diagnosticos = screen.getByRole('textbox', {
        name: /diagnósticos/i,
      });
      await user.type(diagnosticos, 'Diag 1');

      await user.click(
        screen.getByRole('button', { name: /guardar y generar receta/i }),
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Evaluación guardada, pero/i),
        ).toBeInTheDocument();
      });
    });

    it('Si crearEvaluacion falla, muestra error', async () => {
      (crearEvaluacion as any).mockRejectedValue(new Error('Error al crear'));

      const diagnosticos = screen.getByRole('textbox', {
        name: /diagnósticos/i,
      });
      await user.type(diagnosticos, 'Diag 1');

      await user.click(
        screen.getByRole('button', { name: /guardar y generar receta/i }),
      );

      await waitFor(() => {
        expect(screen.getByText(/Ocurrió un error/i)).toBeInTheDocument();
      });
    });
  });
});
