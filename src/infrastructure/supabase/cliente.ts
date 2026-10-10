import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://zmewdoqqkmhdcdgofmhe.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptZXdkb3Fxa21oZGNkZ29mbWhlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1NzczNzEsImV4cCI6MjEwNzE1MzM3MX0.wGLBhQA36FP9qJRxdURFg0bTDndGPTIQMPOKy9--nJE';

/**
 * Cliente de conexión con Supabase configurado para la base de datos PostgreSQL.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
