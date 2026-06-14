import { TrendingUp } from 'lucide-react';
import { Placeholder } from '../../shared/Placeholder';

export const MetricasPage = () => (
  <Placeholder
    title="Métricas e indicadores"
    description="Tableros de ventas, rotación de inventario y ocupación de la agenda para la toma de decisiones."
    icon={TrendingUp}
    features={[
      'Ventas por período y por vendedor',
      'Productos más vendidos y de baja rotación',
      'Ocupación de la agenda del especialista',
      'Pacientes nuevos vs. recurrentes',
      'Estado de órdenes de laboratorio',
      'Exportación de reportes',
    ]}
  />
);
