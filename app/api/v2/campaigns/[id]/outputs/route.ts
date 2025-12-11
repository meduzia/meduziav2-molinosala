/**
 * API v2 - Outputs / Contenido Generado
 *
 * GET /api/v2/campaigns/[id]/outputs - Obtener contenido generado
 * POST /api/v2/campaigns/[id]/outputs/check - Verificar estado de tareas pendientes
 * PATCH /api/v2/campaigns/[id]/outputs - Aprobar contenido para el cliente
 */

import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse, GeneratedContent, ContentPrompt } from '@/lib/types/campaign-types'
import {
  getCampaignState,
  getOutputs,
  updatePromptStatus,
  addOutput,
  approveMultipleOutputsForClient,
} from '@/lib/stores/campaign-store'
import { checkAllTasksStatus, createOutputFromTask } from '@/lib/agents-v2'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<
  NextResponse<
    ApiResponse<{
      outputs: GeneratedContent[]
      prompts: ContentPrompt[]
      stats: {
        total: number
        completed: number
        generating: number
        failed: number
      }
    }>
  >
> {
  try {
    const { id } = await params
    const state = getCampaignState(id)

    if (!state) {
      return NextResponse.json({ success: false, error: 'Campaña no encontrada' }, { status: 404 })
    }

    const outputs = getOutputs(id)

    const stats = {
      total: state.prompts.length,
      completed: state.prompts.filter((p) => p.status === 'done').length,
      generating: state.prompts.filter((p) => p.status === 'generating').length,
      failed: state.prompts.filter((p) => p.status === 'failed').length,
    }

    return NextResponse.json({
      success: true,
      data: {
        outputs,
        prompts: state.prompts,
        stats,
      },
    })
  } catch (error) {
    console.error('[API] Error obteniendo outputs:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo outputs',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Aprobar contenido para el cliente
 * Body: { outputIds: string[], approved: boolean }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ approved: number }>>> {
  try {
    const { id } = await params
    const body = await request.json()
    const { outputIds, approved } = body

    if (!Array.isArray(outputIds) || outputIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Se requiere un array de outputIds' },
        { status: 400 }
      )
    }

    if (typeof approved !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'Se requiere el campo approved (boolean)' },
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

    const count = approveMultipleOutputsForClient(id, outputIds, approved)

    return NextResponse.json({
      success: true,
      data: { approved: count },
      message: approved
        ? `${count} contenido(s) aprobado(s) para el cliente`
        : `${count} contenido(s) removido(s) de aprobación`,
    })
  } catch (error) {
    console.error('[API] Error aprobando outputs:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error aprobando outputs',
      },
      { status: 500 }
    )
  }
}
