import { round } from './utils';

export interface Insumo {
  id: string;
  nombre: string;
  unidad_medida: 'g' | 'ml' | 'u';
  costo_bruto_unitario: number; // calculated average cost
  stock_actual: number;
  stock_minimo?: number;
  created_at: Date;
}

/**
 * Calculates the unit gross cost from price paid and quantity bought,
 * rounding to 4 decimal places.
 */
export function calcularCostoBrutoUnitario(precioPagado: number, cantidadComprada: number): number {
  if (cantidadComprada <= 0) {
    throw new Error('Quantity bought must be greater than zero');
  }
  return round(precioPagado / cantidadComprada, 4);
}
