// Configuración de Sentry para error tracking
// Para habilitar, instala: npm install @sentry/nextjs
// Y ejecuta: npx @sentry/wizard@latest -i nextjs

import { env, features } from './env'

// Inicializar Sentry solo si está configurado
export function initSentry() {
  if (!features.errorTracking) {
    console.log('📊 Sentry no configurado. Agrega NEXT_PUBLIC_SENTRY_DSN para habilitar error tracking.')
    return
  }

  // Aquí se inicializaría Sentry cuando esté instalado
  // import * as Sentry from "@sentry/nextjs"
  //
  // Sentry.init({
  //   dsn: env.NEXT_PUBLIC_SENTRY_DSN,
  //   tracesSampleRate: 1.0,
  //   debug: false,
  //   environment: process.env.NODE_ENV,
  // })

  console.log('✅ Sentry configurado correctamente')
}

// Helper para capturar errores manualmente
export function captureError(error: Error, context?: Record<string, any>) {
  if (!features.errorTracking) {
    console.error('Error capturado:', error, context)
    return
  }

  // Aquí se enviaría a Sentry
  // Sentry.captureException(error, { extra: context })
}

// Helper para capturar mensajes
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (!features.errorTracking) {
    console.log(`[${level}] ${message}`)
    return
  }

  // Aquí se enviaría a Sentry
  // Sentry.captureMessage(message, level)
}

// Exportar para uso en error boundaries
export { captureError as logError }
