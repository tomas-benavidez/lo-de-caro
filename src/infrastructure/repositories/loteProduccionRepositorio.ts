import { SupabaseClient } from '@supabase/supabase-js';
import { supabase as clientePorDefecto } from '../supabase/cliente.ts';
import { LoteProduccion } from '../../domain/models/loteProduccion.ts';
import { RecetaIngredienteItem } from '../../domain/models/producto.ts';

export interface LoteProduccionFila {
  id: string;
  fecha: string;
  producto_id: string;
  cantidad_elaborada: number | string;
  observaciones: string | null;
  created_at?: string;
  productos?: {
    id: string;
    nombre: string;
    categoria: string;
    unidad_venta: string;
  } | null;
}

export interface NuevoLoteProduccionInput {
  productoId: string;
  cantidadElaborada: number;
  fecha?: string; // YYYY-MM-DD
  observaciones?: string;
}

/**
 * Convierte un registro de lotes de producción de Postgres al modelo del dominio.
 */
export function mapearFilaALoteProduccion(fila: LoteProduccionFila): LoteProduccion {
  return {
    id: fila.id,
    fecha: fila.fecha,
    productoId: fila.producto_id,
    nombreProducto: fila.productos?.nombre || 'Producto eliminado',
    categoria: fila.productos?.categoria,
    unidadVenta: fila.productos?.unidad_venta || 'u',
    cantidadElaborada: Number(fila.cantidad_elaborada),
    observaciones: fila.observaciones || undefined,
    fechaCreacion: fila.created_at,
  };
}

/**
 * Repositorio de infraestructura para la gestión de lotes de producción y doble impacto de stock en Supabase.
 */
export class LoteProduccionRepositorio {
  constructor(private cliente: SupabaseClient = clientePorDefecto) {}

