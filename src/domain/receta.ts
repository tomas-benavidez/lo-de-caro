import { round } from './utils';

export interface Receta {
  id: string;
  nombre: string;
  porciones_rendimiento: number; // how many units this recipe yields
  costo_envase: number; // individual packaging cost
  created_at: Date;
}

export interface IngredienteReceta {
  id: string;
  receta_id: string;
  insumo_id: string;
  peso_limpio: number; // net weight in the final product
  porcentaje_merma: number; // percentage of waste, e.g., 20 for 20%
}

/**
 * Calculates and rounds the required gross weight (peso bruto) based on net weight
 * and waste percentage, rounded to 2 decimal places.
 */
export function calcularPesoBrutoRequerido(pesoLimpio: number, porcentajeMerma: number): number {
  if (porcentajeMerma < 0 || porcentajeMerma >= 100) {
    throw new Error('Waste percentage (porcentaje merma) must be between 0 and less than 100');
  }
  const pesoBruto = pesoLimpio / (1 - porcentajeMerma / 100);
  return round(pesoBruto, 2);
}

/**
 * Calculates and rounds the ingredient cost based on gross weight and unit cost,
 * rounded to 2 decimal places.
 */
export function calcularCostoIngrediente(
  pesoLimpio: number,
  porcentajeMerma: number,
  costoBrutoUnitario: number
): number {
  const pesoBruto = calcularPesoBrutoRequerido(pesoLimpio, porcentajeMerma);
  return round(pesoBruto * costoBrutoUnitario, 2);
}

/**
 * Calculates the total recipe cost (sum of ingredient costs + packaging cost),
 * rounded to 2 decimal places.
 */
export function calcularCostoTotalReceta(
  receta: Receta,
  ingredientes: { ingrediente: IngredienteReceta; costoBrutoUnitario: number }[]
): number {
  const costoIngredientes = ingredientes.reduce((acc, current) => {
    const costoIng = calcularCostoIngrediente(
      current.ingrediente.peso_limpio,
      current.ingrediente.porcentaje_merma,
      current.costoBrutoUnitario
    );
    return acc + costoIng;
  }, 0);

  return round(costoIngredientes + receta.costo_envase, 2);
}
