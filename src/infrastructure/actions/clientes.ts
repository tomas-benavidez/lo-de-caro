'use server';
import { createClient } from '../supabase/server';

export async function getClientes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('clientes')
    .select('*')
    .order('nombre_apellido', { ascending: true });

  if (error) throw new Error(`Error al obtener clientes: ${error.message}`);
  return data;
}

export async function createCliente(nombreApellido: string, telefono?: string, notas?: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('clientes')
    .insert([{
      nombre_apellido: nombreApellido,
      telefono,
      notas
    }])
    .select()
    .single();

  if (error) throw new Error(`Error al crear cliente: ${error.message}`);
  return data;
}
