import { CategoriaGasto } from './gasto.ts';

export interface ProductoVendidoResumen {
  productoId: string;
  nombreProducto: string;
  unidadesVendidas: number;
  facturacionTotal: number;
  unidadVenta?: string;
}

export interface DesgloseGastoCategoria {
  categoria: CategoriaGasto;
  monto: number;
  porcentaje: number;
}

export interface ResumenFinancieroPeriodo {
  periodo: string; // 'YYYY-MM' o 'TODOS'
  etiquetaPeriodo: string; // 'Octubre 2026' o 'Histórico Completo'
  totalCobrado: number;
  totalPendiente: number;
  totalGastos: number;
  gananciaNeta: number;
  margenPorcentaje: number;
  metaRetiro: number;
  porcentajeMeta: number;
  faltaParaMeta: number;
  ticketPromedio: number;
  totalVentas: number;
  topProductos: ProductoVendidoResumen[];
  desgloseGastos: DesgloseGastoCategoria[];
}
