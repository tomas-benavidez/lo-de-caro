import { SupabaseClient } from '@supabase/supabase-js';
import { supabase as defaultClient } from '../supabase/cliente.ts';
import {
  Venta,
  VentaItem,
  NuevaVentaInput,
  EstadoCobranza,
  MetodoPago,
} from '../../domain/models/venta.ts';
import { Producto } from '../../domain/models/producto.ts';
import {
  calcularTotalVenta,
  validarDatosNuevaVenta,
} from '../../domain/services/ventaServicio.ts';

export interface VentaItemFila {
  id?: string;
  venta_id?: string;
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  productos?: {
    nombre?: string;
    unidad_venta?: string;
  } | null;
}

export interface VentaFila {
  id: string;
  fecha: string;
  cliente_id: string | null;
  total: number;
  estado_pago: string;
  created_at?: string;
  clientes?: {
    nombre_apellido?: string;
  } | null;
  venta_items?: VentaItemFila[];
}

/**
 * Obtiene el método de pago persistido localmente o asigna 'Efectivo' por defecto.
 */
export const obtenerMetodoPagoVenta = (ventaId: string): MetodoPago => {
  try {
    if (typeof localStorage !== 'undefined') {
      const guardado = localStorage.getItem(`lo_de_caro_metodo_pago_${ventaId}`);
      if (guardado === 'Transferencia' || guardado === 'Efectivo') {
        return guardado;
      }
    }
  } catch {
    // Si localStorage no está disponible (ej. entorno node de tests), usar valor seguro
  }
  return 'Efectivo';
};

/**
 * Persiste el método de pago localmente.
 */
export const guardarMetodoPagoVenta = (ventaId: string, metodo: MetodoPago): void => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`lo_de_caro_metodo_pago_${ventaId}`, metodo);
    }
  } catch {
    // Silencioso en caso de no soportar storage
  }
};

/**
 * Mapea el estado de Postgres ('Pagado', 'Pendiente', 'Regalo') al dominio.
 */
export const mapearEstadoCobranza = (estadoDb: string): EstadoCobranza => {
  if (estadoDb === 'Pagado') return 'Cobrado';
  if (estadoDb === 'Regalo') return 'Regalo';
  return 'Pendiente';
};

/**
 * Mapea el estado del dominio ('Cobrado', 'Pendiente', 'Regalo') al enum de Postgres.
 */
export const mapearEstadoADb = (estado: EstadoCobranza): 'Pagado' | 'Pendiente' | 'Regalo' => {
  if (estado === 'Cobrado') return 'Pagado';
  if (estado === 'Regalo') return 'Regalo';
  return 'Pendiente';
};

/**
 * Mapea una fila con joins a la entidad Venta de dominio.
 */
export const mapearFilaAVenta = (fila: VentaFila): Venta => {
  const items: VentaItem[] = (fila.venta_items || []).map((vi) => ({
    id: vi.id,
    ventaId: vi.venta_id || fila.id,
    productoId: vi.producto_id,
    nombreProducto: vi.productos?.nombre || 'Producto',
    cantidad: Number(vi.cantidad || 0),
    precioUnitario: Number(vi.precio_unitario || 0),
    subtotal: Number(vi.subtotal || 0),
    unidadVenta: vi.productos?.unidad_venta,
  }));

  return {
    id: fila.id,
    fecha: fila.fecha,
    clienteId: fila.cliente_id,
    nombreCliente: fila.clientes?.nombre_apellido || 'Cliente Mostrador',
    total: Number(fila.total || 0),
    estadoPago: mapearEstadoCobranza(fila.estado_pago),
    metodoPago: obtenerMetodoPagoVenta(fila.id),
    items,
    fechaCreacion: fila.created_at,
  };
};

export class VentaRepositorio {
  private cliente: SupabaseClient;

  constructor(clienteSupabase?: SupabaseClient) {
    this.cliente = clienteSupabase || defaultClient;
  }

