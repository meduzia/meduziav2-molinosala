/**
 * API v2 - Generar Prompts
 *
 * POST /api/v2/campaigns/[id]/prompts/generate
 *
 * Ejecuta el Agente 3 para generar prompts de imagen y video
 */

import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse, ContentPrompt } from '@/lib/types/campaign-types'
import { getCampaignState, addPrompts } from '@/lib/stores/campaign-store'
import { executePromptsAgentBatch } from '@/lib/agents-v2'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<ContentPrompt[]>>> {
  try {
    const { id } = await params
    const state = getCampaignState(id)

    if (!state) {
      return NextResponse.json({ success: false, error: 'Campaña no encontrada' }, { status: 404 })
    }

    // Filtrar ángulos que tienen configuración de contenido
    const anglesWithContent = state.angles.filter(
      (a) => a.imagesRequested > 0 || a.videosRequested > 0
    )

    if (anglesWithContent.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay ángulos configurados con contenido a generar' },
        { status: 400 }
      )
    }

    // Crear mapa de arquetipos para lookup rápido
    const archetypesMap = new Map(state.archetypes.map((a) => [a.id, a]))

    console.log(`[API] Generando prompts para ${anglesWithContent.length} ángulos`)

    // Ejecutar Agente 3 - Prompts
    const prompts = await executePromptsAgentBatch(anglesWithContent, archetypesMap, state.campaign)

    // Guardar resultados
    addPrompts(id, prompts)

    const imagePrompts = prompts.filter((p) => p.type === 'image').length
    const videoPrompts = prompts.filter((p) => p.type === 'video').length

    console.log(`[API] Prompts generados: ${imagePrompts} imágenes, ${videoPrompts} videos`)

    return NextResponse.json({
      success: true,
      data: prompts,
      message: `${prompts.length} prompts generados (${imagePrompts} imágenes, ${videoPrompts} videos)`,
    })
  } catch (error) {
    console.error('[API] Error generando prompts:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error generando prompts',
      },
      { status: 500 }
    )
  }
}
