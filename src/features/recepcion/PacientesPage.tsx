import { useIdioma } from '../../core/i18n/idioma.context';
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
import { sinVacios } from '../../shared/form';
import { TelefonoInput } from '../../shared/TelefonoInput';
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
  // Datos que el expediente clínico impreso pide en su encabezado (CU-02).
  fechaNacimiento: '',
  ocupacion: '',
  direccion: '',
  contactoEmergencia: '',
  telefonoEmergencia: '',
};

export const PacientesPage = () => {
  const { t } = useIdioma();
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
      .catch((e) => setError(mensajeDeError(e, t('pacientes.error'))));

  useEffect(() => {
    cargar();
    // `cargar` depende de `t` para el texto de respaldo, así que cambia de
    // identidad en cada render. En las dependencias volvería a pedir los datos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const payload: PersonaInput = { ...form, tipo: TipoPersona.PACIENTE };
      if (editId) {
        // Con las cadenas vacías incluidas: en una edición significan «borra
        // este campo». Omitirlas dejaba el valor anterior vivo en la base.
        await actualizarPersona(editId, payload);
        setOk(`Datos de ${form.nombre} actualizados.`);
      } else {
        await crearPersona(sinVacios(payload));
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
      fechaNacimiento: p.fechaNacimiento?.slice(0, 10) ?? '',
      ocupacion: p.ocupacion ?? '',
      direccion: p.direccion ?? '',
      contactoEmergencia: p.contactoEmergencia ?? '',
      telefonoEmergencia: p.telefonoEmergencia ?? '',
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
        title={t('pacientes.titulo')}
        description={t('pacientes.descripcion')}
        actions={
          <RecepButton onClick={nuevo}>
            <Plus className="h-4 w-4 text-lux-tinta" />
            {mostrarForm ? t('pacientes.cerrarRegistro') : t('pacientes.nuevo')}
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
                    {editId ? t('pacientes.editar') : t('pacientes.formulario')}
                  </h3>
                  <p className="text-xs font-light text-neutral-400">{t('pacientes.exactitud')}</p>
                </div>
                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <span className={recepLabelClass}>{t('persona.cedula')}</span>
                    <input
                      className={recepInputClass}
                      value={form.cedula}
                      onChange={(e) => setForm({ ...form, cedula: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <span className={recepLabelClass}>{t('persona.nombreCompleto')}</span>
                    <input
                      className={recepInputClass}
                      value={form.nombre}
                      onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <TelefonoInput
                      etiqueta="Teléfono"
                      valor={form.telefono}
                      onChange={(telefono) => setForm({ ...form, telefono })}
                      labelClass={recepLabelClass}
                      inputClass={recepInputClass}
                    />
                    <div>
                      <span className={recepLabelClass}>{t('persona.correo')}</span>
                      <input
                        type="email"
                        className={recepInputClass}
                        value={form.correo ?? ''}
                        onChange={(e) => setForm({ ...form, correo: e.target.value })}
                      />
                    </div>
                  </div>
                  {/* Encabezado del expediente clínico impreso (CU-02). */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className={recepLabelClass}>{t('persona.nacimiento')}</span>
                      <input
                        type="date"
                        className={recepInputClass}
                        value={form.fechaNacimiento ?? ''}
                        onChange={(e) =>
                          setForm({ ...form, fechaNacimiento: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <span className={recepLabelClass}>{t('persona.ocupacion')}</span>
                      <input
                        className={recepInputClass}
                        value={form.ocupacion ?? ''}
                        onChange={(e) =>
                          setForm({ ...form, ocupacion: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <span className={recepLabelClass}>{t('persona.direccion')}</span>
                    <input
                      className={recepInputClass}
                      value={form.direccion ?? ''}
                      onChange={(e) =>
                        setForm({ ...form, direccion: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className={recepLabelClass}>
                        {t('exp.campo.contactoEmergencia')}
                      </span>
                      <input
                        className={recepInputClass}
                        value={form.contactoEmergencia ?? ''}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            contactoEmergencia: e.target.value,
                          })
                        }
                      />
                    </div>
                    <TelefonoInput
                      etiqueta="Tel. de emergencia"
                      valor={form.telefonoEmergencia}
                      onChange={(telefonoEmergencia) =>
                        setForm({ ...form, telefonoEmergencia })
                      }
                      labelClass={recepLabelClass}
                      inputClass={recepInputClass}
                    />
                  </div>
                  {error ? (
                    <p className="border border-rose-100 bg-rose-50 p-3 text-[11px] font-medium text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400">
                      {error}
                    </p>
                  ) : null}
                  <div className="flex items-center gap-3">
                    <RecepButton type="submit" disabled={guardando}>
                      {editId ? t('personas.guardar') : t('pacientes.registrar')}
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
                placeholder={t('pacientes.buscar')}
                className="w-full bg-transparent text-xs outline-hidden placeholder:text-neutral-400"
              />
              <span className="font-mono text-[10px] uppercase tracking-widest text-neutral-400">
                {filtrados.length} / {personas.length}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 text-left dark:border-neutral-800">
                    {[t('persona.cedula'), t('persona.nombre'), t('persona.contacto'), ''].map((h) => (
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
                      <td colSpan={4} className="px-5 py-10 text-center text-sm text-neutral-400">{t('pacientes.vacio')}</td>
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
