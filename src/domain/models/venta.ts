export type EstadoCobranza = 'Cobrado' | 'Pendiente' | 'Regalo';

export type MetodoPago = 'Efectivo' | 'Transferencia';

export interface VentaItem {
  id?: string;
  ventaId?: string;
  productoId: string;
  nombreProducto: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
  unidadVenta?: string;
}

export interface Venta {
  id: string;
  fecha: string;
  clienteId?: string | null;
  nombreCliente?: string;
  total: number;
  estadoPago: EstadoCobranza;
  metodoPago: MetodoPago;
  items: VentaItem[];
  fechaCreacion?: string;
}

export interface ItemVentaInput {
  productoId: string;
  cantidad: number;
  precioUnitario?: number;
}

export interface NuevaVentaInput {
  fecha?: string;
  clienteId?: string | null;
  estadoPago: EstadoCobranza;
  metodoPago: MetodoPago;
  items: ItemVentaInput[];
}

export interface DisponibilidadStockItem {
  productoId: string;
  nombreProducto: string;
  stockActual: number;
  cantidadSolicitada: number;
  suficiente: boolean;
  remanente: number;
}

export interface ResumenFinancieroVentas {
  totalCobrado: number;
  totalPendiente: number;
  totalVentas: number;
  clientesConDeuda: number;
}
