import { useIdioma } from '../../core/i18n/idioma.context';
import type { ClaveTexto } from '../../core/i18n/catalogos/es';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  Eye,
  FileText,
  FolderOpen,
  History,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRound,
  X,
} from 'lucide-react';
import { listarPersonas } from '../../core/api/personas.service';
import {
  crearEvaluacion,
  emitirReceta,
  expedientePorPaciente,
  listarExpedientes,
} from '../../core/api/expedientes.service';
import { useAuth } from '../../core/auth/auth.context';
import { Rol } from '../../core/models/rol';
import { TipoPersona, edadDesde, type Persona } from '../../core/models/persona';
import {
  Ojo,
  type Evaluacion,
  type ExpedienteDetalle,
  type MotilidadOjo,
  type NuevaEvaluacion,
  type NuevaRefraccion,
  type Refraccion,
} from '../../core/models/expediente';
import { mensajeDeError } from '../../shared/error';
import {
  Alert,
  Badge,
  Kicker,
  LuxButton,
  LuxCard,
  SectionHeader,
  cx,
  fadeUp,
  fadeUpItem,
  fieldInputClass,
  stagger,
} from '../../shared/ui';
import { DiagramaMotilidad } from './DiagramaMotilidad';
import { API_BASE } from '../../core/api/http';

/** Rótulos con la grotesca condensada del expediente en papel. */
const rotuloClinicoClass =
  'block font-clinico text-[11px] font-bold uppercase tracking-wider2 text-neutral-600 dark:text-neutral-300';

interface RefraccionForm {
  esfera: string;
  cilindro: string;
  eje: string;
  adicion: string;
}

const REF_VACIA: RefraccionForm = {
  esfera: '',
  cilindro: '',
  eje: '',
  adicion: '',
};
const CAMPOS_REF = ['esfera', 'cilindro', 'eje', 'adicion'] as const;

/** Clave de traducción de cada parámetro de refracción. */
const ETIQUETA_REF: Record<keyof RefraccionForm, ClaveTexto> = {
  esfera: 'receta.esfera',
  cilindro: 'receta.cilindro',
  eje: 'receta.eje',
  adicion: 'exp.adicion',
};

/** Avisos de rango óptico (CU-02, EX-03): esfera ±25, cilindro ±10, eje 0–180, adición 0–4. */
const fueraDeRango = (campo: keyof RefraccionForm, valor: string): boolean => {
  if (valor === '') return false;
  const n = Number(valor);
  if (Number.isNaN(n)) return true;
  if (campo === 'esfera') return n < -25 || n > 25;
  if (campo === 'cilindro') return n < -10 || n > 10;
  if (campo === 'eje') return n < 0 || n > 180;
  if (campo === 'adicion') return n < 0 || n > 4;
  return false;
};

/**
 * Ficha del expediente impreso. Todo se maneja como texto: son los mismos
 * campos del papel y se convierten al enviar.
 */
interface FichaForm {
  motivoConsulta: string;
  ultimoControl: string;
  remitidoPor: string;
  antOculares: string;
  antFamiliares: string;
  antPersonales: string;
  antMedicamentosos: string;
  rxEnUso: string;
  tiempoUso: string;
  avScOd: string;
  avScOi: string;
  avScAo: string;
  avCcOd: string;
  avCcOi: string;
  avCcAo: string;
  pioOd: string;
  pioOi: string;
  dp: string;
  ppc: string;
  vergenciasForias: string;
  segmentoExterno: string;
  oftalmoscopia: string;
  refraccionTexto: string;
  diagnosticos: string;
  recomendaciones: string;
  control: string;
  remisiones: string;
}

const FICHA_VACIA: FichaForm = {
  motivoConsulta: '',
  ultimoControl: '',
  remitidoPor: '',
  antOculares: '',
  antFamiliares: '',
  antPersonales: '',
  antMedicamentosos: '',
  rxEnUso: '',
  tiempoUso: '',
  avScOd: '',
  avScOi: '',
  avScAo: '',
  avCcOd: '',
  avCcOi: '',
  avCcAo: '',
  pioOd: '',
  pioOi: '',
  dp: '',
  ppc: '',
  vergenciasForias: '',
  segmentoExterno: '',
  oftalmoscopia: '',
  refraccionTexto: '',
  diagnosticos: '',
  recomendaciones: '',
  control: '',
  remisiones: '',
};

/** Rangos clínicamente posibles de las medidas numéricas del anverso. */
const RANGO_MEDIDA: Record<string, { min: number; max: number }> = {
  pioOd: { min: 0, max: 80 },
  pioOi: { min: 0, max: 80 },
  dp: { min: 0, max: 99 },
  ppc: { min: 0, max: 99 },
};

const medidaFueraDeRango = (campo: string, valor: string): boolean => {
  const rango = RANGO_MEDIDA[campo];
  if (!rango || valor === '') return false;
  const n = Number(valor);
  return Number.isNaN(n) || n < rango.min || n > rango.max;
};

const construirRefraccion = (
  ojo: Ojo,
  f: RefraccionForm,
): NuevaRefraccion | null => {
  if (f.esfera === '' && f.cilindro === '' && f.eje === '') return null;
  return {
    ojo,
    esfera: Number(f.esfera || 0),
    cilindro: Number(f.cilindro || 0),
    eje: Math.round(Number(f.eje || 0)),
    adicion: f.adicion ? Number(f.adicion) : undefined,
  };
};

/** Vuelca una refracción guardada al formulario (CU-02 paso 4: precarga de la última consulta). */
const aFormulario = (r?: Refraccion): RefraccionForm =>
  r
    ? {
        esfera: r.esfera != null ? String(r.esfera) : '',
        cilindro: r.cilindro != null ? String(r.cilindro) : '',
        eje: r.eje != null ? String(r.eje) : '',
        adicion: r.adicion != null ? String(r.adicion) : '',
      }
    : REF_VACIA;

