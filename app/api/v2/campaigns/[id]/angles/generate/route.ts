/**
 * API v2 - Generar Ángulos
 *
 * POST /api/v2/campaigns/[id]/angles/generate
 *
 * Ejecuta el Agente 2 para generar ángulos creativos para los arquetipos seleccionados
 */

import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse, Angle } from '@/lib/types/campaign-types'
import { getCampaignState, getSelectedArchetypes, addAngles } from '@/lib/stores/campaign-store'
import { executeAnglesAgentBatch } from '@/lib/agents-v2'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Angle[]>>> {
  try {
    const { id } = await params
    const state = getCampaignState(id)

    if (!state) {
      return NextResponse.json({ success: false, error: 'Campaña no encontrada' }, { status: 404 })
    }

    const selectedArchetypes = getSelectedArchetypes(id)

    if (selectedArchetypes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay arquetipos seleccionados' },
        { status: 400 }
      )
    }

    console.log(`[API] Generando ángulos para ${selectedArchetypes.length} arquetipos`)

    // Ejecutar Agente 2 - Ángulos
    const angles = await executeAnglesAgentBatch(selectedArchetypes, state.campaign)

    // Guardar resultados
    addAngles(id, angles)

    console.log(`[API] Ángulos generados: ${angles.length}`)

    return NextResponse.json({
      success: true,
      data: angles,
      message: `${angles.length} ángulos generados`,
    })
  } catch (error) {
    console.error('[API] Error generando ángulos:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error generando ángulos',
      },
      { status: 500 }
    )
  }
}
