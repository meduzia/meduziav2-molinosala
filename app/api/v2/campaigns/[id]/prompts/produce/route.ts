/**
 * API v2 - Producir Contenido
 *
 * POST /api/v2/campaigns/[id]/prompts/produce
 *
 * Envía los prompts seleccionados a Nano Banana 2 y Sora 2 PRO
 */

import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/lib/types/campaign-types'
import {
  getCampaignState,
  updatePromptSelection,
  updatePromptStatus,
  getEffectiveReferenceImage,
} from '@/lib/stores/campaign-store'
import { produceContent, ProductionResult } from '@/lib/agents-v2'
import type { ReferenceImage } from '@/lib/types/campaign-types'

interface ProduceBody {
  promptIds: string[]
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<ProductionResult[]>>> {
  try {
    const { id } = await params
    const body: ProduceBody = await request.json()

    const state = getCampaignState(id)
    if (!state) {
      return NextResponse.json({ success: false, error: 'Campaña no encontrada' }, { status: 404 })
    }

    if (!body.promptIds || !Array.isArray(body.promptIds) || body.promptIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'promptIds debe ser un array no vacío' },
        { status: 400 }
      )
    }

    // Obtener SOLO los prompts indicados en el request (no todos los seleccionados)
    const promptsToProduceSet = new Set(body.promptIds)
    const selectedPrompts = state.prompts.filter(p => promptsToProduceSet.has(p.id))

    if (selectedPrompts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No se encontraron prompts para producir' },
        { status: 400 }
      )
    }

    // Actualizar la selección en el store para reflejar lo que se está produciendo
    body.promptIds.forEach((promptId) => {
      updatePromptSelection(id, promptId, true)
    })

    // Marcar como queued
    selectedPrompts.forEach((prompt) => {
      updatePromptStatus(id, prompt.id, 'queued')
    })

    console.log(`[API] Iniciando producción de ${selectedPrompts.length} prompts`)

    // Build reference image map for each prompt
    const referenceImageMap = new Map<string, ReferenceImage | null>()
    selectedPrompts.forEach((prompt) => {
      const refImage = getEffectiveReferenceImage(id, prompt.id)
      referenceImageMap.set(prompt.id, refImage)
      if (refImage) {
        console.log(`[API] Prompt ${prompt.id} tiene reference image: ${refImage.filename}`)
      }
    })

    // URL base para callbacks
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'
    const callbackBaseUrl = `${baseUrl}/api/v2/campaigns`

    // Producir contenido
    const results = await produceContent(selectedPrompts, callbackBaseUrl, referenceImageMap)

    // Actualizar estados según resultados
    results.forEach((result) => {
      if (result.success && result.taskId) {
        updatePromptStatus(id, result.promptId, 'generating', result.taskId)
      } else {
        updatePromptStatus(id, result.promptId, 'failed', undefined, undefined, result.error)
      }
    })

    const successful = results.filter((r) => r.success).length
    const failed = results.filter((r) => !r.success).length

    console.log(`[API] Producción iniciada: ${successful} exitosos, ${failed} fallidos`)

    return NextResponse.json({
      success: true,
      data: results,
      message: `${successful} prompts enviados a producción, ${failed} fallidos`,
    })
  } catch (error) {
    console.error('[API] Error produciendo contenido:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error produciendo contenido',
      },
      { status: 500 }
    )
  }
}
