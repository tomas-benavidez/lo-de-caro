import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Configuración de Supabase incompleta: Asegurate de definir VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env local.'
  );
}

/**
 * Cliente de conexión con Supabase configurado para la base de datos PostgreSQL.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
