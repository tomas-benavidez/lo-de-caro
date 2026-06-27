'use server';
import { createClient } from '../supabase/server';

export async function getConfiguraciones() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('configuracion')
    .select('*');

  if (error) throw new Error(`Error al obtener configuraciones: ${error.message}`);
  return data;
}

export async function getConfiguracionClave(clave: string): Promise<string | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('configuracion')
    .select('valor')
    .eq('clave', clave)
    .maybeSingle();

  if (error) throw new Error(`Error al obtener configuración por clave: ${error.message}`);
  return data ? data.valor : null;
}

export async function upsertConfiguracion(clave: string, valor: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('configuracion')
    .upsert(
      { clave, valor, updated_at: new Date().toISOString() },
      { onConflict: 'clave' }
    )
    .select()
    .single();

  if (error) throw new Error(`Error al upsertar configuración: ${error.message}`);
  return data;
}
