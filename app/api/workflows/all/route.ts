import { NextRequest, NextResponse } from 'next/server'
import { runAllWorkflows, getWorkflowStatus } from '@/lib/workflows'

/**
 * Endpoint para ejecutar TODOS los workflows de una vez
 * GET|POST /api/workflows/all
 *
 * Parámetros:
 * - action: 'run' o 'status'
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
    const action = searchParams.get('action') || 'run'

    if (action === 'status') {
      const status = getWorkflowStatus()
      return NextResponse.json({
        success: true,
        action: 'status',
        workflows: status,
      })
    }

    // action === 'run'
    const result = await runAllWorkflows()

    return NextResponse.json({
      success: true,
      action: 'run',
      results: result,
    })
  } catch (error) {
    console.error('Error en /api/workflows/all:', error)
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
