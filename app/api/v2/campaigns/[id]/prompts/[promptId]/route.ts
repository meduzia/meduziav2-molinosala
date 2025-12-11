/**
 * API v2 - Actualizar Prompt Individual
 *
 * PATCH /api/v2/campaigns/[id]/prompts/[promptId]
 *
 * Actualiza el texto de un prompt específico
 */

import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/lib/types/campaign-types'
import { getCampaignState, updatePromptText } from '@/lib/stores/campaign-store'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; promptId: string }> }
): Promise<NextResponse<ApiResponse<{ success: boolean }>>> {
  try {
    const { id, promptId } = await params
    const body = await request.json()
    const { text } = body

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { success: false, error: 'El texto del prompt es requerido' },
        { status: 400 }
      )
    }

    const state = getCampaignState(id)
    if (!state) {
      return NextResponse.json(
        { success: false, error: 'Campaña no encontrada' },
        { status: 404 }
      )
    }

    const prompt = state.prompts.find((p) => p.id === promptId)
    if (!prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt no encontrado' },
        { status: 404 }
      )
    }

    // Solo permitir editar prompts en estado draft
    if (prompt.status !== 'draft') {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden editar prompts en estado borrador' },
        { status: 400 }
      )
    }

    const updated = updatePromptText(id, promptId, text)

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Error al actualizar el prompt' },
        { status: 500 }
      )
    }

    console.log(`[API] Prompt ${promptId} actualizado en campaña ${id}`)

    return NextResponse.json({
      success: true,
      data: { success: true },
    })
  } catch (error) {
    console.error('[API] Error actualizando prompt:', error)
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
