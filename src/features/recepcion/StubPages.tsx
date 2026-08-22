import { ShoppingBag } from 'lucide-react';
import { RecepcionPlaceholder } from './RecepcionPlaceholder';

// La agenda ya no vive aquí: `/recepcion/agenda` monta la `AgendaPage` real
// desde el sprint 7. Dejó de ser un placeholder el 2026-08-20.
//
// El laboratorio tampoco: `/recepcion/laboratorio` monta la `LaboratorioPage`
// real desde el sprint 8 (`DSO-28`). Su placeholder se retiró para no dejar
// código muerto.
//
// Las existencias tampoco: `/recepcion/existencias` monta la `InventarioPage`
// del entorno administrativo desde el sprint 8 (`DSO-26`).

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
