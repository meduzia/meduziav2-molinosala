/**
 * API v2 - Configurar Ángulos
 *
 * POST /api/v2/campaigns/[id]/angles/configure
 *
 * Configura cuántas imágenes y videos generar por ángulo
 */

import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse, Angle } from '@/lib/types/campaign-types'
import { getCampaignState, updateAngleConfig } from '@/lib/stores/campaign-store'

interface AngleConfig {
  angleId: string
  imagesRequested: number
  videosRequested: number
}

interface ConfigureAnglesBody {
  configs: AngleConfig[]
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Angle[]>>> {
  try {
    const { id } = await params
    const body: ConfigureAnglesBody = await request.json()

    const state = getCampaignState(id)
    if (!state) {
      return NextResponse.json({ success: false, error: 'Campaña no encontrada' }, { status: 404 })
    }

    if (!body.configs || !Array.isArray(body.configs)) {
      return NextResponse.json(
        { success: false, error: 'configs debe ser un array' },
        { status: 400 }
      )
    }

    // Actualizar configuración de cada ángulo
    let updated = 0
    for (const config of body.configs) {
      const success = updateAngleConfig(
        id,
        config.angleId,
        config.imagesRequested || 0,
        config.videosRequested || 0
      )
      if (success) updated++
    }

    // Obtener ángulos actualizados
    const updatedState = getCampaignState(id)

    console.log(`[API] Ángulos configurados: ${updated}`)

    return NextResponse.json({
      success: true,
      data: updatedState?.angles || [],
      message: `${updated} ángulos configurados`,
    })
  } catch (error) {
    console.error('[API] Error configurando ángulos:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error configurando ángulos',
      },
      { status: 500 }
    )
  }
}
