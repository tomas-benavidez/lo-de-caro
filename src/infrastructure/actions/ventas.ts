'use server';
import { createClient } from '../supabase/server';

export async function getVentas() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('ventas')
    .select(`
      *,
      clientes (*),
      venta_items (
        *,
        productos (*)
      )
    `)
    .order('fecha', { ascending: false });

  if (error) throw new Error(`Error al obtener ventas: ${error.message}`);
  return data;
}

export async function registrarVenta(
  clienteId: string,
  estadoCobro: 'Cobrada' | 'Pendiente',
  registradoPor: string,
  items: { producto_id: string; cantidad: number; precio_cobrado_real: number }[]
) {
  const supabase = await createClient();

  const { data: ventaId, error } = await supabase.rpc('registrar_venta_trx', {
    p_cliente_id: clienteId,
    p_estado_cobro: estadoCobro,
    p_registrado_por: registradoPor,
    p_items: items
  });

  if (error) {
    throw new Error(`Error transaccional al registrar venta: ${error.message}`);
  }

  return ventaId;
}
