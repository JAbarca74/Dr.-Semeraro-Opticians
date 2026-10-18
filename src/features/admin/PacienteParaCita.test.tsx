// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { render, screen, cleanup } from '../../test/rtl';
import { PacienteParaCita } from './PacienteParaCita';
import { crearPersona } from '../../core/api/personas.service';
vi.mock('../../core/api/personas.service');
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it('registra solo los datos mínimos y devuelve la ficha seleccionable, sin crear una cuenta', async () => {
  const persona = { idPersona: 5, cedula: '123', nombre: 'Ana', tipo: 'Paciente' as const };
  vi.mocked(crearPersona).mockResolvedValue(persona);
  const onCreado = vi.fn();
  render(<PacienteParaCita onCreado={onCreado} onCancelar={vi.fn()} />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Cédula'), '123');
  await user.type(screen.getByLabelText('Nombre completo'), 'Ana');
  await user.click(screen.getByRole('button', { name: 'Guardar y seleccionar paciente' }));
  expect(crearPersona).toHaveBeenCalledWith({ cedula: '123', nombre: 'Ana', tipo: 'Paciente' });
  expect(onCreado).toHaveBeenCalledWith(persona);
  expect(screen.getByText(/no crea una cuenta/i)).toBeInTheDocument();
});

describe('errores de ficha mínima', () => {
  it('conserva el formulario y el cupo cuando la cédula ya existe', async () => {
    vi.mocked(crearPersona).mockRejectedValue({ response: { data: { message: 'La cédula ya está registrada' } } });
    const onCreado = vi.fn();
    render(<PacienteParaCita onCreado={onCreado} onCancelar={vi.fn()} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Cédula'), '123');
    await user.type(screen.getByLabelText('Nombre completo'), 'Ana');
    await user.click(screen.getByRole('button', { name: 'Guardar y seleccionar paciente' }));
    expect(await screen.findByText('La cédula ya está registrada')).toBeInTheDocument();
    expect(screen.getByLabelText('Cédula')).toHaveValue('123');
    expect(onCreado).not.toHaveBeenCalled();
  });
});