  /**
   * Obtiene el listado completo de ventas con sus clientes y productos asociados.
   */
  async listar(): Promise<Venta[]> {
    const { data, error } = await this.cliente
      .from('ventas')
      .select('*, clientes(nombre_apellido), venta_items(*, productos(nombre, unidad_venta))')
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al listar ventas: ${error.message}`);
    }

    return (data || []).map(mapearFilaAVenta);
  }

  /**
   * Registra una venta en el mostrador realizando la transacción atómica:
   * 1. Inserta la cabecera en `ventas`.
   * 2. Inserta los ítems en `venta_items`.
   * 3. Descuenta el stock correspondiente del freezer en `productos`.
   * 4. Si la venta es 'Pendiente' y tiene cliente, incrementa su saldo pendiente.
   * 5. Ante cualquier fallo, ejecuta un rollback defensivo y relanza el error.
   */
  async registrarVenta(
    input: NuevaVentaInput,
    productosReferencia: Producto[] = []
  ): Promise<Venta> {
    const validacion = validarDatosNuevaVenta(input);
    if (!validacion.valido) {
      throw new Error(validacion.error || 'Datos de venta inválidos.');
    }

    // Completar precios unitarios si no vienen especificados
    const mapaPrecios = new Map<string, number>(
      productosReferencia.map((p) => [p.id, p.precioLista])
    );

    const itemsProcesados = input.items.map((it) => {
      const precio =
        it.precioUnitario !== undefined
          ? it.precioUnitario
          : mapaPrecios.get(it.productoId) || 0;
      return {
        ...it,
        precioUnitario: precio,
      };
    });

    const totalVenta = calcularTotalVenta(
      itemsProcesados.map((it) => ({ cantidad: it.cantidad, precioUnitario: it.precioUnitario })),
      input.estadoPago
    );

    const fechaVenta = input.fecha || new Date().toISOString().split('T')[0];
    const estadoDb = mapearEstadoADb(input.estadoPago);

    // 1. Inserción de la venta principal
    const { data: ventaCreada, error: errorVenta } = await this.cliente
      .from('ventas')
      .insert({
        fecha: fechaVenta,
        cliente_id: input.clienteId || null,
        total: totalVenta,
        estado_pago: estadoDb,
      })
      .select('*')
      .single();

    if (errorVenta || !ventaCreada) {
      throw new Error(`Error al insertar venta: ${errorVenta?.message || 'Error desconocido'}`);
    }

    // Persistir el método de pago
    guardarMetodoPagoVenta(ventaCreada.id, input.metodoPago);

    // Registros para el rollback defensivo
    const descuentosRealizados: Array<{ productoId: string; stockPrevio: number }> = [];
    let incrementoSaldoClienteRealizado = false;
    let saldoClientePrevio = 0;

    try {
      // 2. Inserción de ítems de la venta
      const filasItems = itemsProcesados.map((it) => ({
        venta_id: ventaCreada.id,
        producto_id: it.productoId,
        cantidad: it.cantidad,
        precio_unitario: it.precioUnitario,
        subtotal: Math.round(it.cantidad * it.precioUnitario * 100) / 100,
      }));

      const { error: errorItems } = await this.cliente
        .from('venta_items')
        .insert(filasItems);

      if (errorItems) {
        throw new Error(`Error al insertar ítems de la venta: ${errorItems.message}`);
      }

      // 3. Descuento atómico de stock en freezer para cada producto (agrupado por productoId)
      const mapaCantidades = new Map<string, number>();
      for (const it of itemsProcesados) {
        mapaCantidades.set(
          it.productoId,
          Math.round(((mapaCantidades.get(it.productoId) || 0) + it.cantidad) * 1000) / 1000
        );
      }

      for (const [productoId, cantidadADescontar] of mapaCantidades.entries()) {
        const { data: prodData, error: errorProdFetch } = await this.cliente
          .from('productos')
          .select('id, stock_actual, nombre')
          .eq('id', productoId)
          .single();

        if (errorProdFetch) {
          throw new Error(`Error al consultar stock del producto: ${errorProdFetch.message}`);
        }

        const stockPrevio = Number(prodData?.stock_actual || 0);
        const nuevoStock = Math.round((stockPrevio - cantidadADescontar) * 1000) / 1000;

        const { error: errorProdUpdate } = await this.cliente
          .from('productos')
          .update({ stock_actual: nuevoStock })
          .eq('id', productoId);

        if (errorProdUpdate) {
          throw new Error(`Error al actualizar stock del producto: ${errorProdUpdate.message}`);
        }

        descuentosRealizados.push({ productoId, stockPrevio });
      }

      // 4. Si la venta es Pendiente y hay cliente asignado, incrementar su saldo adeudado
      if (input.estadoPago === 'Pendiente' && input.clienteId) {
        const { data: clienteData, error: errorClienteFetch } = await this.cliente
          .from('clientes')
          .select('id, saldo_pendiente')
          .eq('id', input.clienteId)
          .single();

        if (errorClienteFetch) {
          throw new Error(`Error al consultar saldo del cliente: ${errorClienteFetch.message}`);
        }

        saldoClientePrevio = Number(clienteData?.saldo_pendiente || 0);
        const nuevoSaldo = Math.round((saldoClientePrevio + totalVenta) * 100) / 100;

        const { error: errorClienteUpdate } = await this.cliente
          .from('clientes')
          .update({ saldo_pendiente: nuevoSaldo })
          .eq('id', input.clienteId);

        if (errorClienteUpdate) {
          throw new Error(`Error al actualizar cuenta corriente del cliente: ${errorClienteUpdate.message}`);
        }

        incrementoSaldoClienteRealizado = true;
      }
    } catch (errorOperacion) {
      // Rollback defensivo integral
      // A. Revertir saldo del cliente si se alteró
      if (incrementoSaldoClienteRealizado && input.clienteId) {
        try {
          await this.cliente
            .from('clientes')
            .update({ saldo_pendiente: saldoClientePrevio })
            .eq('id', input.clienteId);
        } catch {}
      }

      // B. Restituir el stock en productos que se hayan descontado
      for (const des of descuentosRealizados) {
        try {
          await this.cliente
            .from('productos')
            .update({ stock_actual: des.stockPrevio })
            .eq('id', des.productoId);
        } catch {}
      }

      // C. Eliminar la venta insertada (los items se eliminan en cascada por foreign key)
      try {
        await this.cliente.from('ventas').delete().eq('id', ventaCreada.id);
      } catch {}

      throw errorOperacion;
    }

    // Retornar la entidad completa
    return {
      id: ventaCreada.id,
      fecha: fechaVenta,
      clienteId: input.clienteId || null,
      nombreCliente: 'Cliente',
      total: totalVenta,
      estadoPago: input.estadoPago,
      metodoPago: input.metodoPago,
      items: itemsProcesados.map((it) => ({
        ventaId: ventaCreada.id,
        productoId: it.productoId,
        nombreProducto: 'Producto',
        cantidad: it.cantidad,
        precioUnitario: it.precioUnitario,
        subtotal: Math.round(it.cantidad * it.precioUnitario * 100) / 100,
      })),
      fechaCreacion: ventaCreada.created_at,
    };
  }

  /**
   * Anula una venta: restituye el stock en el freezer de cada producto y revierte
   * la deuda del cliente si la venta estaba en estado Pendiente.
   * Cuenta con rollback defensivo completo si falla la eliminación de la venta.
   */
  async anularVenta(id: string): Promise<void> {
    const { data: venta, error: errorFetch } = await this.cliente
      .from('ventas')
      .select('*, venta_items(producto_id, cantidad)')
      .eq('id', id)
      .single();

    if (errorFetch || !venta) {
      throw new Error(`Error al obtener venta para anular: ${errorFetch?.message || 'No encontrada'}`);
    }

    // Agrupar cantidades por producto para evitar actualizaciones repetidas
    const mapaCantidades = new Map<string, number>();
    for (const it of venta.venta_items || []) {
      mapaCantidades.set(
        it.producto_id,
        Math.round(((mapaCantidades.get(it.producto_id) || 0) + Number(it.cantidad)) * 1000) / 1000
      );
    }

    const restitucionesRealizadas: Array<{ productoId: string; stockPrevio: number }> = [];
    let ajusteSaldoClienteRealizado = false;
    let saldoClientePrevio = 0;

    try {
      // 1. Restituir stock en freezer
      for (const [productoId, cantidadARestituir] of mapaCantidades.entries()) {
        const { data: prodData, error: errorProdFetch } = await this.cliente
          .from('productos')
          .select('stock_actual')
          .eq('id', productoId)
          .single();

        if (errorProdFetch) {
          throw new Error(`Error al consultar producto para restitución: ${errorProdFetch.message}`);
        }

        if (prodData) {
          const stockActual = Number(prodData.stock_actual || 0);
          const stockRestituido = Math.round((stockActual + cantidadARestituir) * 1000) / 1000;
          const { error: errorProdUpdate } = await this.cliente
            .from('productos')
            .update({ stock_actual: stockRestituido })
            .eq('id', productoId);

          if (errorProdUpdate) {
            throw new Error(`Error al restituir stock del producto: ${errorProdUpdate.message}`);
          }

          restitucionesRealizadas.push({ productoId, stockPrevio: stockActual });
        }
      }

      // 2. Si la venta estaba en estado Pendiente y tenía cliente, restar la deuda
      if (venta.estado_pago === 'Pendiente' && venta.cliente_id) {
        const { data: clienteData, error: errorClienteFetch } = await this.cliente
          .from('clientes')
          .select('saldo_pendiente')
          .eq('id', venta.cliente_id)
          .single();

        if (errorClienteFetch) {
          throw new Error(`Error al consultar cliente para ajustar deuda: ${errorClienteFetch.message}`);
        }

        if (clienteData) {
          saldoClientePrevio = Number(clienteData.saldo_pendiente || 0);
          const nuevoSaldo = Math.max(0, Math.round((saldoClientePrevio - Number(venta.total)) * 100) / 100);
          const { error: errorClienteUpdate } = await this.cliente
            .from('clientes')
            .update({ saldo_pendiente: nuevoSaldo })
            .eq('id', venta.cliente_id);

          if (errorClienteUpdate) {
            throw new Error(`Error al actualizar saldo del cliente al anular: ${errorClienteUpdate.message}`);
          }

          ajusteSaldoClienteRealizado = true;
        }
      }

      // 3. Eliminar la venta (elimina venta_items en cascada)
      const { error: errorDelete } = await this.cliente
        .from('ventas')
        .delete()
        .eq('id', id);

      if (errorDelete) {
        throw new Error(`Error al eliminar venta: ${errorDelete.message}`);
      }
    } catch (errorOperacion) {
      // Rollback defensivo integral ante fallo en anulación
      if (ajusteSaldoClienteRealizado && venta.cliente_id) {
        try {
          await this.cliente
            .from('clientes')
            .update({ saldo_pendiente: saldoClientePrevio })
            .eq('id', venta.cliente_id);
        } catch {}
      }

      for (const res of restitucionesRealizadas) {
        try {
          await this.cliente
            .from('productos')
            .update({ stock_actual: res.stockPrevio })
            .eq('id', res.productoId);
        } catch {}
      }

      throw errorOperacion;
    }
  }

  /**
   * Amortiza o salda las ventas pendientes de un cliente al registrar un pago de deuda.
   * Actualiza el estado de las ventas que queden completamente cubiertas a 'Pagado' ('Cobrado').
   */
  async saldarVentasPendientes(
    clienteId: string,
    monto: number,
    metodoPago: MetodoPago
  ): Promise<Venta[]> {
    if (!clienteId || monto <= 0) return [];

    const { data: ventasPendientes, error } = await this.cliente
      .from('ventas')
      .select('*, clientes(nombre_apellido), venta_items(*, productos(nombre, unidad_venta))')
      .eq('cliente_id', clienteId)
      .eq('estado_pago', 'Pendiente')
      .order('fecha', { ascending: true })
      .order('created_at', { ascending: true });

    if (error || !ventasPendientes) {
      return [];
    }

    let remanente = Math.round(monto * 100) / 100;
    const saldadas: Venta[] = [];

    for (const v of ventasPendientes) {
      if (remanente <= 0) break;
      const totalVenta = Number(v.total || 0);
      if (remanente >= totalVenta) {
        const { error: errorUpdate } = await this.cliente
          .from('ventas')
          .update({ estado_pago: 'Pagado' })
          .eq('id', v.id);

        if (!errorUpdate) {
          guardarMetodoPagoVenta(v.id, metodoPago);
          remanente = Math.round((remanente - totalVenta) * 100) / 100;
          const ventaActualizada = mapearFilaAVenta({
            ...v,
            estado_pago: 'Pagado',
          });
          ventaActualizada.metodoPago = metodoPago;
          saldadas.push(ventaActualizada);
        }
      }
    }

    return saldadas;
  }
}

export const ventaRepositorio = new VentaRepositorio();
