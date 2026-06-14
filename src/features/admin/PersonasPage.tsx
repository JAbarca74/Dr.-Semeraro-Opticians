import { useEffect, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Pencil, UserPlus, X } from 'lucide-react';
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
import {
  Alert,
  Badge,
  LuxButton,
  LuxCard,
  SectionHeader,
  fadeUp,
  fieldInputClass,
  fieldLabelClass,
} from '../../shared/ui';

const FORM_VACIO: PersonaInput = {
  cedula: '',
  nombre: '',
  tipo: TipoPersona.PACIENTE,
  telefono: '',
  correo: '',
  puesto: '',
};

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelar = () => {
    setEditId(null);
    setForm(FORM_VACIO);
    setError('');
  };

  return (
    <section className="space-y-10">
      <SectionHeader
        kicker="Directorio clínico"
        title="Personas"
        description="Gestión unificada de pacientes y personal de la óptica."
      />

      {/* Formulario */}
      <motion.div {...fadeUp}>
        <LuxCard className="p-6">
          <div className="mb-5 flex items-center gap-2 border-b border-neutral-100 pb-4 dark:border-white/5">
            <UserPlus className="h-4 w-4 text-lux-gold" strokeWidth={1.5} />
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-700 dark:text-neutral-200">
              {editId ? 'Editar persona' : 'Nueva persona'}
            </h2>
          </div>
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <label>
              <span className={fieldLabelClass}>Cédula</span>
              <input
                className={fieldInputClass}
                value={form.cedula}
                onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                required
              />
            </label>
            <label>
              <span className={fieldLabelClass}>Nombre completo</span>
              <input
                className={fieldInputClass}
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                required
              />
            </label>
            <label>
              <span className={fieldLabelClass}>Tipo</span>
              <select
                className={fieldInputClass}
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
            <label>
              <span className={fieldLabelClass}>Teléfono</span>
              <input
                className={fieldInputClass}
                value={form.telefono ?? ''}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
            </label>
            <label>
              <span className={fieldLabelClass}>Correo</span>
              <input
                type="email"
                className={fieldInputClass}
                value={form.correo ?? ''}
                onChange={(e) => setForm({ ...form, correo: e.target.value })}
              />
            </label>
            {form.tipo === TipoPersona.EMPLEADO ? (
              <label>
                <span className={fieldLabelClass}>Puesto</span>
                <input
                  className={fieldInputClass}
                  value={form.puesto ?? ''}
                  onChange={(e) => setForm({ ...form, puesto: e.target.value })}
                />
              </label>
            ) : null}

            <div className="col-span-full flex flex-wrap items-center gap-3 pt-2">
              <LuxButton type="submit" disabled={guardando}>
                {editId ? 'Guardar cambios' : 'Crear persona'}
              </LuxButton>
              {editId ? (
                <LuxButton type="button" variant="ghost" onClick={cancelar}>
                  <X className="h-3.5 w-3.5" /> Cancelar
                </LuxButton>
              ) : null}
              {error ? <Alert>{error}</Alert> : null}
            </div>
          </form>
        </LuxCard>
      </motion.div>

      {/* Tabla */}
      <motion.div {...fadeUp}>
        <LuxCard className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/60 text-left dark:border-white/5 dark:bg-white/5">
                {['Cédula', 'Nombre', 'Tipo', 'Contacto', ''].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {personas.map((p) => (
                <tr
                  key={p.idPersona}
                  className="transition-luxe border-b border-neutral-50 last:border-0 hover:bg-lux-gold/5 dark:border-white/5"
                >
                  <td className="px-5 py-3 font-mono text-xs text-neutral-500">{p.cedula}</td>
                  <td className="px-5 py-3 font-medium text-lux-blue dark:text-white">
                    {p.nombre}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={p.tipo === TipoPersona.PACIENTE ? 'blue' : 'gold'}>
                      {p.tipo}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-neutral-500">
                    {p.telefono || p.correo || '—'}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => editar(p)}
                      className="transition-luxe inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hover:text-lux-gold"
                    >
                      <Pencil className="h-3 w-3" /> Editar
                    </button>
                  </td>
                </tr>
              ))}
              {personas.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-neutral-400">
                    Sin personas registradas.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </LuxCard>
      </motion.div>
    </section>
  );
};
