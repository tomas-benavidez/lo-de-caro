/**
 * Rounds a number to a specified number of decimal places (half-up).
 * - For monetary values: round to 2 decimals.
 * - For physical weights: round to 2 decimals.
 * - For raw material unit costs: round to 4 decimals.
 */
export function round(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  // Using exponential notation to avoid JS floating point errors (e.g. 1.005 * 100 = 100.49999999999999)
  return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals);
}
