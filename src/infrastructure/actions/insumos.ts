'use server';
import { createClient } from '../supabase/server';
import { Insumo, calcularCostoBrutoUnitario } from '@/domain/insumo';
import { round } from '@/domain/utils';

export async function getInsumos(): Promise<Insumo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('insumos')
    .select('*')
    .order('nombre', { ascending: true });

  if (error) throw new Error(`Error al obtener insumos: ${error.message}`);
  return data.map(item => ({
    ...item,
    created_at: new Date(item.created_at),
    costo_bruto_unitario: Number(item.costo_bruto_unitario),
    stock_actual: Number(item.stock_actual),
    stock_minimo: item.stock_minimo ? Number(item.stock_minimo) : undefined,
  }));
}

export async function createInsumo(data: Omit<Insumo, 'id' | 'created_at' | 'costo_bruto_unitario'>) {
  const supabase = await createClient();
  const { data: insumo, error } = await supabase
    .from('insumos')
    .insert([{
      nombre: data.nombre,
      unidad_medida: data.unidad_medida,
      stock_actual: data.stock_actual,
      stock_minimo: data.stock_minimo,
      costo_bruto_unitario: 0.0000
    }])
    .select()
    .single();

  if (error) throw new Error(`Error al crear insumo: ${error.message}`);
  return insumo;
}

export async function registrarCompraInsumo(insumoId: string, precioPagado: number, cantidadComprada: number) {
  const supabase = await createClient();

  // 1. Obtener el insumo actual
  const { data: insumo, error: fetchError } = await supabase
    .from('insumos')
    .select('*')
    .eq('id', insumoId)
    .single();

  if (fetchError || !insumo) {
    throw new Error(`Insumo no encontrado: ${fetchError?.message}`);
  }

  // 2. Calcular costo unitario de esta compra usando el dominio
  const costoCompraUnitario = calcularCostoBrutoUnitario(precioPagado, cantidadComprada);

  // 3. Calcular nuevo costo promedio ponderado
  const stockActual = Number(insumo.stock_actual);
  const costoActual = Number(insumo.costo_bruto_unitario);
  let nuevoCosto = costoCompraUnitario;

  if (stockActual > 0) {
    const totalCostoActual = stockActual * costoActual;
    const nuevoStockTotal = stockActual + cantidadComprada;
    nuevoCosto = round((totalCostoActual + precioPagado) / nuevoStockTotal, 4);
  }

  const nuevoStock = stockActual + cantidadComprada;

  // 4. Actualizar en base de datos
  const { data: updated, error: updateError } = await supabase
    .from('insumos')
    .update({
      stock_actual: nuevoStock,
      costo_bruto_unitario: nuevoCosto
    })
    .eq('id', insumoId)
    .select()
    .single();

  if (updateError) throw new Error(`Error al actualizar stock y costo: ${updateError.message}`);
  return updated;
}
