import { SupabaseClient } from '@supabase/supabase-js';
import { supabase as clientePorDefecto } from '../supabase/cliente.ts';
import {
  Producto,
  CategoriaProducto,
  UnidadVenta,
  RecetaIngredienteItem,
} from '../../domain/models/producto.ts';
import { UnidadMedida } from '../../domain/models/materiaPrima.ts';

export interface RecetaIngredienteFilaConMateriaPrima {
  id: string;
  producto_id: string;
  materia_prima_id: string;
  cantidad: number | string;
  created_at?: string;
  materias_primas?: {
    id: string;
    nombre: string;
    unidad_medida: string;
    costo_unitario: number | string;
    stock_actual?: number | string;
    stock_minimo?: number | string;
  } | null;
}

export interface ProductoFila {
  id: string;
  nombre: string;
  categoria: string;
  unidad_venta: string;
  precio_lista: number | string;
  stock_actual: number | string;
  stock_minimo: number | string;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
  receta_ingredientes?: RecetaIngredienteFilaConMateriaPrima[];
}

export interface NuevoProductoInput {
  nombre: string;
  categoria: CategoriaProducto;
  unidadVenta: UnidadVenta;
  precioLista: number;
  stockActual?: number;
  stockMinimo?: number;
  activo?: boolean;
}

export interface NuevoIngredienteRecetaInput {
  materiaPrimaId: string;
  cantidad: number;
}

/**
 * Consolida la lista de ingredientes sumando cantidades duplicadas del mismo insumo (RF-05)
 * y filtrando cantidades no válidas.
 */
export function consolidarIngredientes(
  ingredientes: NuevoIngredienteRecetaInput[]
): NuevoIngredienteRecetaInput[] {
  const mapa = new Map<string, number>();
  for (const item of ingredientes) {
    const cant = Number(item.cantidad);
    if (cant > 0 && item.materiaPrimaId) {
      const actual = mapa.get(item.materiaPrimaId) || 0;
      mapa.set(item.materiaPrimaId, actual + cant);
    }
  }

  return Array.from(mapa.entries()).map(([materiaPrimaId, cantidad]) => ({
    materiaPrimaId,
    cantidad: Math.round(cantidad * 1000) / 1000,
  }));
}

/**
 * Convierte un registro relacional de productos y recetas de Postgres a la entidad de dominio.
 */
export function mapearFilaAProducto(fila: ProductoFila): Producto {
  const ingredientes: RecetaIngredienteItem[] = (fila.receta_ingredientes || []).map((ri) => ({
    id: ri.id,
    materiaPrimaId: ri.materia_prima_id,
    nombreMateriaPrima: ri.materias_primas?.nombre || 'Insumo desconocido',
    cantidad: Number(ri.cantidad),
    unidadMedida: (ri.materias_primas?.unidad_medida as UnidadMedida) || 'u',
    costoUnitario: Number(ri.materias_primas?.costo_unitario || 0),
  }));

  return {
    id: fila.id,
    nombre: fila.nombre,
    categoria: fila.categoria as CategoriaProducto,
    unidadVenta: fila.unidad_venta as UnidadVenta,
    precioLista: Number(fila.precio_lista),
    stockActual: Number(fila.stock_actual),
    stockMinimo: Number(fila.stock_minimo),
    activo: fila.activo ?? true,
    ingredientes,
    fechaCreacion: fila.created_at,
    fechaActualizacion: fila.updated_at,
  };
}

/**
 * Convierte un input del dominio de producto a formato snake_case de Postgres.
 */
export function mapearProductoAFila(
  producto: NuevoProductoInput
): Omit<ProductoFila, 'id' | 'created_at' | 'updated_at' | 'receta_ingredientes'> {
  return {
    nombre: producto.nombre.trim(),
    categoria: producto.categoria,
    unidad_venta: producto.unidadVenta,
    precio_lista: producto.precioLista,
    stock_actual: producto.stockActual ?? 0,
    stock_minimo: producto.stockMinimo ?? 5,
    activo: producto.activo ?? true,
  };
}

/**
 * Convierte un input parcial de actualización a formato snake_case de Postgres.
 */
export function mapearParcialProductoAFila(
  producto: Partial<NuevoProductoInput>
): Partial<Omit<ProductoFila, 'id' | 'created_at' | 'updated_at' | 'receta_ingredientes'>> {
  const fila: Partial<Omit<ProductoFila, 'id' | 'created_at' | 'updated_at' | 'receta_ingredientes'>> = {};
  if (producto.nombre !== undefined) {
    fila.nombre = producto.nombre.trim();
  }
  if (producto.categoria !== undefined) {
    fila.categoria = producto.categoria;
  }
  if (producto.unidadVenta !== undefined) {
    fila.unidad_venta = producto.unidadVenta;
  }
  if (producto.precioLista !== undefined) {
    fila.precio_lista = producto.precioLista;
  }
  if (producto.stockActual !== undefined) {
    fila.stock_actual = producto.stockActual;
  }
  if (producto.stockMinimo !== undefined) {
    fila.stock_minimo = producto.stockMinimo;
  }
  if (producto.activo !== undefined) {
    fila.activo = producto.activo;
  }
  return fila;
}

