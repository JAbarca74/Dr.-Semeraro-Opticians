import api from './http';
import type { TipoCambio } from '../models/moneda';

/**
 * Tipo de cambio para el aproximado en dólares (CU-09, `DSO-57`).
 *
 * ⚠️ **No propaga el error.** Si la tasa no llega, el catálogo tiene que
 * seguir pintando los precios en colones: la conversión es un adorno, el
 * precio es el producto. Por eso un fallo devuelve «no disponible» en vez de
 * reventar la carga de la vitrina.
 */
export const tipoCambioVigente = (): Promise<TipoCambio> =>
  api
    .get<TipoCambio>('/tipo-cambio')
    .then((r) => r.data)
    .catch(() => ({ disponible: false }) as TipoCambio);
