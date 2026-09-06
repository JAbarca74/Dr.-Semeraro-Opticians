import { useEffect, useState } from 'react';
import { AlertTriangle, MessageCircle, Package, Truck } from 'lucide-react';
import { misPedidos } from '../../core/api/portal.service';
import { parametrosPublicos } from '../../core/api/catalogo.service';
import {
  CLAVE_ETAPA,
  construirMensajePedido,
  type PedidoPaciente,
} from '../../core/models/portal';
import { useIdioma } from '../../core/i18n/idioma.context';
import { enlaceWhatsapp, numeroLegible } from '../../core/models/catalogo';
import { mensajeDeError } from '../../shared/error';
import {
  Alert,
  Badge,
  LuxButton,
  LuxCard,
  SectionHeader,
  cx,
  fieldLabelClass,
} from '../../shared/ui';

/**
 * Seguimiento de pedidos de lentes (CU-14, `DSO-40`).
 *
 * ⚠️ **Las cuatro etapas que se pintan aquí no son los estados internos.** CU-14
 * promete al paciente *Recibido · En fabricación · Listo para retirar ·
 * Entregado*, y el enum de CU-07 es otro (*Enviado a lab · En proceso ·
 * Recibido en clínica · Listo para entrega*). El propio caso de uso advierte del
 * choque. **La traducción la hace el backend** (`PortalService`), no esta
 * pantalla: aquí solo se pinta lo que llega. Se decidió traducir en vez de
 * renombrar el enum porque `DSO-27` y `DSO-28` ya están validados con él.
 */
