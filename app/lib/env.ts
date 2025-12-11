import { z } from 'zod'

// Schema de validación para variables de entorno del servidor
const serverEnvSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // AWS S3 (Opcionales pero recomendadas)
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_S3_BUCKET_NAME: z.string().optional(),

  // OpenAI (Opcional)
  OPENAI_API_KEY: z.string().optional(),

  // Sentry (Opcional)
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

// Schema para variables públicas (cliente)
const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
})

// Validar variables de entorno
function validateEnv() {
  // Solo validar en el servidor
  if (typeof window === 'undefined') {
    const parsed = serverEnvSchema.safeParse(process.env)

    if (!parsed.success) {
      console.error('❌ Variables de entorno inválidas:')
      console.error(parsed.error.flatten().fieldErrors)

      // En desarrollo, mostrar advertencia pero continuar
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️  Continuando en modo desarrollo con configuración incompleta')
        return null
      }

      // En producción, fallar
      throw new Error('Variables de entorno inválidas')
    }

    return parsed.data
  }

  // En el cliente, solo validar variables públicas
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  })

  if (!parsed.success) {
    console.error('❌ Variables de entorno públicas inválidas')
    return null
  }

  return parsed.data
}

// Exportar variables validadas
export const env = validateEnv()

// Helper para verificar si una funcionalidad está disponible
export const features = {
  s3Upload: !!(env && 'AWS_S3_BUCKET_NAME' in env && env.AWS_S3_BUCKET_NAME),
  aiInsights: !!(env && 'OPENAI_API_KEY' in env && env.OPENAI_API_KEY),
  errorTracking: !!(env && 'NEXT_PUBLIC_SENTRY_DSN' in env && env.NEXT_PUBLIC_SENTRY_DSN),
}

// Tipo para TypeScript
export type Env = z.infer<typeof serverEnvSchema>
