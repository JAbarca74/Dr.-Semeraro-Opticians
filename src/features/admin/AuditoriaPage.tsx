import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Download,
  Fingerprint,
  KeyRound,
  RotateCcw,
  ScrollText,
  ShieldCheck,
  X,
} from 'lucide-react';
import { listarUsuarios } from '../../core/api/usuarios.service';
import {
  listarAccesos,
  listarLogs,
  listarTablasAuditadas,
} from '../../core/api/auditoria.service';
import {
  OperacionAuditoria,
  operacionLabel,
  type EventoAcceso,
  type EventoAuditoria,
} from '../../core/models/auditoria';
import type { Usuario } from '../../core/models/usuario';
import { mensajeDeError } from '../../shared/error';
import { aCsv, descargarCsv } from '../../shared/csv';
import {
  Alert,
  Badge,
  Kicker,
  LuxButton,
  LuxCard,
  SectionHeader,
  cx,
  fadeUp,
  fieldInputClass,
  fieldLabelClass,
} from '../../shared/ui';

/** CU-08 paso 2: la vista arranca con los últimos 50 eventos. */
const LIMITE = 50;

type Vista = 'cambios' | 'accesos';

const RESULTADO_ACCESO = {
  todos: undefined,
  exitosos: true,
  fallidos: false,
} as const;

type ResultadoAcceso = keyof typeof RESULTADO_ACCESO;

const TONO_OPERACION: Record<OperacionAuditoria, 'green' | 'gold' | 'red'> = {
  INSERT: 'green',
  UPDATE: 'gold',
  DELETE: 'red',
};

