import { Calendar, Layers, ShieldAlert, ShoppingBag } from 'lucide-react';
import { RecepcionPlaceholder } from './RecepcionPlaceholder';

export const AgendaRecepcionPage = () => (
  <RecepcionPlaceholder
    cu="Agenda Médica · sprint futuro"
    title="Agenda Médica"
    description="Coordinación de citas del especialista: disponibilidad, confirmaciones y recordatorios al paciente."
    icon={Calendar}
    features={[
      'Bloques de disponibilidad del Dr. Semeraro',
      'Agendar, confirmar, reprogramar y cancelar citas',
      'Recordatorios automáticos por WhatsApp',
      'Vista diaria y semanal del consultorio',
      'Vínculo de la cita con el expediente del paciente',
      'Estados con código de color',
    ]}
  />
);

export const VentasRecepcionPage = () => (
  <RecepcionPlaceholder
    cu="Caja & Ventas · sprint futuro"
    title="Caja & Ventas"
    description="Facturación de mostrador, cobro y generación de órdenes de laboratorio al vender lentes."
    icon={ShoppingBag}
    features={[
      'Carrito con productos de bodega',
      'Venta vinculada a paciente o de mostrador',
      'Orden de laboratorio automática',
      'Arqueo y cierre de caja diario',
      'Anulación con reverso de stock',
      'Comprobante de venta',
    ]}
  />
);

export const ExistenciasRecepcionPage = () => (
  <RecepcionPlaceholder
    cu="Existencias · sprint futuro"
    title="Existencias"
    description="Consulta de stock de monturas y lentes disponibles en la óptica."
    icon={Layers}
    features={[
      'Catálogo por categoría y marca',
      'Disponibilidad y umbrales de alerta',
      'Consulta rápida por SKU',
      'Precio de referencia en colones',
      'Productos públicos del catálogo',
      'Solicitud de reposición',
    ]}
  />
);

export const LaboratorioRecepcionPage = () => (
  <RecepcionPlaceholder
    cu="Logística Taller · sprint futuro"
    title="Logística de Taller"
    description="Seguimiento del estado de las órdenes de laboratorio, desde el envío hasta la entrega al paciente."
    icon={ShieldAlert}
    features={[
      'Estados secuenciales de la orden de cristales',
      'Notificación al paciente cuando esté listo',
      'Detalle de lentes y armazón',
      'Tiempos por etapa del taller',
      'Vínculo con la venta y el paciente',
      'Historial de la orden',
    ]}
  />
);
