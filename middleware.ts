import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ⚠️ MODO DESARROLLO: Autenticación deshabilitada temporalmente
// TODO: Reactivar autenticación antes de producción

export async function middleware(req: NextRequest) {
  // Bypass completo - permitir acceso a todas las rutas
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
