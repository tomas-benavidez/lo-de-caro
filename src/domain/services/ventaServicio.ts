import { Producto } from '../models/producto.ts';
import { Cliente } from '../models/cliente.ts';
import {
  Venta,
  ItemVentaInput,
  NuevaVentaInput,
  EstadoCobranza,
  DisponibilidadStockItem,
  ResumenFinancieroVentas,
} from '../models/venta.ts';

/**
 * Calcula el subtotal de un ítem de venta redondeado a 2 decimales.
 */
export const calcularSubtotalItem = (cantidad: number, precioUnitario: number): number => {
  if (cantidad <= 0 || precioUnitario <= 0) return 0;
  return Math.round(cantidad * precioUnitario * 100) / 100;
};

/**
 * Calcula el monto total a cobrar de una venta sumando los subtotales de sus ítems.
 * Si el estado de cobro es 'Regalo', el total facturado a cobrar es 0.
 */
export const calcularTotalVenta = (
  items: Array<{ cantidad: number; precioUnitario: number }>,
  estadoPago: EstadoCobranza
): number => {
  if (estadoPago === 'Regalo') return 0;
  if (!items || items.length === 0) return 0;

  const total = items.reduce((acumulado, item) => {
    return acumulado + calcularSubtotalItem(item.cantidad, item.precioUnitario);
  }, 0);

  return Math.round(total * 100) / 100;
};

/**
 * Verifica en vivo la disponibilidad de stock en el freezer para cada producto de la venta.
 */
export const verificarDisponibilidadStock = (
  items: ItemVentaInput[],
  productos: Producto[]
): DisponibilidadStockItem[] => {
  const mapaProductos = new Map<string, Producto>(productos.map((p) => [p.id, p]));

  return items.map((item) => {
    const prod = mapaProductos.get(item.productoId);
    const stockActual = prod ? prod.stockActual : 0;
    const nombreProducto = prod ? prod.nombre : 'Producto desconocido';
    const remanente = Math.round((stockActual - item.cantidad) * 1000) / 1000;
    const suficiente = stockActual >= item.cantidad;

    return {
      productoId: item.productoId,
      nombreProducto,
      stockActual,
      cantidadSolicitada: item.cantidad,
      suficiente,
      remanente,
    };
  });
};

/**
 * Calcula el resumen financiero para el tablero de ventas y mostrador.
 */
export const calcularResumenFinanciero = (
  ventas: Venta[],
  clientes: Cliente[]
): ResumenFinancieroVentas => {
  const totalCobrado = ventas
    .filter((v) => v.estadoPago === 'Cobrado')
    .reduce((sum, v) => sum + (v.total || 0), 0);

  // El total pendiente de cobro es la deuda acumulada real en las cuentas de los clientes
  const totalPendiente = clientes.reduce((sum, c) => sum + (c.saldoPendiente || 0), 0);

  const clientesConDeuda = clientes.filter((c) => c.saldoPendiente > 0).length;

  return {
    totalCobrado: Math.round(totalCobrado * 100) / 100,
    totalPendiente: Math.round(totalPendiente * 100) / 100,
    totalVentas: ventas.length,
    clientesConDeuda,
  };
};

/**
 * Valida los datos requeridos para registrar una nueva venta.
 */
export const validarDatosNuevaVenta = (
  input: NuevaVentaInput
): { valido: boolean; error?: string } => {
  if (!input.items || input.items.length === 0) {
    return { valido: false, error: 'Debe incluir al menos un producto en la venta.' };
  }

  for (const item of input.items) {
    if (!item.productoId) {
      return { valido: false, error: 'Cada ítem debe tener un producto seleccionado.' };
    }
    if (typeof item.cantidad !== 'number' || item.cantidad <= 0) {
      return { valido: false, error: 'La cantidad de cada ítem debe ser mayor a cero.' };
    }
    if (item.precioUnitario !== undefined && item.precioUnitario < 0) {
      return { valido: false, error: 'El precio unitario no puede ser negativo.' };
    }
  }

  return { valido: true };
};
