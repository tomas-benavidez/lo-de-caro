'use server';
import { createClient } from '../supabase/server';
import { Receta, IngredienteReceta } from '@/domain/receta';

export async function getRecetas() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('recetas')
    .select(`
      *,
      receta_ingredientes (
        *
      )
    `)
    .order('nombre', { ascending: true });

  if (error) throw new Error(`Error al obtener recetas: ${error.message}`);
  return data;
}

export async function createReceta(
  nombre: string,
  porcionesRendimiento: number,
  costoEnvase: number,
  ingredientes: Omit<IngredienteReceta, 'id' | 'receta_id'>[]
) {
  const supabase = await createClient();

  // 1. Insertar la receta
  const { data: receta, error: recetaError } = await supabase
    .from('recetas')
    .insert([{
      nombre,
      porciones_rendimiento: porcionesRendimiento,
      costo_envase: costoEnvase
    }])
    .select()
    .single();

  if (recetaError || !receta) {
    throw new Error(`Error al crear la receta: ${recetaError?.message}`);
  }

  // 2. Insertar los ingredientes asociados si existen
  if (ingredientes.length > 0) {
    const ingredientesData = ingredientes.map(ing => ({
      receta_id: receta.id,
      insumo_id: ing.insumo_id,
      peso_limpio: ing.peso_limpio,
      porcentaje_merma: ing.porcentaje_merma
    }));

    const { error: ingError } = await supabase
      .from('receta_ingredientes')
      .insert(ingredientesData);

    if (ingError) {
      // Intentar limpiar receta huérfana en caso de error
      await supabase.from('recetas').delete().eq('id', receta.id);
      throw new Error(`Error al insertar ingredientes de receta: ${ingError.message}`);
    }
  }

  return receta;
}
