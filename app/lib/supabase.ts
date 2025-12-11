import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';

// Crear cliente con valores por defecto para evitar errores si faltan variables
// Las consultas fallarán suavemente si Supabase no está configurado
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey);

// Función helper para crear cliente (usado en server-side routes)
export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}

// Función helper para verificar si Supabase está configurado
export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'placeholder-key'
  );
}

