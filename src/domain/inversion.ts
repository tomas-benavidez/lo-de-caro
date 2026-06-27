import { round } from './utils';

export interface Inversion {
  id: string;
  nombre: string;
  monto: number;
  vida_util_anios: number;
  fecha_compra: Date;
  created_at: Date;
}

/**
 * Calculates the monthly depreciation of an asset investment,
 * rounded to 2 decimal places.
 */
export function calcularDepreciacionMensual(inversion: Inversion): number {
  if (inversion.vida_util_anios <= 0) {
    throw new Error('Asset useful life (vida util anios) must be greater than zero');
  }
  const depreciacionMensual = inversion.monto / (inversion.vida_util_anios * 12);
  return round(depreciacionMensual, 2);
}
