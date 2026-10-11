import { SupabaseClient } from '@supabase/supabase-js';
import { supabase as clientePorDefecto } from '../supabase/cliente.ts';
import {
  Gasto,
  NuevoGastoInput,
  MetodoPagoGasto,
  DetalleCompraMateriaPrima,
  CategoriaGasto,
} from '../../domain/models/gasto.ts';
import { MateriaPrima, UnidadMedida } from '../../domain/models/materiaPrima.ts';
import {
  calcularNuevoCostoUnitario,
  validarNuevoGasto,
} from '../../domain/services/gastoServicio.ts';

export interface GastoFila {
  id: string;
  fecha: string;
  concepto: string;
  categoria: string;
  monto: number | string;
  created_at?: string;
}

export interface MetadatosGasto {
  metodoPago: MetodoPagoGasto;
  compraMateriaPrima?: DetalleCompraMateriaPrima;
  costoPrevio?: number;
}

const STORAGE_PREFIX = 'lo_de_caro_gasto_meta_';
const memoriaLocal = new Map<string, string>();

const META_TAG_PREFIX = '<!--meta:';
const META_TAG_SUFFIX = '-->';
const META_REGEX = /\s*<!--meta:(.*?)-->\s*$/;

/**
 * Codifica metadatos dentro del texto del concepto para asegurar persistencia
 * atómica en Postgres sin depender exclusivamente del navegador cliente.
 */
export function codificarConceptoConMetadatos(
  conceptoBase: string,
  metadatos: MetadatosGasto
): string {
  const payload: Record<string, string | number> = {
    m: metadatos.metodoPago === 'Transferencia' ? 'T' : 'E',
  };

  if (metadatos.compraMateriaPrima) {
    payload.id = metadatos.compraMateriaPrima.materiaPrimaId;
    payload.c = metadatos.compraMateriaPrima.cantidadComprada;
    payload.u = metadatos.compraMateriaPrima.unidadMedida;
    if (metadatos.compraMateriaPrima.nuevoCostoUnitario !== undefined) {
      payload.nc = metadatos.compraMateriaPrima.nuevoCostoUnitario;
    }
  }

  if (metadatos.costoPrevio !== undefined) {
    payload.cp = metadatos.costoPrevio;
  }

  const json = JSON.stringify(payload);
  const tag = ` ${META_TAG_PREFIX}${json}${META_TAG_SUFFIX}`;
  const maxLongitud = 200;
  let limpio = conceptoBase.trim();
  if (limpio.length + tag.length > maxLongitud) {
    limpio = limpio.slice(0, maxLongitud - tag.length).trim();
  }
  return `${limpio}${tag}`;
}

/**
 * Extrae los metadatos y el texto limpio a partir de un concepto de Postgres.
 */
export function decodificarConceptoYMetadatos(conceptoBruto: string): {
  concepto: string;
  metadatos: MetadatosGasto | null;
} {
  const match = conceptoBruto.match(META_REGEX);
  if (!match) {
    return { concepto: conceptoBruto, metadatos: null };
  }

  const textoLimpio = conceptoBruto.replace(META_REGEX, '').trim();
  try {
    const raw = JSON.parse(match[1]);
    const metodoPago: MetodoPagoGasto = raw.m === 'T' ? 'Transferencia' : 'Efectivo';
    let compraMateriaPrima: DetalleCompraMateriaPrima | undefined;

    if (raw.id && raw.c !== undefined) {
      compraMateriaPrima = {
        materiaPrimaId: String(raw.id),
        nombreMateriaPrima: textoLimpio,
        cantidadComprada: Number(raw.c),
        unidadMedida: (raw.u as UnidadMedida) || 'kg',
        actualizarCostoUnitario: raw.nc !== undefined,
        nuevoCostoUnitario: raw.nc !== undefined ? Number(raw.nc) : undefined,
      };
    }

    return {
      concepto: textoLimpio,
      metadatos: {
        metodoPago,
        compraMateriaPrima,
        costoPrevio: raw.cp !== undefined ? Number(raw.cp) : undefined,
      },
    };
  } catch {
    return { concepto: textoLimpio, metadatos: null };
  }
}

/**
 * Obtiene los metadatos almacenados de un gasto (método de pago y detalle de compra).
 */
