import { UnidadMedida } from './materiaPrima.ts';

export type CategoriaGasto =
  | 'Materia Prima'
  | 'Packaging'
  | 'Servicios'
  | 'Equipamiento'
  | 'Otros';

export const CATEGORIAS_GASTO_VALIDAS: readonly CategoriaGasto[] = [
  'Materia Prima',
  'Packaging',
  'Servicios',
  'Equipamiento',
  'Otros',
] as const;

export type CategoriaGastoFiltro = 'Todas' | CategoriaGasto;

export type MetodoPagoGasto = 'Efectivo' | 'Transferencia';

export const METODOS_PAGO_GASTO_VALIDOS: readonly MetodoPagoGasto[] = [
  'Efectivo',
  'Transferencia',
] as const;

export interface DetalleCompraMateriaPrima {
  materiaPrimaId: string;
  nombreMateriaPrima: string;
  cantidadComprada: number;
  unidadMedida: UnidadMedida;
  actualizarCostoUnitario: boolean;
  nuevoCostoUnitario?: number;
}

export interface Gasto {
  id: string;
  fecha: string; // Formato YYYY-MM-DD
  concepto: string;
  categoria: CategoriaGasto;
  monto: number;
  metodoPago: MetodoPagoGasto;
  compraMateriaPrima?: DetalleCompraMateriaPrima;
  fechaCreacion?: string;
}

export interface NuevoGastoInput {
  fecha?: string;
  concepto: string;
  categoria: CategoriaGasto;
  monto: number;
  metodoPago: MetodoPagoGasto;
  compraMateriaPrima?: {
    materiaPrimaId: string;
    cantidadComprada: number;
    actualizarCostoUnitario: boolean;
  };
}

export interface ResumenGastos {
  totalGastos: number;
  totalMateriaPrima: number;
  totalOperativos: number;
  totalEfectivo: number;
  totalTransferencia: number;
  cantidadGastos: number;
}
