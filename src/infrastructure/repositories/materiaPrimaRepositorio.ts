import { SupabaseClient } from '@supabase/supabase-js';
import { supabase as clientePorDefecto } from '../supabase/cliente.ts';
import { MateriaPrima, UnidadMedida } from '../../domain/models/materiaPrima.ts';

export interface MateriaPrimaFila {
  id: string;
  nombre: string;
  unidad_medida: string;
  costo_unitario: number | string;
  stock_actual: number | string;
  stock_minimo: number | string;
  created_at?: string;
  updated_at?: string;
}

export type NuevaMateriaPrimaInput = Omit<MateriaPrima, 'id' | 'fechaCreacion' | 'fechaActualizacion'>;

/**
 * Convierte un registro de base de datos en snake_case al modelo de dominio camelCase.
 */
export function mapearFilaADominio(fila: MateriaPrimaFila): MateriaPrima {
  return {
    id: fila.id,
    nombre: fila.nombre,
    unidadMedida: fila.unidad_medida as UnidadMedida,
    costoUnitario: Number(fila.costo_unitario),
    stockActual: Number(fila.stock_actual),
    stockMinimo: Number(fila.stock_minimo),
    fechaCreacion: fila.created_at,
    fechaActualizacion: fila.updated_at,
  };
}

/**
 * Convierte un input del dominio a formato persistible snake_case de Postgres.
 */
export function mapearDominioAFila(materia: NuevaMateriaPrimaInput): Omit<MateriaPrimaFila, 'id' | 'created_at' | 'updated_at'> {
  return {
    nombre: materia.nombre.trim(),
    unidad_medida: materia.unidadMedida,
    costo_unitario: materia.costoUnitario,
    stock_actual: materia.stockActual,
    stock_minimo: materia.stockMinimo,
  };
}

/**
 * Convierte un input parcial de actualización a formato snake_case de Postgres.
 */
export function mapearParcialDominioAFila(
  materia: Partial<NuevaMateriaPrimaInput>
): Partial<Omit<MateriaPrimaFila, 'id' | 'created_at' | 'updated_at'>> {
  const fila: Partial<Omit<MateriaPrimaFila, 'id' | 'created_at' | 'updated_at'>> = {};
  if (materia.nombre !== undefined) {
    fila.nombre = materia.nombre.trim();
  }
  if (materia.unidadMedida !== undefined) {
    fila.unidad_medida = materia.unidadMedida;
  }
  if (materia.costoUnitario !== undefined) {
    fila.costo_unitario = materia.costoUnitario;
  }
  if (materia.stockActual !== undefined) {
    fila.stock_actual = materia.stockActual;
  }
  if (materia.stockMinimo !== undefined) {
    fila.stock_minimo = materia.stockMinimo;
  }
  return fila;
}

/**
 * Repositorio de infraestructura para la entidad MateriaPrima sobre Supabase.
 */
export class MateriaPrimaRepositorio {
  constructor(private cliente: SupabaseClient = clientePorDefecto) {}

  /**
   * Obtiene la lista completa de materias primas ordenadas alfabéticamente por nombre.
   */
  async listar(): Promise<MateriaPrima[]> {
    const { data, error } = await this.cliente
      .from('materias_primas')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      throw new Error(`Error al listar materias primas: ${error.message}`);
    }

    return (data || []).map(mapearFilaADominio);
  }

  /**
   * Persiste una nueva materia prima en la base de datos de Supabase.
   */
  async crear(materia: NuevaMateriaPrimaInput): Promise<MateriaPrima> {
    const fila = mapearDominioAFila(materia);
    const { data, error } = await this.cliente
      .from('materias_primas')
      .insert(fila)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Error al crear materia prima: ${error.message}`);
    }

    return mapearFilaADominio(data);
  }

  /**
   * Actualiza los campos de una materia prima existente por su id.
   */
  async actualizar(id: string, materia: Partial<NuevaMateriaPrimaInput>): Promise<MateriaPrima> {
    const fila = mapearParcialDominioAFila(materia);
    const { data, error } = await this.cliente
      .from('materias_primas')
      .update(fila)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      throw new Error(`Error al actualizar materia prima: ${error.message}`);
    }

    return mapearFilaADominio(data);
  }

  /**
   * Elimina una materia prima por su id.
   * Si el insumo está vinculado a recetas, captura el error Postgres 23503 y arroja un mensaje amigable.
   */
  async eliminar(id: string): Promise<void> {
    const { error } = await this.cliente
      .from('materias_primas')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '23503' || (typeof error.message === 'string' && error.message.includes('23503'))) {
        throw new Error('No se puede eliminar la materia prima porque está siendo utilizada en una o más recetas.');
      }
      throw new Error(`Error al eliminar materia prima: ${error.message}`);
    }
  }
}

export const materiaPrimaRepositorio = new MateriaPrimaRepositorio();
