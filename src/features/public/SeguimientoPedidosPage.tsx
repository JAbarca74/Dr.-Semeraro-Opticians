import { Truck } from 'lucide-react';
import { Placeholder } from '../../shared/Placeholder';

export const SeguimientoPedidosPage = () => (
  <Placeholder
    kicker="Portal del paciente"
    title="Seguimiento de pedidos"
    description="El seguimiento en tiempo real del estado de sus lentes en el laboratorio llegará en un sprint próximo. Mientras tanto, puede validar su receta en el portal del paciente."
    icon={Truck}
    features={[
      'Estados: enviado, en proceso, recibido y listo',
      'Notificación cuando sus lentes estén listos',
      'Detalle de montura y cristales',
      'Historial de sus órdenes',
    ]}
  />
);
