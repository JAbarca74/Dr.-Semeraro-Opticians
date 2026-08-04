import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Pencil, Plus, Search, X } from 'lucide-react';
import {
  actualizarPersona,
  crearPersona,
  listarPersonas,
} from '../../core/api/personas.service';
import { TipoPersona, type Persona, type PersonaInput } from '../../core/models/persona';
import { mensajeDeError } from '../../shared/error';
import {
  RecepButton,
  RecepCard,
  RecepHeader,
  recepFade,
  recepInputClass,
  recepLabelClass,
} from './RecepcionShared';

const VACIO: PersonaInput = {
  cedula: '',
  nombre: '',
  tipo: TipoPersona.PACIENTE,
  telefono: '',
  correo: '',
};

export const PacientesPage = () => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [form, setForm] = useState<PersonaInput>(VACIO);
  const [editId, setEditId] = useState<number | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = () =>
    listarPersonas()
      .then((ps) => setPersonas(ps.filter((p) => p.tipo === TipoPersona.PACIENTE)))
      .catch((e) => setError(mensajeDeError(e, 'No se pudieron cargar los pacientes')));

  useEffect(() => {
    cargar();
  }, []);

  const filtrados = useMemo(() => {
    const t = busqueda.trim().toLowerCase();
    if (!t) return personas;
    return personas.filter(
      (p) =>
        p.cedula.toLowerCase().includes(t) ||
        p.nombre.toLowerCase().includes(t) ||
        (p.telefono ?? '').includes(t) ||
        (p.correo ?? '').toLowerCase().includes(t),
    );
  }, [personas, busqueda]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setOk('');
    setGuardando(true);
    try {
      const payload: PersonaInput = {
        ...form,
        tipo: TipoPersona.PACIENTE,
        telefono: form.telefono || undefined,
        correo: form.correo || undefined,
      };
      if (editId) {
        await actualizarPersona(editId, payload);
        setOk(`Datos de ${form.nombre} actualizados.`);
      } else {
        await crearPersona(payload);
        setOk(`Paciente ${form.nombre} registrado en la base de Óptica Dr. Luigi Semeraro.`);
      }
      setForm(VACIO);
      setEditId(null);
      setMostrarForm(false);
      cargar();
      setTimeout(() => setOk(''), 4500);
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
      tipo: TipoPersona.PACIENTE,
      telefono: p.telefono ?? '',
      correo: p.correo ?? '',
    });
    setMostrarForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nuevo = () => {
    setEditId(null);
    setForm(VACIO);
    setError('');
    setMostrarForm((v) => !v);
  };

  return (
    <div>
      <RecepHeader
        cu="Registro de pacientes · CU-18"
        title="Pacientes"
        description="Gestione la base demográfica de pacientes de Óptica Dr. Luigi Semeraro: registro, contacto y trazabilidad para facturación y citas."
        actions={
          <RecepButton onClick={nuevo}>
            <Plus className="h-4 w-4 text-lux-gold" />
            {mostrarForm ? 'Cerrar registro' : 'Nuevo paciente'}
          </RecepButton>
        }
      />

      <AnimatePresence>
        {ok ? (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="mb-6 flex items-center gap-3.5 border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/20"
          >
            <CheckCircle className="h-5 w-5 shrink-0 text-emerald-600" />
            <span className="text-xs font-medium text-emerald-900 dark:text-emerald-300">{ok}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        {/* Formulario */}
        <AnimatePresence>
          {mostrarForm ? (
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              className="lg:col-span-5"
            >
              <RecepCard className="space-y-6 p-8">
                <div className="border-b border-neutral-100 pb-3 dark:border-neutral-800">
                  <h3 className="font-serif text-lg font-medium text-neutral-900 dark:text-white">
                    {editId ? 'Editar paciente' : 'Formulario de inscripción'}
                  </h3>
                  <p className="text-xs font-light text-neutral-400">
                    Ingrese con exactitud los datos del documento de identidad
                  </p>
                </div>
                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <span className={recepLabelClass}>Cédula</span>
                    <input
                      className={recepInputClass}
                      value={form.cedula}
                      onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <span className={recepLabelClass}>Nombre completo</span>
                    <input
                      className={recepInputClass}
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className={recepLabelClass}>Teléfono</span>
                      <input
                        className={recepInputClass}
                        value={form.telefono ?? ''}
                        onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                      />
                    </div>
                    <div>
                      <span className={recepLabelClass}>Correo</span>
                      <input
                        type="email"
                        className={recepInputClass}
                        value={form.correo ?? ''}
                        onChange={(e) => setForm({ ...form, correo: e.target.value })}
                      />
                    </div>
                  </div>
                  {error ? (
                    <p className="border border-rose-100 bg-rose-50 p-3 text-[11px] font-medium text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400">
                      {error}
                    </p>
                  ) : null}
                  <div className="flex items-center gap-3">
                    <RecepButton type="submit" disabled={guardando}>
                      {editId ? 'Guardar cambios' : 'Registrar paciente'}
                    </RecepButton>
                    {editId ? (
                      <RecepButton
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setEditId(null);
                          setForm(VACIO);
                          setMostrarForm(false);
                        }}
                      >
                        <X className="h-3.5 w-3.5" /> Cancelar
                      </RecepButton>
                    ) : null}
                  </div>
                </form>
              </RecepCard>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Listado */}
        <motion.div {...recepFade} className={mostrarForm ? 'lg:col-span-7' : 'lg:col-span-12'}>
          <RecepCard>
            <div className="flex items-center gap-3 border-b border-neutral-150 px-5 py-4 dark:border-neutral-800">
              <Search className="h-4 w-4 text-neutral-400" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por cédula, nombre, teléfono o correo…"
                className="w-full bg-transparent text-xs outline-none placeholder:text-neutral-400"
              />
              <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                {filtrados.length} / {personas.length}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-left dark:border-neutral-800">
                    {['Cédula', 'Nombre', 'Contacto', ''].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((p) => (
                    <tr
                      key={p.idPersona}
                      className="border-b border-neutral-50 transition-colors last:border-0 hover:bg-lux-ice dark:border-neutral-800/60 dark:hover:bg-neutral-900/50"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-neutral-500">{p.cedula}</td>
                      <td className="px-5 py-3 font-medium text-lux-dark dark:text-white">
                        {p.nombre}
                      </td>
                      <td className="px-5 py-3 text-neutral-500">
                        {p.telefono || p.correo || '—'}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => editar(p)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-500 transition-colors hover:text-lux-blue"
                        >
                          <Pencil className="h-3 w-3" /> Editar
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtrados.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-sm text-neutral-400">
                        Sin pacientes que coincidan.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </RecepCard>
        </motion.div>
      </div>
    </div>
  );
};
