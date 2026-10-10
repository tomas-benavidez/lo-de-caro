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
}

export const materiaPrimaRepositorio = new MateriaPrimaRepositorio();