const formularioVacio = (f: RefraccionForm): boolean =>
  CAMPOS_REF.every((c) => f[c] === '');

const fechaCorta = (iso: string): string =>
  new Date(iso).toLocaleDateString('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const fechaHora = (iso: string): string =>
  new Date(iso).toLocaleString('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const textoODefecto = (valor?: string | number | null): string =>
  valor === null || valor === undefined || valor === '' ? '—' : String(valor);

// ── Piezas de presentación del entorno clínico ───────────────────────────────

/** Bloque del expediente, con el rótulo en la tipografía del impreso. */
const BloqueFicha = ({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) => (
  <fieldset className="border border-neutral-200 p-4 dark:border-white/10">
    <legend className="px-2 font-clinico text-[11px] font-bold uppercase tracking-wider2 text-lux-tinta">
      {titulo}
    </legend>
    <div className="space-y-4">{children}</div>
  </fieldset>
);

interface CampoProps {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  filas?: number;
  placeholder?: string;
}

/** Campo de texto del expediente: rótulo condensado, contenido en pantalla. */
const CampoTexto = ({
  etiqueta,
  valor,
  onChange,
  filas,
  placeholder,
}: CampoProps) => (
  <label className="block">
    <span className={rotuloClinicoClass}>{etiqueta}</span>
    {filas ? (
      <textarea
        className={fieldInputClass}
        rows={filas}
        value={valor}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    ) : (
      <input
        className={fieldInputClass}
        value={valor}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    )}
  </label>
);

/** Campo numérico con aviso de rango (mismo criterio que EX-03). */
const CampoMedida = ({
  etiqueta,
  campo,
  valor,
  onChange,
  sufijo,
  paso = '0.5',
}: {
  etiqueta: string;
  campo: string;
  valor: string;
  onChange: (v: string) => void;
  sufijo?: string;
  paso?: string;
}) => {
  const { t } = useIdioma();
  const malo = medidaFueraDeRango(campo, valor);
  return (
    <label className="block">
      <span className={rotuloClinicoClass}>
        {etiqueta}
        {sufijo ? (
          <span className="ml-1 font-sans normal-case tracking-normal text-neutral-400">
            ({sufijo})
          </span>
        ) : null}
      </span>
      <input
        type="number"
        step={paso}
        className={cx(
          fieldInputClass,
          malo && '!border-red-500 focus:!ring-red-400',
        )}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
      />
      {malo ? (
        <span className="mt-1 block text-[10px] font-semibold text-red-600">{t('exp.fueraRango')}</span>
      ) : null}
    </label>
  );
};

/** Dato de una evolución ya guardada. */
const DatoFicha = ({
  etiqueta,
  valor,
}: {
  etiqueta: string;
  valor?: string | number | null;
}) =>
  valor === null || valor === undefined || valor === '' ? null : (
    <div>
      <span className="block font-clinico text-[10px] font-bold uppercase tracking-wider2 text-neutral-400">
        {etiqueta}
      </span>
      <p className="whitespace-pre-line text-sm text-neutral-700 dark:text-neutral-200">
        {valor}
      </p>
    </div>
  );

export const ExpedientesPage = () => {
  const { t } = useIdioma();
  const { hasRole } = useAuth();

  // Separación de responsabilidades por rol (RS-10 / RS-13):
  //  · Doctor        → documenta evoluciones y emite recetas.
  //  · Administrador → supervisa el historial en modo lectura; el backend
  //                    rechaza con 403 cualquier escritura clínica de su parte.
  const esDoctor = hasRole([Rol.DOCTOR]);
  const puedeDocumentar = esDoctor;

  const [pacientes, setPacientes] = useState<Persona[]>([]);
  const [conExpediente, setConExpediente] = useState<Set<number>>(new Set());
  const [busqueda, setBusqueda] = useState('');
  const [idPaciente, setIdPaciente] = useState(0);
  const [detalle, setDetalle] = useState<ExpedienteDetalle | null>(null);
  const [ficha, setFicha] = useState<FichaForm>(FICHA_VACIA);
  const [movOd, setMovOd] = useState<MotilidadOjo>({});
  const [movOi, setMovOi] = useState<MotilidadOjo>({});
  const [od, setOd] = useState<RefraccionForm>(REF_VACIA);
  const [oi, setOi] = useState<RefraccionForm>(REF_VACIA);
  const [precargadoDe, setPrecargadoDe] = useState('');
  const [confirmarCancelar, setConfirmarCancelar] = useState(false);
  const dialogoRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [guardando, setGuardando] = useState(false);

  const campo = (clave: keyof FichaForm) => (valor: string) =>
    setFicha((f) => ({ ...f, [clave]: valor }));

  const hayFueraDeRango =
    CAMPOS_REF.some((c) => fueraDeRango(c, od[c]) || fueraDeRango(c, oi[c])) ||
    Object.keys(RANGO_MEDIDA).some((c) =>
      medidaFueraDeRango(c, ficha[c as keyof FichaForm]),
    );

  const pacienteActivo =
    pacientes.find((p) => p.idPersona === idPaciente) ?? null;

  useEffect(() => {
    listarPersonas()
      .then((ps) =>
        setPacientes(ps.filter((p) => p.tipo === TipoPersona.PACIENTE)),
      )
      .catch((e) =>
        setError(mensajeDeError(e, t('exp.errorPacientes'))),
      );
    // Marca qué pacientes ya tienen expediente abierto en el dashboard.
    listarExpedientes()
      .then((es) => setConExpediente(new Set(es.map((e) => e.idPaciente))))
      .catch(() => undefined);
    // `t` solo da el texto de respaldo del error; en las dependencias volvería
    // a pedir los pacientes en cada cambio de idioma.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // SRS §2.1.1.3: al abrir la ventana emergente el foco entra en ella, de modo
  // que la tecla Escape la cierra y el lector de pantalla la anuncia.
  useEffect(() => {
    if (confirmarCancelar) {
      dialogoRef.current?.focus();
    }
  }, [confirmarCancelar]);

  /** CU-02 §4.2.2: filtrado en tiempo real por número de cédula (y por nombre). */
  const filtrados = useMemo(() => {
    const t = busqueda.trim().toLowerCase();
    if (!t) return pacientes;
    return pacientes.filter(
      (p) =>
        p.cedula.toLowerCase().includes(t) ||
        p.nombre.toLowerCase().includes(t),
    );
  }, [pacientes, busqueda]);

  const limpiarFormulario = () => {
    setFicha(FICHA_VACIA);
    setMovOd({});
    setMovOi({});
    setOd(REF_VACIA);
    setOi(REF_VACIA);
    setPrecargadoDe('');
  };

  /**
   * CU-02 paso 4: al abrir el expediente se cargan los parámetros y los
   * antecedentes de la última consulta como punto de partida. Los antecedentes
   * no cambian de una visita a otra; el resto de la ficha sí, y se deja vacío.
   */
  const precargarUltima = (d: ExpedienteDetalle) => {
    const ultima = d.evaluaciones[0];
    if (!ultima) {
      setPrecargadoDe('');
      return;
    }
    setFicha((f) => ({
      ...f,
      antOculares: ultima.antOculares ?? '',
      antFamiliares: ultima.antFamiliares ?? '',
      antPersonales: ultima.antPersonales ?? '',
      antMedicamentosos: ultima.antMedicamentosos ?? '',
    }));
    if (!ultima.refracciones?.length) {
      setPrecargadoDe('');
      return;
    }
    setOd(aFormulario(ultima.refracciones.find((r) => r.ojo === Ojo.DERECHO)));
    setOi(
      aFormulario(ultima.refracciones.find((r) => r.ojo === Ojo.IZQUIERDO)),
    );
    setPrecargadoDe(fechaCorta(ultima.fecha));
  };

  const cargarDetalle = (id: number, precargar = false) => {
    if (!id) {
      setDetalle(null);
      return;
    }
    expedientePorPaciente(id)
      .then((d) => {
        setDetalle(d);
        if (precargar && puedeDocumentar) {
          precargarUltima(d);
        }
        setConExpediente((prev) => new Set(prev).add(id));
      })
      .catch((e) => setError(mensajeDeError(e)));
  };

  const abrirExpediente = (p: Persona) => {
    setError('');
    setAviso('');
    limpiarFormulario();
    setIdPaciente(p.idPersona);
    cargarDetalle(p.idPersona, true);
  };

  const volverAlBuscador = () => {
    setIdPaciente(0);
    setDetalle(null);
    setError('');
    setAviso('');
    limpiarFormulario();
  };

  /** Texto vacío → `undefined`, para no guardar cadenas en blanco. */
  const texto = (v: string): string | undefined => v.trim() || undefined;
  const numero = (v: string): number | undefined =>
    v.trim() === '' ? undefined : Number(v);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setAviso('');
    if (!idPaciente) {
      setError(t('exp.seleccionePaciente'));
      return;
    }
    if (hayFueraDeRango) {
      setError(t('exp.corrijaRango'));
      return;
    }
    setGuardando(true);
    try {
      const refracciones = [
        construirRefraccion(Ojo.DERECHO, od),
        construirRefraccion(Ojo.IZQUIERDO, oi),
      ].filter((r): r is NuevaRefraccion => r !== null);
      const movimientos =
        Object.keys(movOd).length || Object.keys(movOi).length
          ? { od: movOd, oi: movOi }
          : undefined;
      const payload: NuevaEvaluacion = {
        idPaciente,
        diagnosticos: ficha.diagnosticos
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        refracciones: refracciones.length ? refracciones : undefined,
        motivoConsulta: texto(ficha.motivoConsulta),
        ultimoControl: texto(ficha.ultimoControl),
        remitidoPor: texto(ficha.remitidoPor),
        antOculares: texto(ficha.antOculares),
        antFamiliares: texto(ficha.antFamiliares),
        antPersonales: texto(ficha.antPersonales),
        antMedicamentosos: texto(ficha.antMedicamentosos),
        rxEnUso: texto(ficha.rxEnUso),
        tiempoUso: texto(ficha.tiempoUso),
        avScOd: texto(ficha.avScOd),
        avScOi: texto(ficha.avScOi),
        avScAo: texto(ficha.avScAo),
        avCcOd: texto(ficha.avCcOd),
        avCcOi: texto(ficha.avCcOi),
        avCcAo: texto(ficha.avCcAo),
        pioOd: numero(ficha.pioOd),
        pioOi: numero(ficha.pioOi),
        movimientosOculares: movimientos,
        dp: numero(ficha.dp),
        ppc: numero(ficha.ppc),
        vergenciasForias: texto(ficha.vergenciasForias),
        segmentoExterno: texto(ficha.segmentoExterno),
        oftalmoscopia: texto(ficha.oftalmoscopia),
        refraccionTexto: texto(ficha.refraccionTexto),
        recomendaciones: texto(ficha.recomendaciones),
        control: texto(ficha.control),
        remisiones: texto(ficha.remisiones),
      };
      const evaluacion = await crearEvaluacion(payload);
      // CU-02 paso 7 / CU-16: persistir y generar la receta en la misma acción.
      try {
        await emitirReceta(evaluacion.idEvaluacionClinica);
        setAviso(t('exp.guardada'));
      } catch (e2) {
        setAviso(`Evaluación guardada, pero ${mensajeDeError(e2)}`);
      }
      limpiarFormulario();
      cargarDetalle(idPaciente);
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setGuardando(false);
    }
  };

  /** CU-02 flujo alterno: cancelar exige confirmación y no guarda nada. */
  const pedirCancelar = () => {
    const fichaVacia = Object.values(ficha).every((v) => v === '');
    const sinMovimientos =
      !Object.keys(movOd).length && !Object.keys(movOi).length;
    if (
      formularioVacio(od) &&
      formularioVacio(oi) &&
      fichaVacia &&
      sinMovimientos
    ) {
      limpiarFormulario();
      return;
    }
    setConfirmarCancelar(true);
  };

  const confirmarDescarte = () => {
    limpiarFormulario();
    setConfirmarCancelar(false);
    setAviso(t('exp.descartada'));
  };

  const emitir = async (idEvaluacion: number) => {
    setError('');
    try {
      await emitirReceta(idEvaluacion);
      cargarDetalle(idPaciente);
    } catch (e) {
      setError(mensajeDeError(e));
    }
  };

  const campoRefraccion = (
    etiqueta: string,
    valores: RefraccionForm,
    set: (v: RefraccionForm) => void,
  ) => (
    <fieldset className="border border-neutral-200 p-4 dark:border-white/10">
      <legend className="px-2 font-clinico text-[11px] font-bold uppercase tracking-wider2 text-lux-tinta">
        {etiqueta}
      </legend>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CAMPOS_REF.map((c) => (
          <label key={c} className="block">
            <span className={rotuloClinicoClass}>{t(ETIQUETA_REF[c])}</span>
            <input
              type="number"
              step={c === 'eje' ? '1' : '0.25'}
              className={cx(
                fieldInputClass,
                fueraDeRango(c, valores[c]) &&
                  '!border-red-500 focus:!ring-red-400',
              )}
              value={valores[c]}
              onChange={(e) => set({ ...valores, [c]: e.target.value })}
            />
            {fueraDeRango(c, valores[c]) ? (
              <span className="mt-1 block text-[10px] font-semibold text-red-600">{t('exp.fueraRango')}</span>
            ) : null}
          </label>
        ))}
      </div>
    </fieldset>
  );

  /** Agudeza visual en el formato del papel: OD / OI / AO. */
  const filaAgudeza = (
    titulo: string,
    claves: [keyof FichaForm, keyof FichaForm, keyof FichaForm],
  ) => (
    <div>
      <span className={rotuloClinicoClass}>{titulo}</span>
      <div className="mt-1.5 grid grid-cols-3 gap-3">
        {(['OD', 'OI', 'AO'] as const).map((ojo, i) => (
          <label key={ojo} className="block">
            <span className="font-clinico text-[10px] font-bold uppercase tracking-wider2 text-neutral-400">
              {ojo}
            </span>
            <input
              className={cx(fieldInputClass, 'mt-1')}
              placeholder="20/20"
              value={ficha[claves[i]]}
              onChange={(e) => campo(claves[i])(e.target.value)}
            />
          </label>
        ))}
      </div>
    </div>
  );

  /** Ficha completa de una evolución ya guardada (solo lectura). */
  const fichaGuardada = (ev: Evaluacion) => {
    const movimientos = ev.movimientosOculares;
    const hayMovimientos =
      movimientos &&
      (Object.keys(movimientos.od ?? {}).length ||
        Object.keys(movimientos.oi ?? {}).length);
    return (
      <div className="mt-4 space-y-4 border-t border-neutral-100 pt-4 dark:border-white/5">
        <div className="grid gap-4 sm:grid-cols-2">
          <DatoFicha etiqueta={t('exp.campo.motivo')} valor={ev.motivoConsulta} />
          <DatoFicha etiqueta={t('exp.campo.ultimoControl')} valor={ev.ultimoControl} />
          <DatoFicha etiqueta={t('exp.campo.remitidoPor')} valor={ev.remitidoPor} />
          <DatoFicha etiqueta={t('exp.campo.antOculares')} valor={ev.antOculares} />
          <DatoFicha
            etiqueta={t('exp.campo.antFamiliares')}
            valor={ev.antFamiliares}
          />
          <DatoFicha
            etiqueta={t('exp.campo.antPersonales')}
            valor={ev.antPersonales}
          />
          <DatoFicha
            etiqueta={t('exp.campo.antMedicamentosos')}
            valor={ev.antMedicamentosos}
          />
          <DatoFicha etiqueta={t('exp.campo.rxLensometria')} valor={ev.rxEnUso} />
          <DatoFicha etiqueta={t('exp.campo.tiempoUso')} valor={ev.tiempoUso} />
          <DatoFicha
            etiqueta={t('exp.campo.avSinCorreccion')}
            valor={
              ev.avScOd || ev.avScOi || ev.avScAo
                ? `OD ${textoODefecto(ev.avScOd)} · OI ${textoODefecto(ev.avScOi)} · AO ${textoODefecto(ev.avScAo)}`
                : null
            }
          />
          <DatoFicha
            etiqueta={t('exp.campo.avConCorreccion')}
            valor={
              ev.avCcOd || ev.avCcOi || ev.avCcAo
                ? `OD ${textoODefecto(ev.avCcOd)} · OI ${textoODefecto(ev.avCcOi)} · AO ${textoODefecto(ev.avCcAo)}`
                : null
            }
          />
          <DatoFicha
            etiqueta={t('exp.campo.pio')}
            valor={
              ev.pioOd || ev.pioOi
                ? `OD ${textoODefecto(ev.pioOd)} mmHg · OI ${textoODefecto(ev.pioOi)} mmHg`
                : null
            }
          />
          <DatoFicha
            etiqueta={t('exp.campo.dpPpc')}
            valor={
              ev.dp || ev.ppc
                ? `DP ${textoODefecto(ev.dp)} mm · PPC ${textoODefecto(ev.ppc)} mm`
                : null
            }
          />
          <DatoFicha
            etiqueta={t('exp.campo.vergencias')}
            valor={ev.vergenciasForias}
          />
          <DatoFicha etiqueta={t('exp.campo.segmentoExterno')} valor={ev.segmentoExterno} />
          <DatoFicha etiqueta={t('exp.campo.oftalmoscopia')} valor={ev.oftalmoscopia} />
          <DatoFicha
            etiqueta={t('exp.campo.refraccionObjSubj')}
            valor={ev.refraccionTexto}
          />
          <DatoFicha
            etiqueta={t('exp.campo.recomendaciones')}
            valor={ev.recomendaciones}
          />
          <DatoFicha etiqueta={t('exp.campo.control')} valor={ev.control} />
          <DatoFicha etiqueta={t('exp.campo.remisiones')} valor={ev.remisiones} />
        </div>
        {hayMovimientos ? (
          <div>
            <span className="block font-clinico text-[10px] font-bold uppercase tracking-wider2 text-neutral-400">{t('exp.motilidad')}</span>
            <div className="mt-2 grid gap-4 sm:grid-cols-2">
              <DiagramaMotilidad
                ojo="OD"
                valor={movimientos?.od ?? {}}
                soloLectura
              />
              <DiagramaMotilidad
                ojo="OI"
                valor={movimientos?.oi ?? {}}
                soloLectura
              />
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <section className="space-y-10">
      <SectionHeader
        kicker={t('exp.kicker')}
        title={t('exp.titulo')}
        titleClassName="font-clinico font-bold uppercase"
        description={
          puedeDocumentar
            ? t('exp.descripcionDoctor')
            : t('exp.descripcionSupervision')
        }
        actions={
          <Badge tone={puedeDocumentar ? 'tinta' : 'blue'}>
            {puedeDocumentar
              ? t('exp.modoDoctor')
              : t('exp.modoSupervision')}
          </Badge>
        }
      />

      {error ? <Alert>{error}</Alert> : null}
      {aviso ? (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 border border-emerald-500/30 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
        >
          <ShieldCheck className="h-4 w-4 shrink-0" /> {aviso}
        </motion.p>
      ) : null}

      {!pacienteActivo ? (
        <>
          {/* ── Indicadores del dashboard médico ─────────────────────────── */}
          <motion.div
            variants={stagger}
            initial="initial"
            animate="animate"
            className="grid gap-4 sm:grid-cols-3"
          >
            {[
              {
                label: t('exp.pacientesRegistrados'),
                valor: pacientes.length,
                icono: UserRound,
              },
              {
                label: t('exp.expedientesAbiertos'),
                valor: conExpediente.size,
                icono: FolderOpen,
              },
              {
                label: t('exp.coincidencias'),
                valor: filtrados.length,
                icono: Search,
              },
            ].map((k) => (
              <motion.div key={k.label} variants={fadeUpItem}>
                <LuxCard hover className="flex items-center gap-4 p-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-lux-tinta/40 text-lux-tinta">
                    <k.icono className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                  <div>
                    <span className="block font-clinico text-2xl font-bold leading-none text-lux-blue dark:text-white">
                      {k.valor.toString().padStart(2, '0')}
                    </span>
                    <span className="mt-1 block font-clinico text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                      {k.label}
                    </span>
                  </div>
                </LuxCard>
              </motion.div>
            ))}
          </motion.div>

          {/* ── Buscador por cédula (CU-02 paso 1) ───────────────────────── */}
          <motion.div {...fadeUp}>
            <LuxCard className="p-6">
              <div className="space-y-3">
                <Kicker>{t('exp.buscador')}</Kicker>
                <label className="block max-w-xl">
                  <span className={rotuloClinicoClass}>{t('exp.buscadorCampo')}</span>
                  <span className="relative mt-1.5 block">
                    <Search
                      className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
                      strokeWidth={1.5}
                    />
                    <input
                      autoFocus
                      className={cx(fieldInputClass, 'mt-0 pl-10')}
                      placeholder={t('exp.buscadorEjemplo')}
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                    />
                  </span>
                </label>
              </div>
            </LuxCard>
          </motion.div>

          {/* ── Tabla dinámica de historiales ────────────────────────────── */}
          <motion.div {...fadeUp}>
            <LuxCard className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 bg-neutral-50/60 text-left dark:border-white/5 dark:bg-white/5">
                    {[
                      t('persona.cedula'),
                      t('exp.campo.paciente'),
                      t('persona.contacto'),
                      t('exp.expediente'),
                      '',
                    ].map(
                      (h) => (
                        <th
                          key={h}
                          className="px-5 py-3 font-clinico text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400"
                        >
                          {h}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map((p) => (
                    <tr
                      key={p.idPersona}
                      onClick={() => abrirExpediente(p)}
                      className="transition-luxe cursor-pointer border-b border-neutral-50 last:border-0 hover:bg-lux-tinta/5 dark:border-white/5"
                    >
                      <td className="px-5 py-3 font-mono text-xs text-neutral-500 dark:text-neutral-400">
                        {p.cedula}
                      </td>
                      <td className="px-5 py-3 font-medium text-lux-blue dark:text-white">
                        {p.nombre}
                      </td>
                      <td className="px-5 py-3 text-neutral-500 dark:text-neutral-400">
                        {p.telefono || p.correo || '—'}
                      </td>
                      <td className="px-5 py-3">
                        <Badge
                          tone={
                            conExpediente.has(p.idPersona) ? 'green' : 'neutral'
                          }
                        >
                          {conExpediente.has(p.idPersona)
                            ? t('exp.abierto')
                            : t('exp.sinAbrir')}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="transition-luxe font-clinico text-[11px] font-semibold uppercase tracking-wider text-neutral-500 hover:text-lux-tinta">{t('exp.abrir')}</span>
                      </td>
                    </tr>
                  ))}
                  {filtrados.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-10 text-center text-sm text-neutral-400"
                      >
                        {pacientes.length === 0
                          ? t('exp.sinPacientes')
                          : t('exp.sinCoincidencias')}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </LuxCard>
          </motion.div>
        </>
      ) : (
        <>
          {/* ── Ficha del paciente (encabezado del expediente impreso) ───── */}
          <motion.div {...fadeUp}>
            <LuxCard className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center border border-lux-tinta/40 text-lux-tinta">
                    <UserRound className="h-5 w-5" strokeWidth={1.5} />
                  </span>
                  <div className="space-y-1">
                    <Kicker>{t('exp.expedienteActivo')}</Kicker>
                    <h2 className="font-clinico text-2xl font-bold uppercase leading-none text-lux-blue dark:text-white">
                      {pacienteActivo.nombre}
                    </h2>
                    <p className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
                      Cédula {pacienteActivo.cedula}
                      {pacienteActivo.telefono
                        ? ` · ${pacienteActivo.telefono}`
                        : ''}
                    </p>
                  </div>
                </div>
                <LuxButton
                  type="button"
                  variant="ghost"
                  onClick={volverAlBuscador}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />{t('exp.cambiarPaciente')}</LuxButton>
              </div>

              <div className="mt-5 grid gap-4 border-t border-neutral-100 pt-4 dark:border-white/5 sm:grid-cols-2 lg:grid-cols-4">
                <DatoFicha
                  etiqueta="Fecha de nacimiento"
                  valor={
                    pacienteActivo.fechaNacimiento
                      ? fechaCorta(pacienteActivo.fechaNacimiento)
                      : null
                  }
                />
                <DatoFicha
                  etiqueta={t('exp.campo.edad')}
                  valor={
                    edadDesde(pacienteActivo.fechaNacimiento) !== null
                      ? `${edadDesde(pacienteActivo.fechaNacimiento)} años`
                      : null
                  }
                />
                <DatoFicha
                  etiqueta="Ocupación"
                  valor={pacienteActivo.ocupacion}
                />
                <DatoFicha
                  etiqueta="Dirección completa"
                  valor={pacienteActivo.direccion}
                />
                <DatoFicha
                  etiqueta={t('exp.campo.contactoEmergencia')}
                  valor={
                    pacienteActivo.contactoEmergencia
                      ? `${pacienteActivo.contactoEmergencia}${
                          pacienteActivo.telefonoEmergencia
                            ? ` · ${pacienteActivo.telefonoEmergencia}`
                            : ''
                        }`
                      : null
                  }
                />
              </div>
              {!pacienteActivo.ocupacion &&
              !pacienteActivo.direccion &&
              !pacienteActivo.contactoEmergencia ? (
                <p className="mt-3 text-[11px] text-neutral-400">
                  Los datos personales del encabezado se completan en{' '}
                  <Link
                    to="/admin/personas"
                    className="link-underline text-lux-blue dark:text-lux-tinta-claro"
                  >
                    Personas
                  </Link>
                  .
                </p>
              ) : null}
            </LuxCard>
          </motion.div>

          {/* ── Nueva evolución: exclusiva del Doctor ────────────────────── */}
          {puedeDocumentar ? (
            <motion.div {...fadeUp}>
              <LuxCard className="p-6">
                <div className="mb-5 flex items-center gap-2 border-b border-neutral-100 pb-4 dark:border-white/5">
                  <Stethoscope
                    className="h-4 w-4 text-lux-tinta"
                    strokeWidth={1.5}
                  />
                  <h2 className="font-clinico text-[13px] font-bold uppercase tracking-wider2 text-neutral-700 dark:text-neutral-200">{t('exp.nuevaEvolucion')}</h2>
                </div>
                {precargadoDe ? (
                  <p className="mb-4 flex items-center gap-2 border border-lux-tinta/30 bg-lux-tinta/5 px-3 py-2 text-[11px] font-medium text-neutral-600 dark:text-neutral-300">
                    <History className="h-3.5 w-3.5 shrink-0 text-lux-tinta" />
                    Se precargaron los parámetros de la consulta del{' '}
                    {precargadoDe}. Ajústelos según la evaluación de hoy.
                  </p>
                ) : null}
                <form onSubmit={onSubmit} className="space-y-5">
                  <BloqueFicha titulo="Consulta">
                    <CampoTexto
                      etiqueta={t('exp.campo.motivo')}
                      valor={ficha.motivoConsulta}
                      onChange={campo('motivoConsulta')}
                      filas={2}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <CampoTexto
                        etiqueta={t('exp.campo.ultimoControl')}
                        valor={ficha.ultimoControl}
                        onChange={campo('ultimoControl')}
                      />
                      <CampoTexto
                        etiqueta={t('exp.campo.remitidoPor')}
                        valor={ficha.remitidoPor}
                        onChange={campo('remitidoPor')}
                      />
                    </div>
                  </BloqueFicha>

                  <BloqueFicha titulo="Antecedentes">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <CampoTexto
                        etiqueta={t('exp.campo.antOculares')}
                        valor={ficha.antOculares}
                        onChange={campo('antOculares')}
                        filas={2}
                      />
                      <CampoTexto
                        etiqueta={t('exp.campo.antFamiliares')}
                        valor={ficha.antFamiliares}
                        onChange={campo('antFamiliares')}
                        filas={2}
                      />
                      <CampoTexto
                        etiqueta={t('exp.campo.antPersonales')}
                        valor={ficha.antPersonales}
                        onChange={campo('antPersonales')}
                        filas={2}
                      />
                      <CampoTexto
                        etiqueta={t('exp.campo.antMedicamentosos')}
                        valor={ficha.antMedicamentosos}
                        onChange={campo('antMedicamentosos')}
                        filas={2}
                      />
                    </div>
                  </BloqueFicha>

                  <BloqueFicha titulo="RX en uso (lesometría)">
                    <CampoTexto
                      etiqueta={t('exp.campo.rxEnUso')}
                      valor={ficha.rxEnUso}
                      onChange={campo('rxEnUso')}
                      filas={2}
                    />
                    <CampoTexto
                      etiqueta={t('exp.campo.tiempoUso')}
                      valor={ficha.tiempoUso}
                      onChange={campo('tiempoUso')}
                    />
                  </BloqueFicha>

                  <BloqueFicha titulo="Agudeza visual">
                    {filaAgudeza(t('exp.sinCorreccion'), [
                      'avScOd',
                      'avScOi',
                      'avScAo',
                    ])}
                    {filaAgudeza(t('exp.conCorreccion'), [
                      'avCcOd',
                      'avCcOi',
                      'avCcAo',
                    ])}
                  </BloqueFicha>

                  <BloqueFicha titulo="Medidas">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                      <CampoMedida
                        etiqueta={t('exp.campo.pioOd')}
                        campo="pioOd"
                        sufijo="mmHg"
                        valor={ficha.pioOd}
                        onChange={campo('pioOd')}
                      />
                      <CampoMedida
                        etiqueta={t('exp.campo.pioOi')}
                        campo="pioOi"
                        sufijo="mmHg"
                        valor={ficha.pioOi}
                        onChange={campo('pioOi')}
                      />
                      <CampoMedida
                        etiqueta={t('exp.campo.dp')}
                        campo="dp"
                        sufijo="mm"
                        valor={ficha.dp}
                        onChange={campo('dp')}
                      />
                      <CampoMedida
                        etiqueta={t('exp.campo.ppc')}
                        campo="ppc"
                        sufijo="mm"
                        valor={ficha.ppc}
                        onChange={campo('ppc')}
                      />
                    </div>
                    <CampoTexto
                      etiqueta={t('exp.campo.vergencias')}
                      valor={ficha.vergenciasForias}
                      onChange={campo('vergenciasForias')}
                      filas={2}
                    />
                    <CampoTexto
                      etiqueta={t('exp.campo.segmentoExterno')}
                      valor={ficha.segmentoExterno}
                      onChange={campo('segmentoExterno')}
                      filas={2}
                    />
                  </BloqueFicha>

                  <BloqueFicha titulo="Movimientos oculares">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <DiagramaMotilidad
                        ojo="OD"
                        valor={movOd}
                        onChange={setMovOd}
                      />
                      <DiagramaMotilidad
                        ojo="OI"
                        valor={movOi}
                        onChange={setMovOi}
                      />
                    </div>
                  </BloqueFicha>

                  <BloqueFicha titulo="Oftalmoscopia directa (sin dilatar)">
                    <CampoTexto
                      etiqueta={t('exp.campo.hallazgos')}
                      valor={ficha.oftalmoscopia}
                      onChange={campo('oftalmoscopia')}
                      filas={3}
                    />
                  </BloqueFicha>

                  <BloqueFicha titulo="Refracción (objetiva-subjetiva)">
                    <CampoTexto
                      etiqueta={t('exp.campo.refraccion')}
                      valor={ficha.refraccionTexto}
                      onChange={campo('refraccionTexto')}
                      filas={4}
                    />
                  </BloqueFicha>

                  {/* La tabla estructurada es el RX Final: lo que se sella en la
                      receta criptográfica (CU-16). */}
                  <BloqueFicha titulo="RX Final">
                    <div className="grid gap-4 lg:grid-cols-2">
                      {campoRefraccion(t('exp.ojoDerecho'), od, setOd)}
                      {campoRefraccion(t('exp.ojoIzquierdo'), oi, setOi)}
                    </div>
                  </BloqueFicha>

                  <BloqueFicha titulo="Cierre de la consulta">
                    <CampoTexto
                      etiqueta={t('exp.campo.impresion')}
                      valor={ficha.diagnosticos}
                      onChange={campo('diagnosticos')}
                      filas={3}
                    />
                    <CampoTexto
                      etiqueta={t('exp.campo.recomendaciones')}
                      valor={ficha.recomendaciones}
                      onChange={campo('recomendaciones')}
                      filas={3}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <CampoTexto
                        etiqueta={t('exp.campo.control')}
                        valor={ficha.control}
                        onChange={campo('control')}
                      />
                      <CampoTexto
                        etiqueta={t('exp.campo.remisiones')}
                        valor={ficha.remisiones}
                        onChange={campo('remisiones')}
                      />
                    </div>
                  </BloqueFicha>

                  <div className="flex flex-wrap items-center gap-3">
                    <LuxButton
                      type="submit"
                      variant="tinta"
                      disabled={guardando || hayFueraDeRango}
                    >
                      <FileText className="h-3.5 w-3.5" /> Guardar y generar
                      receta
                    </LuxButton>
                    <LuxButton
                      type="button"
                      variant="ghost"
                      onClick={pedirCancelar}
                    >
                      Cancelar
                    </LuxButton>
                    {hayFueraDeRango ? (
                      <span className="text-xs font-semibold text-red-600">{t('exp.hayFueraRango')}</span>
                    ) : null}
                  </div>
                </form>
              </LuxCard>
            </motion.div>
          ) : (
            <motion.div {...fadeUp}>
              <LuxCard className="flex items-start gap-3 border-dashed p-5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-lux-tinta" />
                <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
                  <span className="font-semibold">{t('exp.modoSupervisionCorto')}</span> Puede
                  consultar el historial clínico y las recetas emitidas, pero
                  registrar evoluciones y firmar recetas está reservado al
                  especialista.
                </p>
              </LuxCard>
            </motion.div>
          )}

          {/* ── Historial de evaluaciones ────────────────────────────────── */}
          {detalle ? (
            <div className="space-y-5">
              <h2 className="font-clinico text-xl font-bold uppercase tracking-wider2 text-lux-blue dark:text-white">{t('exp.evoluciones')}</h2>
              {detalle.evaluaciones.length === 0 ? (
                <p className="text-sm text-neutral-400">{t('exp.sinEvaluaciones')}</p>
              ) : null}
              {detalle.evaluaciones.map((ev) => (
                <motion.div key={ev.idEvaluacionClinica} {...fadeUp}>
                  <LuxCard className="p-6">
                    <div className="flex items-center justify-between">
                      <span className="font-clinico text-sm font-bold uppercase tracking-wider2 text-lux-blue dark:text-white">
                        {fechaHora(ev.fecha)} ·{' '}
                        <span className="text-neutral-500">
                          {ev.doctor?.nombre ?? 'Doctor'}
                        </span>
                      </span>
                      {ev.receta ? (
                        <Badge tone="green">{t('exp.recetaSellada')}</Badge>
                      ) : null}
                    </div>

                    {ev.diagnosticos?.length ? (
                      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                        <span className="font-clinico uppercase tracking-wider2 text-neutral-400">
                          Impresión diagnóstica:{' '}
                        </span>
                        {ev.diagnosticos.join(', ')}
                      </p>
                    ) : null}
                    {ev.notas ? (
                      <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                        {ev.notas}
                      </p>
                    ) : null}

                    {fichaGuardada(ev)}

                    {ev.refracciones?.length ? (
                      <div className="mt-4 overflow-x-auto">
                        <span className="block font-clinico text-[10px] font-bold uppercase tracking-wider2 text-neutral-400">{t('exp.rxFinal')}</span>
                        <table className="mt-2 w-full max-w-lg text-left text-sm">
                          <thead>
                            <tr className="border-b border-neutral-100 dark:border-white/5">
                              {[
                                'Ojo',
                                'Esfera',
                                'Cilindro',
                                'Eje',
                                t('exp.adicion'),
                              ].map((h) => (
                                <th
                                  key={h}
                                  className="py-2 font-clinico text-[10px] font-bold uppercase tracking-widest text-neutral-400"
                                >
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {ev.refracciones.map((r) => (
                              <tr
                                key={r.ojo}
                                className="border-b border-neutral-50 last:border-0 dark:border-white/5"
                              >
                                <td className="py-2 font-semibold text-lux-tinta">
                                  {r.ojo}
                                </td>
                                <td className="py-2">{r.esfera}</td>
                                <td className="py-2">{r.cilindro}</td>
                                <td className="py-2">{r.eje}°</td>
                                <td className="py-2">{r.adicion ?? '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}

                    <div className="mt-4 border-t border-neutral-100 pt-4 dark:border-white/5">
                      {ev.receta ? (
                        <div className="flex flex-wrap items-start gap-4">
                          <img
                            src={ev.receta.codigoQr}
                            alt="QR de la receta"
                            className="h-28 w-28 border border-neutral-200 dark:border-white/10"
                          />
                          <div className="space-y-2 text-sm">
                            <p className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                              <ShieldCheck className="h-4 w-4" />{t('exp.recetaEmitida')}</p>
                            <p className="break-all font-mono text-[10px] text-neutral-400">
                              SHA-256: {ev.receta.hashSha256}
                            </p>
                            <div className="flex flex-wrap gap-3 pt-1">
                              <Link
                                to={`/verificar/${ev.receta.hashSha256}`}
                                className="link-underline font-clinico text-[11px] font-semibold uppercase tracking-wider text-lux-blue dark:text-lux-tinta-claro"
                              >{t('comun.verificar')}</Link>
                              <a
                                href={`${API_BASE}/recetas/${ev.receta.hashSha256}/pdf`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 font-clinico text-[11px] font-semibold uppercase tracking-wider text-lux-blue hover:text-lux-tinta dark:text-lux-tinta-claro"
                              >
                                <Download className="h-3 w-3" /> Descargar PDF
                              </a>
                            </div>
                          </div>
                        </div>
                      ) : puedeDocumentar ? (
                        <LuxButton
                          type="button"
                          variant="ghost"
                          onClick={() => emitir(ev.idEvaluacionClinica)}
                        >
                          <Eye className="h-3.5 w-3.5" />{t('exp.emitirReceta')}</LuxButton>
                      ) : (
                        <span className="text-sm text-neutral-400">{t('exp.sinReceta')}</span>
                      )}
                    </div>
                  </LuxCard>
                </motion.div>
              ))}
            </div>
          ) : null}
        </>
      )}

      {/* ── Confirmación de descarte (CU-02 flujo alterno) ───────────────── */}
      <AnimatePresence>
        {confirmarCancelar ? (
          <motion.div
            key="descartar-fondo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmarCancelar(false)}
            className="fixed inset-0 z-50 cursor-pointer bg-black"
          />
        ) : null}
        {confirmarCancelar ? (
          <motion.div
            key="descartar-dialogo"
            ref={dialogoRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-descartar"
            onKeyDown={(e) => {
              if (e.key === 'Escape') setConfirmarCancelar(false);
            }}
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 outline-none"
          >
            <LuxCard className="w-full max-w-md p-6">
              <div className="mb-4 flex items-center justify-between border-b border-neutral-100 pb-3 dark:border-white/5">
                <span id="titulo-descartar">
                  <Kicker>{t('exp.descartarEvolucion')}</Kicker>
                </span>
                <button
                  type="button"
                  onClick={() => setConfirmarCancelar(false)}
                  className="transition-luxe cursor-pointer rounded-full border border-neutral-200 p-1.5 hover:bg-neutral-100 dark:border-white/10 dark:hover:bg-white/5"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                Se limpiarán los datos de la consulta en curso y no se guardará
                nada en el expediente. ¿Desea continuar?
              </p>
              <div className="mt-6 flex flex-wrap justify-end gap-3">
                <LuxButton
                  type="button"
                  variant="ghost"
                  onClick={() => setConfirmarCancelar(false)}
                >{t('comun.volver')}</LuxButton>
                <LuxButton
                  type="button"
                  variant="danger"
                  onClick={confirmarDescarte}
                >{t('exp.descartar')}</LuxButton>
              </div>
            </LuxCard>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
};