const fechaLarga = (iso: string): string =>
  new Date(iso).toLocaleString('es-CR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const comoTexto = (valor: unknown): string =>
  valor === null || valor === undefined ? '' : JSON.stringify(valor, null, 2);

/**
 * Visor de auditoría del Administrador (CU-08): qué se cambió, quién lo cambió
 * y desde dónde, más la bitácora de inicios de sesión. Es solo lectura: el
 * rastro no se edita ni se borra desde la aplicación.
 */
export const AuditoriaPage = () => {
  const [vista, setVista] = useState<Vista>('cambios');
  const [cambios, setCambios] = useState<EventoAuditoria[]>([]);
  const [accesos, setAccesos] = useState<EventoAcceso[]>([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [tablas, setTablas] = useState<string[]>([]);
  const [idUsuario, setIdUsuario] = useState('');
  const [tabla, setTabla] = useState('');
  const [operacion, setOperacion] = useState('');
  const [resultado, setResultado] = useState<ResultadoAcceso>('todos');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [seleccionado, setSeleccionado] = useState<EventoAuditoria | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const filtrosBase = useMemo(
    () => ({
      idUsuario: idUsuario ? Number(idUsuario) : undefined,
      desde: desde || undefined,
      hasta: hasta || undefined,
      limite: LIMITE,
      pagina,
    }),
    [idUsuario, desde, hasta, pagina],
  );

  const consultar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      if (vista === 'cambios') {
        const pag = await listarLogs({
          ...filtrosBase,
          tabla: tabla || undefined,
          operacion: (operacion as OperacionAuditoria) || undefined,
        });
        setCambios(pag.registros);
        setTotal(pag.total);
      } else {
        const pag = await listarAccesos({
          ...filtrosBase,
          exitoso: RESULTADO_ACCESO[resultado],
        });
        setAccesos(pag.registros);
        setTotal(pag.total);
      }
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo consultar la auditoría'));
    } finally {
      setCargando(false);
    }
  }, [vista, filtrosBase, tabla, operacion, resultado]);

  useEffect(() => {
    void consultar();
  }, [consultar]);

  useEffect(() => {
    listarUsuarios().then(setUsuarios).catch(() => undefined);
    listarTablasAuditadas().then(setTablas).catch(() => undefined);
  }, []);

  const limpiar = () => {
    setIdUsuario('');
    setTabla('');
    setOperacion('');
    setResultado('todos');
    setDesde('');
    setHasta('');
    setPagina(1);
    setSeleccionado(null);
  };

  const cambiarVista = (siguiente: Vista) => {
    setVista(siguiente);
    setPagina(1);
    setSeleccionado(null);
  };

  /** CU-08 flujo alterno: «Descargar Reporte» con la vista tal como está. */
  const exportar = () => {
    const hoy = new Date().toISOString().slice(0, 10);
    if (vista === 'cambios') {
      descargarCsv(
        `auditoria-cambios-${hoy}.csv`,
        aCsv(
          [
            'Fecha',
            'Usuario',
            'Tabla',
            'Registro',
            'Operación',
            'Valor anterior',
            'Valor nuevo',
            'IP',
          ],
          cambios.map((e) => [
            fechaLarga(e.fecha),
            e.usuario?.email ?? 'Sistema',
            e.tabla,
            e.registroId,
            operacionLabel(e.operacion),
            e.valorAnterior,
            e.valorNuevo,
            e.ip,
          ]),
        ),
      );
      return;
    }
    descargarCsv(
      `auditoria-accesos-${hoy}.csv`,
      aCsv(
        ['Fecha', 'Usuario', 'Resultado', 'IP'],
        accesos.map((a) => [
          fechaLarga(a.fecha),
          a.usuario?.email ?? 'Desconocido',
          a.exitoso ? 'Exitoso' : 'Fallido',
          a.ip,
        ]),
      ),
    );
  };

  const hayRegistros =
    vista === 'cambios' ? cambios.length > 0 : accesos.length > 0;
  const ultimaPagina = Math.max(1, Math.ceil(total / LIMITE));

  return (
    <section className="space-y-10">
      <SectionHeader
        kicker="Trazabilidad"
        title="Auditoría del sistema"
        description="Registro inalterable de las operaciones críticas: quién modificó qué dato, cuándo y desde qué dirección."
        actions={
          <LuxButton
            type="button"
            variant="ghost"
            onClick={exportar}
            disabled={!hayRegistros}
          >
            <Download className="h-3.5 w-3.5" /> Descargar reporte
          </LuxButton>
        }
      />

      {error ? <Alert>{error}</Alert> : null}

      {/* ── Selector de vista ────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'cambios', label: 'Cambios de datos', icono: ScrollText },
            { id: 'accesos', label: 'Accesos al sistema', icono: KeyRound },
          ] as const
        ).map((op) => (
          <button
            key={op.id}
            type="button"
            onClick={() => cambiarVista(op.id)}
            className={cx(
              'transition-luxe flex cursor-pointer items-center gap-2 border px-4 py-2 text-[11px] font-bold uppercase tracking-widest',
              vista === op.id
                ? 'border-lux-gold bg-lux-gold/10 text-lux-gold'
                : 'border-neutral-200 text-neutral-500 hover:border-lux-gold/40 dark:border-white/10 dark:text-neutral-400',
            )}
          >
            <op.icono className="h-3.5 w-3.5" strokeWidth={1.5} />
            {op.label}
          </button>
        ))}
      </div>

      {/* ── Filtros (CU-08 pasos 3 y 4) ──────────────────────────────────── */}
      <motion.div {...fadeUp}>
        <LuxCard className="p-6">
          <Kicker>Filtros de búsqueda</Kicker>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className={fieldLabelClass}>Usuario</span>
              <select
                className={fieldInputClass}
                value={idUsuario}
                onChange={(e) => {
                  setIdUsuario(e.target.value);
                  setPagina(1);
                }}
              >
                <option value="">Todos</option>
                {usuarios.map((u) => (
                  <option key={u.idUsuario} value={u.idUsuario}>
                    {u.email}
                  </option>
                ))}
              </select>
            </label>

            {vista === 'cambios' ? (
              <>
                <label className="block">
                  <span className={fieldLabelClass}>Tabla</span>
                  <select
                    className={fieldInputClass}
                    value={tabla}
                    onChange={(e) => {
                      setTabla(e.target.value);
                      setPagina(1);
                    }}
                  >
                    <option value="">Todas</option>
                    {tablas.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className={fieldLabelClass}>Operación</span>
                  <select
                    className={fieldInputClass}
                    value={operacion}
                    onChange={(e) => {
                      setOperacion(e.target.value);
                      setPagina(1);
                    }}
                  >
                    <option value="">Todas</option>
                    {Object.values(OperacionAuditoria).map((o) => (
                      <option key={o} value={o}>
                        {operacionLabel(o)}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : (
              <label className="block">
                <span className={fieldLabelClass}>Resultado</span>
                <select
                  className={fieldInputClass}
                  value={resultado}
                  onChange={(e) => {
                    setResultado(e.target.value as ResultadoAcceso);
                    setPagina(1);
                  }}
                >
                  <option value="todos">Todos</option>
                  <option value="exitosos">Solo exitosos</option>
                  <option value="fallidos">Solo fallidos</option>
                </select>
              </label>
            )}

            <label className="block">
              <span className={fieldLabelClass}>Desde</span>
              <input
                type="date"
                className={fieldInputClass}
                value={desde}
                onChange={(e) => {
                  setDesde(e.target.value);
                  setPagina(1);
                }}
              />
            </label>
            <label className="block">
              <span className={fieldLabelClass}>Hasta</span>
              <input
                type="date"
                className={fieldInputClass}
                value={hasta}
                onChange={(e) => {
                  setHasta(e.target.value);
                  setPagina(1);
                }}
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <LuxButton type="button" variant="ghost" onClick={limpiar}>
              <RotateCcw className="h-3.5 w-3.5" /> Limpiar filtros
            </LuxButton>
            <span className="text-[11px] uppercase tracking-widest text-neutral-400">
              {cargando ? 'Consultando…' : `${total} evento(s)`}
            </span>
          </div>
        </LuxCard>
      </motion.div>

      {/* ── Tabla de eventos ─────────────────────────────────────────────── */}
      <motion.div {...fadeUp}>
        <LuxCard className="overflow-x-auto">
          {vista === 'cambios' ? (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/60 text-left dark:border-white/5 dark:bg-white/5">
                  {['Fecha', 'Usuario', 'Tabla', 'Registro', 'Operación', 'IP'].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400"
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {cambios.map((e) => (
                  <tr
                    key={e.idLogAuditoria}
                    onClick={() => setSeleccionado(e)}
                    className="transition-luxe cursor-pointer border-b border-neutral-50 last:border-0 hover:bg-lux-gold/5 dark:border-white/5"
                  >
                    <td className="whitespace-nowrap px-5 py-3 text-neutral-500 dark:text-neutral-400">
                      {fechaLarga(e.fecha)}
                    </td>
                    <td className="px-5 py-3 font-medium text-lux-blue dark:text-white">
                      {e.usuario?.email ?? 'Sistema'}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-neutral-500 dark:text-neutral-400">
                      {e.tabla}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-neutral-500 dark:text-neutral-400">
                      #{e.registroId}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={TONO_OPERACION[e.operacion]}>
                        {operacionLabel(e.operacion)}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-neutral-400">
                      {e.ip ?? '—'}
                    </td>
                  </tr>
                ))}
                {cambios.length === 0 && !cargando ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-sm text-neutral-400"
                    >
                      No se encontraron registros.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 bg-neutral-50/60 text-left dark:border-white/5 dark:bg-white/5">
                  {['Fecha', 'Usuario', 'Resultado', 'IP'].map((h) => (
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
                {accesos.map((a) => (
                  <tr
                    key={a.idBitacoraAcceso}
                    className="border-b border-neutral-50 last:border-0 dark:border-white/5"
                  >
                    <td className="whitespace-nowrap px-5 py-3 text-neutral-500 dark:text-neutral-400">
                      {fechaLarga(a.fecha)}
                    </td>
                    <td className="px-5 py-3 font-medium text-lux-blue dark:text-white">
                      {a.usuario?.email ?? 'Desconocido'}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={a.exitoso ? 'green' : 'red'}>
                        {a.exitoso ? 'Exitoso' : 'Fallido'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-neutral-400">
                      {a.ip}
                    </td>
                  </tr>
                ))}
                {accesos.length === 0 && !cargando ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-10 text-center text-sm text-neutral-400"
                    >
                      No se encontraron registros.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </LuxCard>
      </motion.div>

      {/* ── Paginación ───────────────────────────────────────────────────── */}
      {total > LIMITE ? (
        <div className="flex items-center justify-between">
          <LuxButton
            type="button"
            variant="ghost"
            disabled={pagina <= 1}
            onClick={() => setPagina((p) => p - 1)}
          >
            Anterior
          </LuxButton>
          <span className="text-[11px] uppercase tracking-widest text-neutral-400">
            Página {pagina} de {ultimaPagina}
          </span>
          <LuxButton
            type="button"
            variant="ghost"
            disabled={pagina >= ultimaPagina}
            onClick={() => setPagina((p) => p + 1)}
          >
            Siguiente
          </LuxButton>
        </div>
      ) : null}

      {/* ── Detalle del evento (CU-08 pasos 5 y 6) ───────────────────────── */}
      {seleccionado ? (
        <motion.div {...fadeUp}>
          <LuxCard className="p-6">
            <div className="mb-4 flex items-start justify-between gap-4 border-b border-neutral-100 pb-4 dark:border-white/5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-lux-gold/40 text-lux-gold">
                  <Fingerprint className="h-4 w-4" strokeWidth={1.5} />
                </span>
                <div>
                  <Kicker>Detalle del evento</Kicker>
                  <p className="mt-1 text-sm font-semibold text-lux-blue dark:text-white">
                    {operacionLabel(seleccionado.operacion)} en{' '}
                    <span className="font-mono">{seleccionado.tabla}</span> · #
                    {seleccionado.registroId}
                  </p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    {fechaLarga(seleccionado.fecha)} ·{' '}
                    {seleccionado.usuario?.email ?? 'Sistema'} ·{' '}
                    {seleccionado.ip ?? 'sin IP'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Cerrar detalle"
                onClick={() => setSeleccionado(null)}
                className="transition-luxe cursor-pointer rounded-full border border-neutral-200 p-1.5 hover:bg-neutral-100 dark:border-white/10 dark:hover:bg-white/5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <span className={fieldLabelClass}>Valor anterior</span>
                {seleccionado.valorAnterior ? (
                  <pre className="mt-1.5 max-h-64 overflow-auto border border-neutral-200 bg-neutral-50 p-3 font-mono text-[11px] text-neutral-600 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300">
                    {comoTexto(seleccionado.valorAnterior)}
                  </pre>
                ) : (
                  <p className="mt-1.5 flex items-start gap-2 border border-dashed border-neutral-200 p-3 text-[11px] leading-relaxed text-neutral-500 dark:border-white/10 dark:text-neutral-400">
                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-lux-gold" />
                    El sistema aún no conserva el valor previo de esta operación.
                  </p>
                )}
              </div>
              <div>
                <span className={fieldLabelClass}>Valor nuevo</span>
                {seleccionado.valorNuevo ? (
                  <pre className="mt-1.5 max-h-64 overflow-auto border border-neutral-200 bg-neutral-50 p-3 font-mono text-[11px] text-neutral-600 dark:border-white/10 dark:bg-white/5 dark:text-neutral-300">
                    {comoTexto(seleccionado.valorNuevo)}
                  </pre>
                ) : (
                  <p className="mt-1.5 border border-dashed border-neutral-200 p-3 text-[11px] text-neutral-500 dark:border-white/10 dark:text-neutral-400">
                    Sin datos registrados.
                  </p>
                )}
              </div>
            </div>
          </LuxCard>
        </motion.div>
      ) : null}
    </section>
  );
};
