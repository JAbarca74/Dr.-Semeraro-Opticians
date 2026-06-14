import { ShoppingCart } from 'lucide-react';
import { Placeholder } from '../../shared/Placeholder';

export const VentasPage = () => (
  <Placeholder
    title="Caja y ventas"
    description="Registro de ventas internas, facturación de mostrador y generación automática de órdenes de laboratorio."
    icon={ShoppingCart}
    features={[
      'Carrito con productos de bodega y precio en colones',
      'Venta vinculada a paciente o de mostrador',
      'Orden de laboratorio automática al vender lentes',
      'Anulación de ventas con reverso de stock',
      'Detalle de venta línea por línea',
      'Cierre y arqueo diario de caja',
    ]}
  />
);
