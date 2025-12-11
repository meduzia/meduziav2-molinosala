import { NextRequest, NextResponse } from 'next/server'
import { generateInsightsNow } from '@/lib/workflows'

/**
 * Endpoint para generar insights automáticamente
 * GET|POST /api/workflows/insights?from=2024-01-08&to=2024-01-15&force=true
 *
 * Parámetros:
 * - from: fecha inicio (YYYY-MM-DD)
 * - to: fecha fin (YYYY-MM-DD)
 * - force: forzar regeneración de insights
 * - x-api-key: API key de seguridad
 */
export async function GET(request: NextRequest) {
  try {
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
    const force = searchParams.get('force') === 'true'

    const result = await generateInsightsNow({
      from: from || undefined,
      to: to || undefined,
      force,
    })

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    })
  } catch (error) {
    console.error('Error en /api/workflows/insights:', error)
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
