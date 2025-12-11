import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import type { User } from './auth'

// Cliente para componentes del servidor - SOLO USE EN SERVER COMPONENTS
export const createServerClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient<Database>({
    cookies: () => cookieStore
  })
}

// Verificar sesión en el servidor - SOLO EN SERVER COMPONENTS
export async function getSession() {
  const supabase = createServerClient()

  try {
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Error obteniendo sesión:', error)
      return null
    }

    return session
  } catch (error) {
    console.error('Error en getSession:', error)
    return null
  }
}

// Obtener usuario actual - SOLO EN SERVER COMPONENTS
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()

  if (!session?.user) {
    return null
  }

  return {
    id: session.user.id,
    email: session.user.email!,
    role: session.user.user_metadata?.role || 'analyst',
    metadata: {
      full_name: session.user.user_metadata?.full_name,
      avatar_url: session.user.user_metadata?.avatar_url,
    },
  }
}

// Verificar si el usuario tiene un rol específico
export async function hasRole(role: User['role']) {
  const user = await getCurrentUser()
  return user?.role === role
}

// Verificar si el usuario es admin
export async function isAdmin() {
  return hasRole('admin')
}
