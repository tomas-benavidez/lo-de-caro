import { RecetaIngredienteItem } from '../models/producto.ts';
import { MateriaPrima } from '../models/materiaPrima.ts';
import {
  EstadoStockCongelado,
  ItemConsumoIngrediente,
  ResumenProduccionProyectada,
} from '../models/loteProduccion.ts';

/**
 * Clasifica el estado del stock de un producto terminado en el freezer.
 * - SIN_STOCK: 0 unidades o valor negativo.
 * - REPONER: stock actual por debajo o igual al stock mínimo de seguridad.
 * - SALUDABLE: stock actual supera el umbral mínimo.
 */
export function clasificarStockCongelado(
  stockActual: number,
  stockMinimo: number
): EstadoStockCongelado {
  if (stockActual <= 0) {
    return 'SIN_STOCK';
  }
  if (stockActual <= stockMinimo) {
    return 'REPONER';
  }
  return 'SALUDABLE';
}

/**
 * Calcula con precisión el consumo total de materias primas para una cantidad elaborada
 * y proyecta el stock remanente para alertar sobre posibles faltantes.
 */
export function calcularConsumoIngredientes(
  productoId: string,
  receta: RecetaIngredienteItem[],
  cantidadElaborada: number,
  materiasPrimas: MateriaPrima[]
): ResumenProduccionProyectada {
  const cantidadValida = Math.max(0, Number(cantidadElaborada) || 0);

  // Mapa rápido de materias primas por id
  const mapaMaterias = new Map<string, MateriaPrima>();
  for (const mp of materiasPrimas) {
    mapaMaterias.set(mp.id, mp);
  }

  const ingredientes: ItemConsumoIngrediente[] = receta.map((item) => {
    const materia = mapaMaterias.get(item.materiaPrimaId);
    const stockActual = materia ? Number(materia.stockActual) : 0;
    const requeridaPorUnidad = Number(item.cantidad) || 0;

    // Consumo total redondeado a 3 decimales
    const consumoTotal = Math.round(requeridaPorUnidad * cantidadValida * 1000) / 1000;
    const remanente = Math.round((stockActual - consumoTotal) * 1000) / 1000;
    const insuficiente = remanente < 0;

    return {
      materiaPrimaId: item.materiaPrimaId,
      nombreMateriaPrima: item.nombreMateriaPrima || materia?.nombre || 'Insumo',
      cantidadRequeridaPorUnidad: requeridaPorUnidad,
      cantidadTotalConsumida: consumoTotal,
      unidadMedida: item.unidadMedida || materia?.unidadMedida || 'u',
      stockActualDisponible: stockActual,
      stockRemanenteProyectado: remanente,
      insuficiente,
    };
  });

  const hayStockInsuficiente = ingredientes.some((i) => i.insuficiente);

  return {
    productoId,
    cantidadElaborada: cantidadValida,
    ingredientes,
    hayStockInsuficiente,
  };
}
