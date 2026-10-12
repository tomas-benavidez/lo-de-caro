import { Venta } from '../models/venta.ts';
import { Gasto, CategoriaGasto } from '../models/gasto.ts';
import {
  ProductoVendidoResumen,
  DesgloseGastoCategoria,
  ResumenFinancieroPeriodo,
} from '../models/finanza.ts';

const NOMBRES_MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

/**
 * Formatea un identificador de período ('YYYY-MM' o 'TODOS') a un texto legible en español.
 * Ej: '2026-10' -> 'Octubre 2026', 'TODOS' -> 'Histórico Completo'.
 */
export function formatearMesLegible(periodo: string): string {
  if (periodo === 'TODOS') {
    return 'Histórico Completo';
  }
  const partes = (periodo || '').split('-');
  if (partes.length === 2) {
    const anio = partes[0];
    const mesNumero = parseInt(partes[1], 10);
    if (!isNaN(mesNumero) && mesNumero >= 1 && mesNumero <= 12) {
      return `${NOMBRES_MESES[mesNumero - 1]} ${anio}`;
    }
  }
  return periodo;
}

/**
 * Extrae la lista de meses disponibles en base a las fechas de ventas y gastos registrados.
 * Siempre incluye el mes actual y retorna los meses ordenados de forma descendente.
 */
export function obtenerMesesDisponibles(
  ventas: Venta[],
  gastos: Gasto[],
  mesActualReferencia?: string,
  mesesAdicionales?: string[]
): string[] {
  const mesActual =
    mesActualReferencia || new Date().toISOString().slice(0, 7);
  const conjuntoMeses = new Set<string>();

  conjuntoMeses.add(mesActual);

  for (const v of ventas) {
    if (v.fecha && /^\d{4}-\d{2}/.test(v.fecha)) {
      conjuntoMeses.add(v.fecha.slice(0, 7));
    }
  }

  for (const g of gastos) {
    if (g.fecha && /^\d{4}-\d{2}/.test(g.fecha)) {
      conjuntoMeses.add(g.fecha.slice(0, 7));
    }
  }

  if (mesesAdicionales && Array.isArray(mesesAdicionales)) {
    for (const m of mesesAdicionales) {
      if (m && /^\d{4}-\d{2}/.test(m)) {
        conjuntoMeses.add(m.slice(0, 7));
      }
    }
  }

  return Array.from(conjuntoMeses).sort((a, b) => b.localeCompare(a));
}

/**
 * Filtra las ventas por el período indicado ('YYYY-MM' o 'TODOS').
 */
export function filtrarVentasPorPeriodo(ventas: Venta[], periodo: string): Venta[] {
  if (!periodo || periodo === 'TODOS') {
    return ventas;
  }
  return ventas.filter((v) => v.fecha && v.fecha.startsWith(periodo));
}

/**
 * Filtra los gastos por el período indicado ('YYYY-MM' o 'TODOS').
 */
export function filtrarGastosPorPeriodo(gastos: Gasto[], periodo: string): Gasto[] {
  if (!periodo || periodo === 'TODOS') {
    return gastos;
  }
  return gastos.filter((g) => g.fecha && g.fecha.startsWith(periodo));
}

/**
 * Calcula el ranking de productos más vendidos en base a las ventas provistas.
 * Agrupa por productoId, acumulando unidades vendidas y facturación real.
 * Ordena de mayor a menor cantidad de unidades vendidas.
 */
export function calcularTopProductosVendidos(ventas: Venta[]): ProductoVendidoResumen[] {
  if (!ventas || ventas.length === 0) {
    return [];
  }

  const mapa = new Map<
    string,
    {
      productoId: string;
      nombreProducto: string;
      unidadesVendidas: number;
      facturacionTotal: number;
      unidadVenta?: string;
    }
  >();

  for (const venta of ventas) {
    if (!venta.items || venta.items.length === 0) continue;

    for (const item of venta.items) {
      if (!item.productoId) continue;

      const actual = mapa.get(item.productoId) || {
        productoId: item.productoId,
        nombreProducto: item.nombreProducto || 'Producto',
        unidadesVendidas: 0,
        facturacionTotal: 0,
        unidadVenta: item.unidadVenta || 'unid',
      };

      actual.unidadesVendidas += item.cantidad || 0;
      if (venta.estadoPago !== 'Regalo') {
        const subtotalItem =
          item.subtotal !== undefined
            ? Number(item.subtotal || 0)
            : Number(item.cantidad || 0) * Number(item.precioUnitario || 0);
        actual.facturacionTotal += subtotalItem;
      }
      if (item.unidadVenta) {
        actual.unidadVenta = item.unidadVenta;
      }

      mapa.set(item.productoId, actual);
    }
  }

  return Array.from(mapa.values())
    .map((p) => ({
      ...p,
      unidadesVendidas: Math.round(p.unidadesVendidas * 100) / 100,
      facturacionTotal: Math.round(p.facturacionTotal * 100) / 100,
    }))
    .sort((a, b) => {
      if (b.unidadesVendidas !== a.unidadesVendidas) {
        return b.unidadesVendidas - a.unidadesVendidas;
      }
      return b.facturacionTotal - a.facturacionTotal;
    });
}

