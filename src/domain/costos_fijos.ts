import { round } from './utils';

/**
 * Calculates the total fixed monthly costs, including monthly fixed costs and
 * asset depreciations, rounded to 2 decimal places.
 */
export function calcularCostosFijosTotalesMensuales(
  costosFijosMensuales: number[],
  depreciacionesMensuales: number[]
): number {
  const totalFijos = costosFijosMensuales.reduce((acc, cost) => acc + cost, 0);
  const totalDepreciaciones = depreciacionesMensuales.reduce((acc, dep) => acc + dep, 0);
  return round(totalFijos + totalDepreciaciones, 2);
}

/**
 * Calculates the prorated fixed cost per unit, rounded to 2 decimal places.
 */
export function calcularCostoFijoProrrateadoPorUnidad(
  costosFijosTotalesMensuales: number,
  estimacionMensualProduccion: number
): number {
  if (estimacionMensualProduccion <= 0) {
    throw new Error('Monthly production estimation must be greater than zero');
  }
  return round(costosFijosTotalesMensuales / estimacionMensualProduccion, 2);
}
