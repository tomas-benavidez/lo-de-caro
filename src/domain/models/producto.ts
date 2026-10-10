export type CategoriaProducto =
  | 'Pastas Rellenas'
  | 'Pastas Lisas'
  | 'Empanadas'
  | 'Tartas'
  | 'Salsas';

export type UnidadVenta = 'Porcion' | 'Docena' | 'Kilo' | 'Unidad';

export interface RecetaIngredienteItem {
  materiaPrimaId: string;
  nombreMateriaPrima: string;
  cantidad: number; // Cantidad requerida para 1 unidad de venta
  unidadMedida: 'g' | 'ml' | 'u';
  costoUnitario: number;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria: CategoriaProducto;
  unidadVenta: UnidadVenta;
  precioLista: number;
  stockActual: number; // Unidades terminadas listas en freezer
  stockMinimo: number;
  ingredientes: RecetaIngredienteItem[];
  activo: boolean;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}