export function obtenerMetadatosGasto(gastoId: string): MetadatosGasto | null {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem) {
      const data = localStorage.getItem(`${STORAGE_PREFIX}${gastoId}`);
      if (data) {
        return JSON.parse(data);
      }
    }
  } catch {
    // Continuar al fallback en memoria
  }

  const enMemoria = memoriaLocal.get(`${STORAGE_PREFIX}${gastoId}`);
  if (enMemoria) {
    try {
      return JSON.parse(enMemoria);
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Guarda los metadatos de un gasto en almacenamiento local y en memoria.
 */
export function guardarMetadatosGasto(gastoId: string, metadatos: MetadatosGasto): void {
  const serializado = JSON.stringify(metadatos);
  memoriaLocal.set(`${STORAGE_PREFIX}${gastoId}`, serializado);

  try {
    if (typeof localStorage !== 'undefined' && localStorage.setItem) {
      localStorage.setItem(`${STORAGE_PREFIX}${gastoId}`, serializado);
    }
  } catch {
    // Silencioso ante falta de storage
  }
}

/**
 * Elimina los metadatos de un gasto.
 */
export function eliminarMetadatosGasto(gastoId: string): void {
  memoriaLocal.delete(`${STORAGE_PREFIX}${gastoId}`);

  try {
    if (typeof localStorage !== 'undefined' && localStorage.removeItem) {
      localStorage.removeItem(`${STORAGE_PREFIX}${gastoId}`);
    }
  } catch {
    // Silencioso
  }
}

/**
 * Convierte un registro de base de datos Postgres en la entidad de dominio Gasto.
 */
export function mapearFilaAGasto(fila: GastoFila): Gasto {
  const decodificado = decodificarConceptoYMetadatos(fila.concepto || '');
  const metadatosLocales = obtenerMetadatosGasto(fila.id);

  const metodoPago =
    decodificado.metadatos?.metodoPago || metadatosLocales?.metodoPago || 'Efectivo';

  const compraMateriaPrima =
    metadatosLocales?.compraMateriaPrima || decodificado.metadatos?.compraMateriaPrima;

  // Sincronizar cache local si venía embebido en Postgres
  if (decodificado.metadatos && !metadatosLocales) {
    guardarMetadatosGasto(fila.id, {
      metodoPago,
      compraMateriaPrima,
      costoPrevio: decodificado.metadatos.costoPrevio,
    });
  }

  return {
    id: fila.id,
    fecha: fila.fecha,
    concepto: decodificado.concepto,
    categoria: fila.categoria as CategoriaGasto,
    monto: Number(fila.monto) || 0,
    metodoPago,
    compraMateriaPrima,
    fechaCreacion: fila.created_at,
  };
}

export class GastoRepositorio {
  private cliente: SupabaseClient;

  constructor(clienteInyectado?: SupabaseClient) {
    this.cliente = clienteInyectado || clientePorDefecto;
  }

  /**
   * Lista todos los gastos ordenados por fecha y fecha de creación descendente.
   */
  async listar(): Promise<Gasto[]> {
    const { data, error } = await this.cliente
      .from('gastos')
      .select('*')
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error al listar gastos: ${error.message}`);
    }

    return (data || []).map((fila) => mapearFilaAGasto(fila));
  }

  /**
   * Registra un nuevo gasto. Si corresponde a compra de materia prima,
   * consulta el stock actual en Supabase y actualiza atómicamente con rollback defensivo.
   */
  async registrarGasto(
    input: NuevoGastoInput,
    materiaPrimaActual?: MateriaPrima
  ): Promise<Gasto> {
    const validacion = validarNuevoGasto(input);
    if (!validacion.valido) {
      throw new Error(validacion.error || 'Datos de gasto inválidos');
    }

    const fechaGasto = input.fecha || new Date().toISOString().split('T')[0];
    const conceptoLimpio = input.concepto.trim();

    if (input.categoria === 'Materia Prima' && input.compraMateriaPrima) {
      const { materiaPrimaId, cantidadComprada, actualizarCostoUnitario } =
        input.compraMateriaPrima;

      // 1. Consultar el estado real de la materia prima en base de datos
      const { data: mpData, error: errorFetchMp } = await this.cliente
        .from('materias_primas')
        .select('id, nombre, unidad_medida, stock_actual, costo_unitario')
        .eq('id', materiaPrimaId)
        .single();

      if (errorFetchMp && !materiaPrimaActual) {
        throw new Error(
          `No se pudo encontrar la materia prima a actualizar: ${errorFetchMp.message}`
        );
      }

      const stockBase = mpData
        ? Number(mpData.stock_actual)
        : materiaPrimaActual
        ? Number(materiaPrimaActual.stockActual)
        : 0;

      const cantidad = Number(cantidadComprada);
      const montoTotal = Number(input.monto);
      const nuevoCosto = calcularNuevoCostoUnitario(montoTotal, cantidad);
      const nuevoStock = Math.round((stockBase + cantidad) * 100) / 100;
      const costoPrevio = mpData
        ? Number(mpData.costo_unitario)
        : materiaPrimaActual?.costoUnitario;

      const detalleCompra: DetalleCompraMateriaPrima = {
        materiaPrimaId,
        nombreMateriaPrima:
          mpData?.nombre || materiaPrimaActual?.nombre || conceptoLimpio,
        cantidadComprada: cantidad,
        unidadMedida:
          (mpData?.unidad_medida as UnidadMedida) ||
          materiaPrimaActual?.unidadMedida ||
          'kg',
        actualizarCostoUnitario,
        nuevoCostoUnitario: nuevoCosto,
      };

      // 2. Codificar concepto con metadatos para persistencia atómica en Postgres
      const conceptoConMeta = codificarConceptoConMetadatos(conceptoLimpio, {
        metodoPago: input.metodoPago,
        compraMateriaPrima: detalleCompra,
        costoPrevio,
      });

      // 3. Insertar el gasto en la tabla gastos
      const { data: gastoCreado, error: errorGasto } = await this.cliente
        .from('gastos')
        .insert({
          fecha: fechaGasto,
          concepto: conceptoConMeta,
          categoria: input.categoria,
          monto: montoTotal,
        })
        .select()
        .single();

      if (errorGasto || !gastoCreado) {
        throw new Error(
          `Error al registrar gasto: ${errorGasto?.message || 'Sin respuesta'}`
        );
      }

      // 4. Actualizar materias_primas en base de datos
      const updatePayload: { stock_actual: number; costo_unitario?: number } = {
        stock_actual: nuevoStock,
      };

      if (actualizarCostoUnitario) {
        updatePayload.costo_unitario = nuevoCosto;
      }

      const { error: errorMateria } = await this.cliente
        .from('materias_primas')
        .update(updatePayload)
        .eq('id', materiaPrimaId);

      if (errorMateria) {
        // Rollback defensivo: eliminar el gasto recién creado
        await this.cliente.from('gastos').delete().eq('id', gastoCreado.id);
        throw new Error(
          'Error al actualizar el stock de materia prima. Se revirtió el registro del gasto.'
        );
      }

      guardarMetadatosGasto(gastoCreado.id, {
        metodoPago: input.metodoPago,
        compraMateriaPrima: detalleCompra,
        costoPrevio,
      });

      return {
        id: gastoCreado.id,
        fecha: gastoCreado.fecha,
        concepto: conceptoLimpio,
        categoria: gastoCreado.categoria as CategoriaGasto,
        monto: montoTotal,
        metodoPago: input.metodoPago,
        compraMateriaPrima: detalleCompra,
        fechaCreacion: gastoCreado.created_at,
      };
    } else {
      // Gasto estándar sin vinculación a materia prima
      const conceptoConMeta = codificarConceptoConMetadatos(conceptoLimpio, {
        metodoPago: input.metodoPago,
      });

      const { data: gastoCreado, error: errorGasto } = await this.cliente
        .from('gastos')
        .insert({
          fecha: fechaGasto,
          concepto: conceptoConMeta,
          categoria: input.categoria,
          monto: Number(input.monto),
        })
        .select()
        .single();

      if (errorGasto || !gastoCreado) {
        throw new Error(
          `Error al registrar gasto: ${errorGasto?.message || 'Sin respuesta'}`
        );
      }

      guardarMetadatosGasto(gastoCreado.id, {
        metodoPago: input.metodoPago,
      });

      return {
        id: gastoCreado.id,
        fecha: gastoCreado.fecha,
        concepto: conceptoLimpio,
        categoria: gastoCreado.categoria as CategoriaGasto,
        monto: Number(gastoCreado.monto),
        metodoPago: input.metodoPago,
        fechaCreacion: gastoCreado.created_at,
      };
    }
  }

  /**
   * Elimina un gasto. Si tenía compra de materia prima asociada, restituye el stock
   * consultando la base de datos de forma atómica.
   */
  async eliminarGasto(
    gastoId: string,
    materiaPrimaActual?: MateriaPrima
  ): Promise<void> {
    let detalleCompra = obtenerMetadatosGasto(gastoId)?.compraMateriaPrima;
    let costoPrevio = obtenerMetadatosGasto(gastoId)?.costoPrevio;

    if (!detalleCompra) {
      const { data: gastoDb } = await this.cliente
        .from('gastos')
        .select('concepto')
        .eq('id', gastoId)
        .single();

      if (gastoDb?.concepto) {
        const decodificado = decodificarConceptoYMetadatos(gastoDb.concepto);
        if (decodificado.metadatos?.compraMateriaPrima) {
          detalleCompra = decodificado.metadatos.compraMateriaPrima;
          costoPrevio = decodificado.metadatos.costoPrevio;
        }
      }
    }

    // Si tenía materia prima vinculada, restituir el stock restando la cantidad
    if (detalleCompra) {
      const mpId = detalleCompra.materiaPrimaId;
      const { data: mpData } = await this.cliente
        .from('materias_primas')
        .select('stock_actual, costo_unitario')
        .eq('id', mpId)
        .single();

      const stockActual = mpData
        ? Number(mpData.stock_actual)
        : materiaPrimaActual
        ? Number(materiaPrimaActual.stockActual)
        : 0;

      const cantidadARestar = Number(detalleCompra.cantidadComprada);
      const stockRestituido = Math.max(
        0,
        Math.round((stockActual - cantidadARestar) * 100) / 100
      );

      const updateMpPayload: { stock_actual: number; costo_unitario?: number } = {
        stock_actual: stockRestituido,
      };

      if (costoPrevio !== undefined) {
        updateMpPayload.costo_unitario = costoPrevio;
      }

      await this.cliente
        .from('materias_primas')
        .update(updateMpPayload)
        .eq('id', mpId);
    }

    const { error } = await this.cliente.from('gastos').delete().eq('id', gastoId);

    if (error) {
      throw new Error(`Error al eliminar gasto: ${error.message}`);
    }

    eliminarMetadatosGasto(gastoId);
  }
}

export const gastoRepositorio = new GastoRepositorio();
