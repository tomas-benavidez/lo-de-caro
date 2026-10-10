import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zmewdoqqkmhdcdgofmhe.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Cliente de conexión con Supabase configurado para la base de datos PostgreSQL.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