/**
 * Agrupa los gastos por categoría, calculando el monto total y el porcentaje respecto al total.
 * Ordena de mayor a menor monto.
 */
export function calcularDesgloseGastos(gastos: Gasto[]): DesgloseGastoCategoria[] {
  if (!gastos || gastos.length === 0) {
    return [];
  }

  const acumulado = new Map<CategoriaGasto, number>();
  let totalMonto = 0;

  for (const gasto of gastos) {
    const monto = Number(gasto.monto) || 0;
    totalMonto += monto;
    const anterior = acumulado.get(gasto.categoria) || 0;
    acumulado.set(gasto.categoria, anterior + monto);
  }

  if (totalMonto === 0) {
    return [];
  }

  const resultado: DesgloseGastoCategoria[] = [];
  for (const [categoria, monto] of acumulado.entries()) {
    const porcentaje = Math.round(((monto / totalMonto) * 100) * 10) / 10;
    resultado.push({
      categoria,
      monto: Math.round(monto * 100) / 100,
      porcentaje,
    });
  }

  return resultado.sort((a, b) => b.monto - a.monto);
}

/**
 * Calcula el ticket promedio de ventas cobradas para el período.
 */
export function calcularTicketPromedio(ventas: Venta[]): number {
  if (!ventas || ventas.length === 0) return 0;

  const cobradas = ventas.filter((v) => v.estadoPago === 'Cobrado' && (v.total || 0) > 0);
  if (cobradas.length === 0) return 0;

  const total = cobradas.reduce((acc, v) => acc + (v.total || 0), 0);
  return Math.round((total / cobradas.length) * 100) / 100;
}

/**
 * Calcula el resumen consolidado financiero para un período dado.
 */
export function calcularResumenFinancieroPeriodo(
  ventasTotales: Venta[],
  gastosTotales: Gasto[],
  periodo: string,
  metaRetiro: number
): ResumenFinancieroPeriodo {
  const ventas = filtrarVentasPorPeriodo(ventasTotales, periodo);
  const gastos = filtrarGastosPorPeriodo(gastosTotales, periodo);

  const totalCobrado = ventas
    .filter((v) => v.estadoPago === 'Cobrado')
    .reduce((sum, v) => sum + (v.total || 0), 0);

  const totalPendiente = ventas
    .filter((v) => v.estadoPago === 'Pendiente')
    .reduce((sum, v) => sum + (v.total || 0), 0);

  const totalGastos = gastos.reduce((sum, g) => sum + (Number(g.monto) || 0), 0);

  const gananciaNeta = Math.round((totalCobrado - totalGastos) * 100) / 100;

  const margenPorcentaje =
    totalCobrado > 0
      ? Math.round(((gananciaNeta / totalCobrado) * 100) * 10) / 10
      : 0;

  const porcentajeMeta =
    metaRetiro > 0
      ? Math.min(100, Math.max(0, Math.round((gananciaNeta / metaRetiro) * 100)))
      : 0;

  const faltaParaMeta = Math.max(0, metaRetiro - gananciaNeta);

  const ticketPromedio = calcularTicketPromedio(ventas);
  const topProductos = calcularTopProductosVendidos(ventas);
  const desgloseGastos = calcularDesgloseGastos(gastos);

  return {
    periodo,
    etiquetaPeriodo: formatearMesLegible(periodo),
    totalCobrado: Math.round(totalCobrado * 100) / 100,
    totalPendiente: Math.round(totalPendiente * 100) / 100,
    totalGastos: Math.round(totalGastos * 100) / 100,
    gananciaNeta,
    margenPorcentaje,
    metaRetiro,
    porcentajeMeta,
    faltaParaMeta,
    ticketPromedio,
    totalVentas: ventas.length,
    topProductos,
    desgloseGastos,
  };
}
