export type UnidadMedida = 'g' | 'ml' | 'u';

export interface MateriaPrima {
  id: string;
  nombre: string;
  unidadMedida: UnidadMedida;
  costoUnitario: number; // Precio por gramo, mililitro o unidad
  stockActual: number;
  stockMinimo: number;
  fechaCreacion?: string;
  fechaActualizacion?: string;
}
