/**
 * API v2 - Generar Arquetipos
 *
 * POST /api/v2/campaigns/[id]/archetypes/generate
 *
 * Ejecuta el Agente 1 (Estratega) para generar research y arquetipos
 */

import { NextRequest, NextResponse } from 'next/server'
import type { ArchetypesGenerationResult, ApiResponse } from '@/lib/types/campaign-types'
import { getCampaignState, setResearchAndArchetypes } from '@/lib/stores/campaign-store'
import { executeStrategistAgent } from '@/lib/agents-v2'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<ArchetypesGenerationResult>>> {
  try {
    const { id } = await params
    const state = getCampaignState(id)

    if (!state) {
      return NextResponse.json({ success: false, error: 'Campaña no encontrada' }, { status: 404 })
    }

    console.log(`[API] Generando arquetipos para campaña: ${id}`)

    // Ejecutar Agente 1 - Estratega
    const result = await executeStrategistAgent(state.campaign)

    // Guardar resultados
    setResearchAndArchetypes(
      id,
      result.research,
      result.archetypes,
      result.opportunities,
      result.positioningRoutes
    )

    console.log(`[API] Arquetipos generados: ${result.archetypes.length}`)

    return NextResponse.json({
      success: true,
      data: result,
      message: `${result.archetypes.length} arquetipos generados`,
    })
  } catch (error) {
    console.error('[API] Error generando arquetipos:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error generando arquetipos',
      },
      { status: 500 }
    )
  }
}
