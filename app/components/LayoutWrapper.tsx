'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'

const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/update-password']

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // No mostrar sidebar en rutas de autenticación
  const isAuthRoute = AUTH_ROUTES.includes(pathname)

  if (isAuthRoute) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
