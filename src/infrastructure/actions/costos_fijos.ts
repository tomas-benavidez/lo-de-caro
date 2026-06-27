'use server';
import { createClient } from '../supabase/server';

export async function getCostosFijos() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('costos_fijos')
    .select('*')
    .order('concepto', { ascending: true });

  if (error) throw new Error(`Error al obtener costos fijos: ${error.message}`);
  return data.map(item => ({
    ...item,
    monto: Number(item.monto),
    created_at: new Date(item.created_at)
  }));
}

export async function createCostoFijo(concepto: string, monto: number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('costos_fijos')
    .insert([{ concepto, monto }])
    .select()
    .single();

  if (error) throw new Error(`Error al crear costo fijo: ${error.message}`);
  return data;
}