/**
 * Repositorio de infraestructura para productos y recetas sobre Supabase.
 */
export class ProductoRepositorio {
  constructor(private cliente: SupabaseClient = clientePorDefecto) {}

  /**
   * Obtiene todos los productos activos con sus recetas completas (ingredientes y materias primas).
   */
  async listar(): Promise<Producto[]> {
    const { data, error } = await this.cliente
      .from('productos')
      .select('*, receta_ingredientes(*, materias_primas(*))')
      .eq('activo', true)
      .order('nombre', { ascending: true });

    if (error) {
      throw new Error(`Error al listar productos y recetas: ${error.message}`);
    }

    return (data || []).map(mapearFilaAProducto);
  }

  /**
   * Obtiene un producto por su id con su receta completa.
   */
  async obtenerPorId(id: string): Promise<Producto | null> {
    const { data, error } = await this.cliente
      .from('productos')
      .select('*, receta_ingredientes(*, materias_primas(*))')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error al obtener producto: ${error.message}`);
    }

    return mapearFilaAProducto(data);
  }

  /**
   * Inserta un nuevo producto y sus ingredientes asociados en `receta_ingredientes`.
   */
  async crear(
    producto: NuevoProductoInput,
    ingredientes: NuevoIngredienteRecetaInput[] = []
  ): Promise<Producto> {
    const fila = mapearProductoAFila(producto);
    const { data: productoCreado, error: errorProducto } = await this.cliente
      .from('productos')
      .insert(fila)
      .select('*')
      .single();

    if (errorProducto || !productoCreado) {
      throw new Error(`Error al crear producto: ${errorProducto?.message || 'Error desconocido'}`);
    }

    const ingredientesConsolidados = consolidarIngredientes(ingredientes);

    if (ingredientesConsolidados.length > 0) {
      const filasIngredientes = ingredientesConsolidados.map((item) => ({
        producto_id: productoCreado.id,
        materia_prima_id: item.materiaPrimaId,
        cantidad: item.cantidad,
      }));

      const { error: errorIngredientes } = await this.cliente
        .from('receta_ingredientes')
        .insert(filasIngredientes);

      if (errorIngredientes) {
        // Rollback defensivo: limpiar el producto creado para evitar registros huérfanos sin receta
        await this.cliente.from('productos').delete().eq('id', productoCreado.id);
        throw new Error(`Error al guardar ingredientes de la receta: ${errorIngredientes.message}`);
      }
    }

    // Retorna el producto completo consultando con los joins de recetas
    const productoCompleto = await this.obtenerPorId(productoCreado.id);
    if (!productoCompleto) {
      throw new Error('No se pudo recuperar el producto recién creado.');
    }

    return productoCompleto;
  }

  /**
   * Actualiza los datos de un producto y sus ingredientes asociados.
   */
  async actualizar(
    id: string,
    producto: Partial<NuevoProductoInput>,
    ingredientes?: NuevoIngredienteRecetaInput[]
  ): Promise<Producto> {
    const fila = mapearParcialProductoAFila(producto);

    if (Object.keys(fila).length > 0) {
      const { error: errorUpdate } = await this.cliente
        .from('productos')
        .update(fila)
        .eq('id', id);

      if (errorUpdate) {
        throw new Error(`Error al actualizar producto: ${errorUpdate.message}`);
      }
    }

    if (ingredientes !== undefined) {
      // Elimina ingredientes previos y reemplaza con los nuevos consolidados
      const { error: errorDelete } = await this.cliente
        .from('receta_ingredientes')
        .delete()
        .eq('producto_id', id);

      if (errorDelete) {
        throw new Error(`Error al actualizar ingredientes: ${errorDelete.message}`);
      }

      const ingredientesConsolidados = consolidarIngredientes(ingredientes);

      if (ingredientesConsolidados.length > 0) {
        const filasIngredientes = ingredientesConsolidados.map((item) => ({
          producto_id: id,
          materia_prima_id: item.materiaPrimaId,
          cantidad: item.cantidad,
        }));

        const { error: errorInsert } = await this.cliente
          .from('receta_ingredientes')
          .insert(filasIngredientes);

        if (errorInsert) {
          throw new Error(`Error al insertar nuevos ingredientes: ${errorInsert.message}`);
        }
      }
    }

    const productoCompleto = await this.obtenerPorId(id);
    if (!productoCompleto) {
      throw new Error('No se pudo recuperar el producto actualizado.');
    }

    return productoCompleto;
  }

  /**
   * Elimina un producto por su id. Sus ingredientes se eliminan en cascada.
   */
  async eliminar(id: string): Promise<void> {
    const { error } = await this.cliente
      .from('productos')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '23503' || (typeof error.message === 'string' && error.message.includes('23503'))) {
        throw new Error('No se puede eliminar el producto porque tiene ventas o lotes de producción asociados.');
      }
      throw new Error(`Error al eliminar producto: ${error.message}`);
    }
  }
}

export const productoRepositorio = new ProductoRepositorio();
