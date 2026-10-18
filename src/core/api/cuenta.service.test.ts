import { describe, it, expect, vi } from 'vitest';
import api from './http';
import { miCuenta } from './cuenta.service';
vi.mock('./http', () => ({ default: { get: vi.fn() } }));

describe('miCuenta', () => {
  it('consulta la identidad propia sin usar el directorio de empleados', async () => {
    const cuenta = { idUsuario: 2, idPersona: 7, email: 'doctor@optica.local', rol: 'Doctor' };
    vi.mocked(api.get).mockResolvedValue({ data: cuenta });
    expect(await miCuenta()).toEqual(cuenta);
    expect(api.get).toHaveBeenCalledWith('/auth/me');
  });
});
