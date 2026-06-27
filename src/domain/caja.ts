import { round } from './utils';

/**
 * Calculates the net profit (ganancia neta) based on sales income,
 * manufacturing costs, and capital investments.
 * - If excludeInvestments (excluirInversiones) is true, capital investments are ignored.
 * - If excludeInvestments is false, capital investments are subtracted.
 * Returns the net profit rounded to 2 decimal places.
 */
export function calcularGananciaNeta(
  ingresosVentasCobradas: number,
  costosFabricacionVendido: number,
  inversionesCapital: number,
  excluirInversiones: boolean
): number {
  const gananciaBase = ingresosVentasCobradas - costosFabricacionVendido;
  const gananciaNeta = excluirInversiones ? gananciaBase : gananciaBase - inversionesCapital;
  return round(gananciaNeta, 2);
}
