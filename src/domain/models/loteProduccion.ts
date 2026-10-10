/**
 * Entidad del dominio que representa un lote elaborado de producción gastronómica.
 */
export interface LoteProduccion {
  id: string;
  fecha: string; // Formato 'YYYY-MM-DD'
  productoId: string;
  nombreProducto: string;
  categoria?: string;
  unidadVenta: string;
  cantidadElaborada: number;
  observaciones?: string;
  fechaCreacion?: string;
}

/**
 * Estado del stock de productos congelados listos en freezer.
 */
export type EstadoStockCongelado = 'SIN_STOCK' | 'REPONER' | 'SALUDABLE';

/**
 * Detalle del impacto proyectado en cada ingrediente al planificar o elaborar un lote.
 */
export interface ItemConsumoIngrediente {
  materiaPrimaId: string;
  nombreMateriaPrima: string;
  cantidadRequeridaPorUnidad: number;
  cantidadTotalConsumida: number;
  unidadMedida: string;
  stockActualDisponible: number;
  stockRemanenteProyectado: number;
  insuficiente: boolean;
}

/**
 * Resumen de validación y cálculo de consumos de materias primas para una tanda.
 */
export interface ResumenProduccionProyectada {
  productoId: string;
  cantidadElaborada: number;
  ingredientes: ItemConsumoIngrediente[];
  hayStockInsuficiente: boolean;
}