  /**
   * Obtiene la lista histórica de lotes elaborados con el detalle del producto asociado.
   */
  async listarLotes(): Promise<LoteProduccion[]> {
    const { data, error } = await this.cliente
      .from('lotes_produccion')
      .select('*, productos(id, nombre, categoria, unidad_venta)')
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al listar lotes de producción: ${error.message}`);
    }

    return (data || []).map(mapearFilaALoteProduccion);
  }

  /**
   * Obtiene un lote por su id con la información del producto asociado.
   */
  async obtenerLotePorId(id: string): Promise<LoteProduccion | null> {
    const { data, error } = await this.cliente
      .from('lotes_produccion')
      .select('*, productos(id, nombre, categoria, unidad_venta)')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw new Error(`Error al obtener lote de producción: ${error.message}`);
    }

    return mapearFilaALoteProduccion(data);
  }

  /**
   * Registra una tanda de cocina realizando el doble impacto de inventario:
   * 1. Inserta el lote en `lotes_produccion`.
   * 2. Incrementa el stock de producto terminado en `productos`.
   * 3. Descuenta de forma proporcional las materias primas en `materias_primas`.
   * En caso de fallo en cualquier etapa, ejecuta rollback defensivo completo.
   */
  async registrarProduccion(
    input: NuevoLoteProduccionInput,
    ingredientes: RecetaIngredienteItem[] = []
  ): Promise<LoteProduccion> {
    if (!input.productoId) {
      throw new Error('Debe especificar un producto válido.');
    }
    const cantidadElaborada = Number(input.cantidadElaborada);
    if (!cantidadElaborada || cantidadElaborada <= 0) {
      throw new Error('La cantidad elaborada debe ser mayor a cero.');
    }

    const fechaLote = input.fecha || new Date().toISOString().split('T')[0];
    const observacionesLote = input.observaciones?.trim() || null;

    // Paso 1: Insertar registro de lote
    const { data: loteCreado, error: errorLote } = await this.cliente
      .from('lotes_produccion')
      .insert({
        producto_id: input.productoId,
        cantidad_elaborada: cantidadElaborada,
        fecha: fechaLote,
        observaciones: observacionesLote,
      })
      .select('*')
      .single();

    if (errorLote || !loteCreado) {
      throw new Error(`Error al insertar lote de producción: ${errorLote?.message || 'Error desconocido'}`);
    }

    // Paso 2: Incrementar stock del producto congelado
    let stockProductoPrevio = 0;
    try {
      const { data: prodData, error: errorProdFetch } = await this.cliente
        .from('productos')
        .select('stock_actual')
        .eq('id', input.productoId)
        .single();

      if (errorProdFetch) {
        throw new Error(`Error al leer stock del producto: ${errorProdFetch.message}`);
      }

      stockProductoPrevio = Number(prodData?.stock_actual || 0);
      const nuevoStockProducto = Math.round((stockProductoPrevio + cantidadElaborada) * 1000) / 1000;

      const { error: errorProdUpdate } = await this.cliente
        .from('productos')
        .update({ stock_actual: nuevoStockProducto })
        .eq('id', input.productoId);

      if (errorProdUpdate) {
        throw new Error(`Error al actualizar stock del producto: ${errorProdUpdate.message}`);
      }
    } catch (errProd) {
      // Rollback: borrar el lote recién creado
      await this.cliente.from('lotes_produccion').delete().eq('id', loteCreado.id);
      throw errProd;
    }

    // Paso 3: Descontar materias primas según receta
    const modificacionesRealizadas: { materiaPrimaId: string; stockPrevio: number }[] = [];

    try {
      for (const ing of ingredientes) {
        const cantidadAConsumir = Math.round(Number(ing.cantidad) * cantidadElaborada * 1000) / 1000;
        if (cantidadAConsumir <= 0) continue;

        const { data: mpData, error: errorMpFetch } = await this.cliente
          .from('materias_primas')
          .select('stock_actual')
          .eq('id', ing.materiaPrimaId)
          .single();

        if (errorMpFetch) {
          throw new Error(`Error al leer materia prima ${ing.nombreMateriaPrima}: ${errorMpFetch.message}`);
        }

        const stockMpPrevio = Number(mpData?.stock_actual || 0);
        const nuevoStockMp = Math.round((stockMpPrevio - cantidadAConsumir) * 1000) / 1000;

        const { error: errorMpUpdate } = await this.cliente
          .from('materias_primas')
          .update({ stock_actual: nuevoStockMp })
          .eq('id', ing.materiaPrimaId);

        if (errorMpUpdate) {
          throw new Error(`Error al actualizar stock de materia prima ${ing.nombreMateriaPrima}: ${errorMpUpdate.message}`);
        }

        modificacionesRealizadas.push({
          materiaPrimaId: ing.materiaPrimaId,
          stockPrevio: stockMpPrevio,
        });
      }
    } catch (errInsumos) {
      // Rollback defensivo completo
      for (const mod of modificacionesRealizadas) {
        await this.cliente
          .from('materias_primas')
          .update({ stock_actual: mod.stockPrevio })
          .eq('id', mod.materiaPrimaId);
      }
      await this.cliente
        .from('productos')
        .update({ stock_actual: stockProductoPrevio })
        .eq('id', input.productoId);
      await this.cliente.from('lotes_produccion').delete().eq('id', loteCreado.id);

      throw new Error(
        `Error al actualizar stock de materias primas: ${
          errInsumos instanceof Error ? errInsumos.message : String(errInsumos)
        }`
      );
    }

    // Recuperar y retornar la entidad completa con join
    const loteCompleto = await this.obtenerLotePorId(loteCreado.id);
    if (!loteCompleto) {
      return {
        id: loteCreado.id,
        fecha: loteCreado.fecha,
        productoId: loteCreado.producto_id,
        nombreProducto: 'Producto elaborado',
        unidadVenta: 'u',
        cantidadElaborada: Number(loteCreado.cantidad_elaborada),
        observaciones: loteCreado.observaciones || undefined,
        fechaCreacion: loteCreado.created_at,
      };
    }

    return loteCompleto;
  }

  /**
   * Elimina un lote registrado por su id.
   */
  async eliminarLote(id: string): Promise<void> {
    const { error } = await this.cliente
      .from('lotes_produccion')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Error al eliminar lote de producción: ${error.message}`);
    }
  }
}

export const loteProduccionRepositorio = new LoteProduccionRepositorio();
