'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

/**
 * Crear cliente de Supabase sin límite de sesión
 * Las sesiones se mantienen indefinidamente en localStorage
 * No expiran automaticamente
 */
export const createBrowserClient = () => {
  return createClientComponentClient<Database>({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    options: {
      auth: {
        // Mantener sesión indefinidamente
        persistSession: true,
        autoRefreshToken: true,
        // Detectar cambios en otras pestañas/ventanas
        detectSessionInUrl: true,
      },
    },
  })
}

// Tipos para autenticación
export type User = {
  id: string
  email: string
  role?: 'admin' | 'manager' | 'analyst' | 'creative'
  metadata?: {
    full_name?: string
    avatar_url?: string
  }
}
