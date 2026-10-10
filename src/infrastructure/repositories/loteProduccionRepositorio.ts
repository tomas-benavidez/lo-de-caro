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
    const cantidadElaborada = Math.round(Number(input.cantidadElaborada) * 1000) / 1000;
    if (!cantidadElaborada || cantidadElaborada <= 0) {
      throw new Error('La cantidad elaborada debe ser mayor a cero.');
    }

    const fechaLote = input.fecha || new Date().toISOString().split('T')[0];
    const observacionesLote = input.observaciones?.trim() || null;

    // Si no se pasaron ingredientes explícitamente, consultarlos desde la base de datos
    let ingredientesAConsumir = ingredientes;
    if (!ingredientesAConsumir || ingredientesAConsumir.length === 0) {
      const { data: recetaDb } = await this.cliente
        .from('receta_ingredientes')
        .select('id, materia_prima_id, cantidad, materias_primas(nombre, unidad_medida)')
        .eq('producto_id', input.productoId);

      if (recetaDb && recetaDb.length > 0) {
        ingredientesAConsumir = recetaDb.map((r: any) => ({
          id: r.id || r.materia_prima_id,
          materiaPrimaId: r.materia_prima_id,
          nombreMateriaPrima: r.materias_primas?.nombre || 'Insumo',
          cantidad: Number(r.cantidad),
          unidadMedida: r.materias_primas?.unidad_medida || 'u',
          costoUnitario: 0,
        }));
      }
    }

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
      for (const ing of ingredientesAConsumir) {
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
   * Anula y elimina un lote de producción registrado por su id (RF-05):
   * 1. Obtiene el lote para conocer el producto_id y cantidad_elaborada.
   * 2. Verifica el stock en freezer del producto: si el stock es menor a la cantidad elaborada,
   *    impide la anulación con un error explicativo para evitar stock negativo inconsistente.
   * 3. Obtiene los ingredientes de la receta de dicho producto.
   * 4. Restituye el stock de materias primas sumando las cantidades consumidas originalmente.
   * 5. Descuenta las unidades elaboradas del stock en freezer del producto.
   * 6. Elimina el registro del lote en `lotes_produccion`.
   * En caso de fallo en cualquier etapa, ejecuta rollback defensivo completo.
   */
  async eliminarLote(id: string): Promise<void> {
    // 1. Obtener información del lote a anular
    const { data: lote, error: errorFetch } = await this.cliente
      .from('lotes_produccion')
      .select('id, producto_id, cantidad_elaborada')
      .eq('id', id)
      .single();

    if (errorFetch) {
      if (errorFetch.code === 'PGRST116') {
        throw new Error('El lote de producción no existe o ya fue eliminado.');
      }
      throw new Error(`Error al consultar lote de producción: ${errorFetch.message}`);
    }

    if (!lote) {
      throw new Error('El lote de producción no existe o ya fue eliminado.');
    }

    const cantidadElaborada = Math.round(Number(lote.cantidad_elaborada) * 1000) / 1000;

    // 2. Obtener producto y validar stock actual en freezer
    const { data: prodData, error: errorProd } = await this.cliente
      .from('productos')
      .select('id, stock_actual, nombre')
      .eq('id', lote.producto_id)
      .single();

    if (errorProd && errorProd.code !== 'PGRST116') {
      throw new Error(`Error al consultar stock del producto: ${errorProd.message}`);
    }

    const stockProductoPrevio = Number(prodData?.stock_actual || 0);
    if (prodData && stockProductoPrevio < cantidadElaborada) {
      throw new Error(
        `No se puede anular el lote: el stock actual en freezer (${stockProductoPrevio}) es menor a la cantidad elaborada (${cantidadElaborada}). Ya se registraron ventas o ajustes de este producto.`
      );
    }

    // 3. Obtener ingredientes de la receta
    const { data: recetaRows, error: errorReceta } = await this.cliente
      .from('receta_ingredientes')
      .select('materia_prima_id, cantidad')
      .eq('producto_id', lote.producto_id);

    if (errorReceta) {
      throw new Error(`Error al consultar receta del producto: ${errorReceta.message}`);
    }

    // 4. Restituir materias primas
    const modificacionesRealizadas: { materiaPrimaId: string; stockPrevio: number }[] = [];

    try {
      if (recetaRows && recetaRows.length > 0) {
        for (const ing of recetaRows) {
          const cantidadARestituir = Math.round(Number(ing.cantidad) * cantidadElaborada * 1000) / 1000;
          if (cantidadARestituir <= 0) continue;

          const { data: mpData, error: errorMpFetch } = await this.cliente
            .from('materias_primas')
            .select('stock_actual')
            .eq('id', ing.materia_prima_id)
            .single();

          if (errorMpFetch) {
            throw new Error(`Error al leer materia prima para restitución: ${errorMpFetch.message}`);
          }

          const stockMpPrevio = Number(mpData?.stock_actual || 0);
          const nuevoStockMp = Math.round((stockMpPrevio + cantidadARestituir) * 1000) / 1000;

          const { error: errorMpUpdate } = await this.cliente
            .from('materias_primas')
            .update({ stock_actual: nuevoStockMp })
            .eq('id', ing.materia_prima_id);

          if (errorMpUpdate) {
            throw new Error(`Error al restituir stock de materia prima: ${errorMpUpdate.message}`);
          }

          modificacionesRealizadas.push({
            materiaPrimaId: ing.materia_prima_id,
            stockPrevio: stockMpPrevio,
          });
        }
      }

      // 5. Descontar stock del producto en freezer
      if (prodData) {
        const nuevoStockProd = Math.round((stockProductoPrevio - cantidadElaborada) * 1000) / 1000;
        const { error: errorProdUpdate } = await this.cliente
          .from('productos')
          .update({ stock_actual: Math.max(0, nuevoStockProd) })
          .eq('id', lote.producto_id);

        if (errorProdUpdate) {
          throw new Error(`Error al actualizar stock del producto en freezer: ${errorProdUpdate.message}`);
        }
      }

      // 6. Eliminar el registro del lote
      const { error: errorDelete } = await this.cliente
        .from('lotes_produccion')
        .delete()
        .eq('id', id);

      if (errorDelete) {
        throw new Error(`Error al eliminar registro del lote: ${errorDelete.message}`);
      }
    } catch (err) {
      // Rollback defensivo
      for (const mod of modificacionesRealizadas) {
        await this.cliente
          .from('materias_primas')
          .update({ stock_actual: mod.stockPrevio })
          .eq('id', mod.materiaPrimaId);
      }
      if (prodData) {
        await this.cliente
          .from('productos')
          .update({ stock_actual: stockProductoPrevio })
          .eq('id', lote.producto_id);
      }
      throw err;
    }
  }
}

export const loteProduccionRepositorio = new LoteProduccionRepositorio();
