'use server';
import { createClient } from '../supabase/server';

export async function getInversiones() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inversiones')
    .select('*')
    .order('fecha_compra', { ascending: false });

  if (error) throw new Error(`Error al obtener inversiones: ${error.message}`);
  return data.map(item => ({
    ...item,
    fecha_compra: new Date(item.fecha_compra),
    created_at: new Date(item.created_at),
    monto: Number(item.monto),
    vida_util_anios: Number(item.vida_util_anios)
  }));
}

export async function createInversion(
  nombre: string,
  monto: number,
  vidaUtilAnios: number,
  fechaCompra: string,
  registradoPor?: string
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inversiones')
    .insert([{
      nombre,
      monto,
      vida_util_anios: vidaUtilAnios,
      fecha_compra: fechaCompra,
      registrado_por: registradoPor
    }])
    .select()
    .single();

  if (error) throw new Error(`Error al crear inversión: ${error.message}`);
  return data;
}
