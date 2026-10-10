import { RecetaIngredienteItem } from '../models/producto.ts';

/**
 * Calcula el costo total de elaboración de 1 unidad de venta sumando sus ingredientes.
 */
export function calcularCostoReceta(ingredientes: RecetaIngredienteItem[]): number {
  if (!ingredientes || ingredientes.length === 0) {
    return 0;
  }
  const total = ingredientes.reduce((acumulado, item) => {
    return acumulado + item.cantidad * item.costoUnitario;
  }, 0);
  return Math.round(total * 100) / 100;
}

/**
 * Calcula el margen de ganancia en pesos y en porcentaje sobre el precio de lista.
 */
export function calcularMargenGanancia(
  precioLista: number,
  costoProduccion: number
): { margenPesos: number; margenPorcentaje: number } {
  const margenPesos = precioLista - costoProduccion;
  const margenPorcentaje = precioLista > 0 ? (margenPesos / precioLista) * 100 : 0;

  return {
    margenPesos: Math.round(margenPesos * 100) / 100,
    margenPorcentaje: Math.round(margenPorcentaje * 10) / 10,
  };
}

/**
 * Evalúa si el stock actual requiere reposición según el umbral mínimo.
 */
export function evaluarEstadoStock(
  stockActual: number,
  stockMinimo: number
): 'OK' | 'REPONER' {
  return stockActual <= stockMinimo ? 'REPONER' : 'OK';
}
