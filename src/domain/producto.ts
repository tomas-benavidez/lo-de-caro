import { round } from './utils';

export interface ProductoVenta {
  id: string;
  nombre: string;
  receta_id: string;
  unidad_venta: string; // e.g., 'docena', 'porcion (8u)'
  cantidad_unidades_base: number; // multiplier, e.g., 12, 8, 1
  precio_lista: number;
  created_at: Date;
}

/**
 * Calculates the manufacturing cost of a product based on recipe cost, yield,
 * base units, and individual packaging cost, rounded to 2 decimal places.
 */
export function calcularCostoFabricacionProducto(
  costoTotalReceta: number,
  porcionesRendimiento: number,
  cantidadUnidadesBase: number,
  costoEnvase: number
): number {
  if (porcionesRendimiento <= 0) {
    throw new Error('Recipe yield (porciones rendimiento) must be greater than zero');
  }
  const costoUnidadBase = costoTotalReceta / porcionesRendimiento;
  const costoFabricacion = costoUnidadBase * cantidadUnidadesBase + costoEnvase;
  return round(costoFabricacion, 2);
}

/**
 * Calculates the actual utility (profit) from real price and manufacturing cost,
 * rounded to 2 decimal places.
 */
export function calcularUtilidad(precioCobradoReal: number, costoFabricacion: number): number {
  return round(precioCobradoReal - costoFabricacion, 2);
}

/**
 * Calculates the profit margin percentage as a decimal ratio,
 * rounded to 4 decimal places.
 */
export function calcularMargenGanancia(precioLista: number, costoFabricacion: number): number {
  if (precioLista <= 0) {
    throw new Error('List price (precio lista) must be greater than zero to calculate margin');
  }
  const margen = (precioLista - costoFabricacion) / precioLista;
  return round(margen, 4);
}

/**
 * Checks if the profit margin is below a certain target.
 */
export function checkMargenBajo(margenGanancia: number, margenObjetivo: number): boolean {
  return margenGanancia < margenObjetivo;
}
