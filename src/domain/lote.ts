import { round } from './utils';
import { calcularPesoBrutoRequerido } from './receta';

export interface LoteProduccion {
  id: string;
  fecha: Date;
  receta_id: string;
  cantidad_producida: number;
  registrado_por?: string;
  created_at: Date;
}

export interface LoteIngrediente {
  id: string;
  lote_id: string;
  insumo_id: string;
  cantidad_bruta_consumida: number;
}

/**
 * Suggests the gross raw material consumption based on the net weight,
 * waste percentage, batch quantity produced, and recipe yield.
 * Returns a value rounded to 2 decimal places.
 */
export function sugerirConsumoBruto(
  pesoLimpio: number,
  porcentajeMerma: number,
  cantidadProducida: number,
  porcionesRendimiento: number
): number {
  if (porcionesRendimiento <= 0) {
    throw new Error('Recipe yield (porciones rendimiento) must be greater than zero');
  }
  const pesoBrutoRequerido = calcularPesoBrutoRequerido(pesoLimpio, porcentajeMerma);
  const consumoBrutoSugerido = pesoBrutoRequerido * (cantidadProducida / porcionesRendimiento);
  return round(consumoBrutoSugerido, 2);
}

/**
 * Subtracts the consumed quantity from the current stock,
 * returning the new stock rounded to 2 decimal places.
 */
export function actualizarStockInsumo(stockActual: number, cantidadConsumida: number): number {
  return round(stockActual - cantidadConsumida, 2);
}
