import { NextRequest, NextResponse } from 'next/server'
import { executeWorkflow } from '@/lib/n8n-client'

/**
 * Ejecutar un workflow n8n bajo demanda
 * Endpoint interno para sincronizaciones o consultas
 *
 * POST /api/n8n/execute
 * Body: { "workflow": "metaAdsSync", "payload": { ... } }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { workflow, payload } = body

    if (!workflow) {
      return NextResponse.json(
        { error: 'Falta parámetro: workflow' },
        { status: 400 }
      )
    }

    const result = await executeWorkflow(workflow as any, payload)

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    })
  } catch (error) {
    console.error('Error ejecutando workflow n8n:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    )
  }
}
