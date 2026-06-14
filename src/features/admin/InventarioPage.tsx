import { Package } from 'lucide-react';
import { Placeholder } from '../../shared/Placeholder';

export const InventarioPage = () => (
  <Placeholder
    title="Bodega e inventario"
    description="Control de stock de monturas y lentes de marcas EssilorLuxottica, con kardex de movimientos y alertas."
    icon={Package}
    features={[
      'Catálogo por categoría y marca (Ray-Ban, Oakley, Persol…)',
      'Kardex de entradas, salidas y ajustes',
      'Umbrales de alerta por bajo stock',
      'SKU único y precio de referencia',
      'Productos públicos para el catálogo del paciente',
      'Trazabilidad de cada movimiento por usuario',
    ]}
  />
);
