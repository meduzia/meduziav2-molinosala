import { NextRequest, NextResponse } from 'next/server'
import { syncMetaAdsNow } from '@/lib/workflows'

/**
 * Endpoint para sincronizar datos de Meta Ads bajo demanda
 * GET|POST /api/workflows/sync?from=2024-01-08&to=2024-01-15
 *
 * Autenticación: Verifica que sea un cron job válido
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar API key (seguridad básica)
    const apiKey = request.headers.get('x-api-key')
    const validKey = process.env.WORKFLOW_API_KEY

    if (validKey && apiKey !== validKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = request.nextUrl
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const result = await syncMetaAdsNow({
      from: from || undefined,
      to: to || undefined,
    })

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    })
  } catch (error) {
    console.error('Error en /api/workflows/sync:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