export const SeguimientoPedidosPage = () => {
  const { t, fechaCorta, fechaHora } = useIdioma();
  const [pedidos, setPedidos] = useState<PedidoPaciente[]>([]);
  const [whatsapp, setWhatsapp] = useState('');
  const [telefono, setTelefono] = useState('');
  const [nombreOptica, setNombreOptica] = useState('la óptica');
  const [error, setError] = useState('');
  const [avisoCanal, setAvisoCanal] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    misPedidos()
      .then((p) => {
        setPedidos(p);
        setError('');
      })
      .catch((e) => setError(mensajeDeError(e, t('pedidos.error'))))
      .finally(() => setCargando(false));

    parametrosPublicos()
      .then((p) => {
        setWhatsapp(p['optica.whatsapp'] ?? '');
        setTelefono(p['optica.telefono'] ?? '');
        setNombreOptica(p['optica.nombre'] ?? 'la óptica');
      })
      .catch(() => {
        // Sin parámetros no se puede redirigir; el botón lo dirá al pulsarlo.
      });
    // `t` solo se usa para el texto de respaldo del error. Meterlo en las
    // dependencias haría que cambiar de idioma volviera a pedir los datos a la
    // API, que no es lo que pide un cambio de idioma.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Flujo alterno de CU-14: consultar por WhatsApp con el n.º de pedido. */
  const consultar = (pedido: PedidoPaciente) => {
    setAvisoCanal('');
    const respaldo = telefono
      ? `Llámenos al ${telefono}.`
      : t('contacto.llamePorTelefono');

    if (!whatsapp) {
      setAvisoCanal(`Canal no disponible. ${respaldo}`);
      return;
    }
    const mensaje = construirMensajePedido(pedido, nombreOptica);
    const ventana = window.open(enlaceWhatsapp(whatsapp, mensaje), '_blank');
    if (!ventana) {
      setAvisoCanal(
        `Canal no disponible. ${telefono ? respaldo : `Llámenos al ${numeroLegible(whatsapp)}.`}`,
      );
    }
  };

  return (
    <section className="space-y-10">
      <SectionHeader
        kicker={t('pedidos.kicker')}
        title={t('pedidos.titulo')}
        description={t('pedidos.descripcion')}
      />

      {error ? <Alert>{error}</Alert> : null}

      {avisoCanal ? (
        <p
          role="alert"
          className="border border-amber-300/40 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-300"
        >
          {avisoCanal}
        </p>
      ) : null}

      {/*
        ⚠️ **El vacío solo se pinta si NO hubo error.** Antes se mostraban las
        dos cosas a la vez, y el vacío mentía: con la carga fallida la lista
        seguía en `[]`, así que encima del aviso de error aparecía un mensaje
        afirmando que no había nada. Es el patrón que ya usa `MisExpedientes`.
      */}
      {pedidos.length === 0 ? (
        error ? null : (
          <LuxCard className="flex flex-col items-center gap-4 p-12 text-center">
            <Package className="h-9 w-9 text-neutral-300" strokeWidth={1.3} />
            <p className="text-sm text-neutral-500">
              {cargando ? t('pedidos.cargando') : t('pedidos.vacio')}
            </p>
          </LuxCard>
        )
      ) : (
        <div className="space-y-6">
          {pedidos.map((pedido) => {
            const cancelado = pedido.indiceEtapa === null;
            return (
              <LuxCard key={pedido.idOrdenLaboratorio} className="p-7">
                <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-lux-tinta">
                      {t('pedidos.numero')} #{pedido.idOrdenLaboratorio}
                    </p>
                    <h3 className="mt-1 font-serif text-xl italic font-light text-lux-blue dark:text-white">
                      {pedido.laboratorio}
                    </h3>
                  </div>
                  {/*
                    Se traduce por posición, no por el texto que manda la API:
                    `pedido.etapa` llega siempre en español (ver `CLAVE_ETAPA`).
                  */}
                  <Badge tone={cancelado ? 'red' : 'tinta'}>
                    {cancelado
                      ? t('pedidos.etapa.cancelado')
                      : t(CLAVE_ETAPA[pedido.indiceEtapa ?? 0])}
                  </Badge>
                </div>

                {/*
                  CU-14 paso 6: el avance en cuatro etapas. Un pedido cancelado
                  no tiene sitio en la barra (EX-17), así que se rotula aparte.
                */}
                {cancelado ? (
                  <p className="mb-5 flex items-start gap-2 border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                    <span>
                      {t('pedidos.cancelado.aviso')}
                    </span>
                  </p>
                ) : (
                  <ol className="mb-5 grid gap-2 sm:grid-cols-4">
                    {CLAVE_ETAPA.map((clave, indice) => {
                      const alcanzada = indice <= (pedido.indiceEtapa ?? -1);
                      return (
                        <li key={clave} className="flex flex-col gap-1.5">
                          <span
                            className={cx(
                              'h-1',
                              alcanzada
                                ? 'bg-lux-tinta'
                                : 'bg-neutral-200 dark:bg-neutral-800',
                            )}
                          />
                          <span
                            className={cx(
                              'text-[10px] uppercase tracking-wider',
                              alcanzada
                                ? 'font-bold text-lux-blue dark:text-white'
                                : 'text-neutral-400',
                            )}
                          >
                            {t(clave)}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                )}

                {pedido.retrasado ? (
                  <p className="mb-5 flex items-start gap-2 border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/30 dark:text-amber-300">
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                    <span>
                      {t('pedidos.retraso')}
                    </span>
                  </p>
                ) : null}

                <dl className="grid gap-3 text-xs sm:grid-cols-3">
                  <div>
                    <dt className={fieldLabelClass}>{t('pedidos.solicitado')}</dt>
                    <dd className="text-neutral-600 dark:text-neutral-300">
                      {fechaCorta(pedido.fechaSolicitud)}
                    </dd>
                  </div>
                  <div>
                    <dt className={fieldLabelClass}>{t('pedidos.entregaEstimada')}</dt>
                    <dd className="text-neutral-600 dark:text-neutral-300">
                      {fechaCorta(pedido.fechaEstimadaEntrega)}
                    </dd>
                  </div>
                  <div className="sm:col-span-3">
                    <dt className={fieldLabelClass}>{t('pedidos.detalle')}</dt>
                    <dd className="whitespace-pre-line text-neutral-600 dark:text-neutral-300">
                      {pedido.especificaciones}
                    </dd>
                  </div>
                </dl>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-150 pt-4 dark:border-white/10">
                  {/* EX-16: el CU manda decir a qué momento corresponde el dato. */}
                  <p className="text-[10px] text-neutral-400">
                    {t('pedidos.actualizado')} {fechaHora(pedido.actualizadoAl)}
                  </p>
                  <LuxButton
                    type="button"
                    variant="ghost"
                    onClick={() => consultar(pedido)}
                  >
                    <MessageCircle size={13} />
                    {t('pedidos.consultar')}
                  </LuxButton>
                </div>
              </LuxCard>
            );
          })}
        </div>
      )}

      <LuxCard className="flex items-center gap-3 bg-lux-gray p-6 dark:bg-[#0e0e0e]">
        <Truck className="h-5 w-5 shrink-0 text-lux-tinta" strokeWidth={1.3} />
        <p className="text-xs text-neutral-500 dark:text-neutral-400">
          {t('pedidos.pie')}
        </p>
      </LuxCard>
    </section>
  );
};
