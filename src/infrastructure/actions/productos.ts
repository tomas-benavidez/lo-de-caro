'use server';
import { createClient } from '../supabase/server';
import { ProductoVenta } from '@/domain/producto';

export async function getProductos() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('productos')
    .select(`
      *,
      recetas (
        *,
        receta_ingredientes (
          *,
          insumos (*)
        )
      )
    `)
    .order('nombre', { ascending: true });

  if (error) throw new Error(`Error al obtener productos: ${error.message}`);
  return data;
}

export async function createProducto(data: Omit<ProductoVenta, 'id' | 'created_at'>) {
  const supabase = await createClient();
  const { data: producto, error } = await supabase
    .from('productos')
    .insert([{
      nombre: data.nombre,
      receta_id: data.receta_id,
      unidad_venta: data.unidad_venta,
      cantidad_unidades_base: data.cantidad_unidades_base,
      precio_lista: data.precio_lista
    }])
    .select()
    .single();

  if (error) throw new Error(`Error al crear producto: ${error.message}`);
  return producto;
}
