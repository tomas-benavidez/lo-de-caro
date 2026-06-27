'use server';
import { createClient } from '../supabase/server';

export async function getLotes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('lotes_produccion')
    .select(`
      *,
      recetas (*),
      lote_ingredientes (
        *,
        insumos (*)
      )
    `)
    .order('fecha', { ascending: false });

  if (error) throw new Error(`Error al obtener lotes de producción: ${error.message}`);
  return data;
}

export async function registrarLoteProduccion(
  fecha: string,
  recetaId: string,
  cantidadProducida: number,
  registradoPor: string,
  ingredientes: { insumo_id: string; cantidad_bruta_consumida: number }[]
) {
  const supabase = await createClient();

  // Llamar al procedimiento almacenado de Postgres (RPC)
  const { data: loteId, error } = await supabase.rpc('registrar_lote_produccion_trx', {
    p_fecha: fecha,
    p_receta_id: recetaId,
    p_cantidad_producida: cantidadProducida,
    p_registrado_por: registradoPor,
    p_ingredientes: ingredientes
  });

  if (error) {
    throw new Error(`Error transaccional al registrar lote de producción: ${error.message}`);
  }

  return loteId;
}
