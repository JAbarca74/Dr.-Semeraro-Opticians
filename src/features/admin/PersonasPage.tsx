import { useEffect, useState, type FormEvent } from 'react';
import {
  actualizarPersona,
  crearPersona,
  listarPersonas,
} from '../../core/api/personas.service';
import {
  TipoPersona,
  type Persona,
  type PersonaInput,
} from '../../core/models/persona';
import { mensajeDeError } from '../../shared/error';

const FORM_VACIO: PersonaInput = {
  cedula: '',
  nombre: '',
  tipo: TipoPersona.PACIENTE,
  telefono: '',
  correo: '',
  puesto: '',
};

const inputClass =
  'mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none';

export const PersonasPage = () => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [form, setForm] = useState<PersonaInput>(FORM_VACIO);
  const [editId, setEditId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = () =>
    listarPersonas()
      .then(setPersonas)
      .catch((e) => setError(mensajeDeError(e, 'No se pudieron cargar las personas')));

  useEffect(() => {
    cargar();
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      const payload: PersonaInput = {
        ...form,
        telefono: form.telefono || undefined,
        correo: form.correo || undefined,
        puesto: form.puesto || undefined,
      };
      if (editId) {
        await actualizarPersona(editId, payload);
      } else {
        await crearPersona(payload);
      }
      setForm(FORM_VACIO);
      setEditId(null);
      cargar();
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  };

  const editar = (p: Persona) => {
    setEditId(p.idPersona);
    setForm({
      cedula: p.cedula,
      nombre: p.nombre,
      tipo: p.tipo,
      telefono: p.telefono ?? '',
      correo: p.correo ?? '',
      puesto: p.puesto ?? '',
    });
  };

  const cancelar = () => {
    setEditId(null);
    setForm(FORM_VACIO);
    setError('');
  };

  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold text-slate-800">Personas</h1>
        <p className="mt-1 text-sm text-slate-600">
          Gestión de pacientes y empleados.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        <h2 className="col-span-full text-sm font-medium text-slate-700">
          {editId ? 'Editar persona' : 'Nueva persona'}
        </h2>
        <label className="block text-sm">
          <span className="text-slate-600">Cédula</span>
          <input
            className={inputClass}
            value={form.cedula}
            onChange={(e) => setForm({ ...form, cedula: e.target.value })}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Nombre</span>
          <input
            className={inputClass}
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Tipo</span>
          <select
            className={inputClass}
            value={form.tipo}
            onChange={(e) =>
              setForm({ ...form, tipo: e.target.value as TipoPersona })
            }
          >
            {Object.values(TipoPersona).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Teléfono</span>
          <input
            className={inputClass}
            value={form.telefono ?? ''}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-600">Correo</span>
          <input
            type="email"
            className={inputClass}
            value={form.correo ?? ''}
            onChange={(e) => setForm({ ...form, correo: e.target.value })}
          />
        </label>
        {form.tipo === TipoPersona.EMPLEADO ? (
          <label className="block text-sm">
            <span className="text-slate-600">Puesto</span>
            <input
              className={inputClass}
              value={form.puesto ?? ''}
              onChange={(e) => setForm({ ...form, puesto: e.target.value })}
            />
          </label>
        ) : null}

        <div className="col-span-full flex items-center gap-3">
          <button
            type="submit"
            disabled={guardando}
            className="rounded bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {editId ? 'Guardar cambios' : 'Crear persona'}
          </button>
          {editId ? (
            <button
              type="button"
              onClick={cancelar}
              className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
            >
              Cancelar
            </button>
          ) : null}
          {error ? <span className="text-sm text-red-600">{error}</span> : null}
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-2 font-medium">Cédula</th>
              <th className="px-4 py-2 font-medium">Nombre</th>
              <th className="px-4 py-2 font-medium">Tipo</th>
              <th className="px-4 py-2 font-medium">Contacto</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {personas.map((p) => (
              <tr key={p.idPersona} className="border-t border-slate-100">
                <td className="px-4 py-2">{p.cedula}</td>
                <td className="px-4 py-2">{p.nombre}</td>
                <td className="px-4 py-2">{p.tipo}</td>
                <td className="px-4 py-2 text-slate-500">
                  {p.telefono || p.correo || '—'}
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => editar(p)}
                    className="text-slate-600 hover:text-slate-900"
                  >
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {personas.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Sin personas registradas.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
};
