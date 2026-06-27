import { round } from './utils';
import { calcularPesoBrutoRequerido } from './receta';
import { ProductoVenta } from './producto';
import { Receta, IngredienteReceta } from './receta';
import { Insumo } from './insumo';

/**
 * Calculates and sums the total raw materials (bruto) required for all ordered products,
 * grouping them by insumo, and rounding the final sum to 2 decimal places.
 */
export function calcularRequerimientoInsumos(
  pedidos: {
    producto: ProductoVenta;
    receta: Receta;
    ingredientes: { ingrediente: IngredienteReceta; insumo: Insumo }[];
    cantidad: number;
  }[]
): { insumoId: string; nombre: string; cantidadRequeridaBruta: number }[] {
  const requirementsMap = new Map<string, { nombre: string; totalBruto: number }>();

  for (const pedido of pedidos) {
    const { producto, receta, ingredientes, cantidad } = pedido;
    const porcionesRendimiento = receta.porciones_rendimiento;

    if (porcionesRendimiento <= 0) {
      throw new Error(`Recipe yield (porciones rendimiento) for ${receta.nombre} must be greater than zero`);
    }

    const multiplier = (producto.cantidad_unidades_base * cantidad) / porcionesRendimiento;

    for (const item of ingredientes) {
      const { ingrediente, insumo } = item;
      const pesoBrutoRequerido = calcularPesoBrutoRequerido(
        ingrediente.peso_limpio,
        ingrediente.porcentaje_merma
      );
      const reqBruto = pesoBrutoRequerido * multiplier;

      const existing = requirementsMap.get(insumo.id);
      if (existing) {
        existing.totalBruto += reqBruto;
      } else {
        requirementsMap.set(insumo.id, {
          nombre: insumo.nombre,
          totalBruto: reqBruto
        });
      }
    }
  }

  const result: { insumoId: string; nombre: string; cantidadRequeridaBruta: number }[] = [];
  for (const [insumoId, data] of requirementsMap.entries()) {
    result.push({
      insumoId,
      nombre: data.nombre,
      cantidadRequeridaBruta: round(data.totalBruto, 2)
    });
  }

  return result;
}

/**
 * Calculates the quantity of raw materials to purchase based on required gross amounts
 * and current stock.
 * - If modoServicio is true: ignore stock and purchase the full required amount.
 * - If modoServicio is false: subtract current stock, buying at least 0.
 * Returns the purchase amounts rounded to 2 decimal places.
 */
export function calcularComprasFaltantes(
  requerimientos: { insumoId: string; nombre: string; cantidadRequeridaBruta: number }[],
  stockActualInsumos: { insumoId: string; stockActual: number }[],
  modoServicio: boolean
): { insumoId: string; nombre: string; cantidadAComprar: number }[] {
  const stockMap = new Map<string, number>();
  for (const stock of stockActualInsumos) {
    stockMap.set(stock.insumoId, stock.stockActual);
  }

  return requerimientos.map(req => {
    let cantidadAComprar = 0;
    if (modoServicio) {
      cantidadAComprar = req.cantidadRequeridaBruta;
    } else {
      const stockActual = stockMap.get(req.insumoId) || 0;
      cantidadAComprar = Math.max(0, req.cantidadRequeridaBruta - stockActual);
    }

    return {
      insumoId: req.insumoId,
      nombre: req.nombre,
      cantidadAComprar: round(cantidadAComprar, 2)
    };
  });
}
