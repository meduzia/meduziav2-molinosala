/**
 * API v2 - Verificar Estado de Producción
 *
 * POST /api/v2/campaigns/[id]/outputs/check
 *
 * Hace polling a las APIs externas para verificar estado de tareas
 */

import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse, GeneratedContent } from '@/lib/types/campaign-types'
import {
  getCampaignState,
  updatePromptStatus,
  addOutput,
} from '@/lib/stores/campaign-store'
import { checkAllTasksStatus, createOutputFromTask } from '@/lib/agents-v2'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<
  NextResponse<
    ApiResponse<{
      checked: number
      completed: number
      newOutputs: GeneratedContent[]
    }>
  >
> {
  try {
    const { id } = await params
    const state = getCampaignState(id)

    if (!state) {
      return NextResponse.json({ success: false, error: 'Campaña no encontrada' }, { status: 404 })
    }

    // Obtener prompts que están en proceso
    const generatingPrompts = state.prompts.filter(
      (p) => p.status === 'generating' && p.externalJobId
    )

    if (generatingPrompts.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          checked: 0,
          completed: 0,
          newOutputs: [],
        },
        message: 'No hay tareas en proceso',
      })
    }

    console.log(`[API] Verificando estado de ${generatingPrompts.length} tareas`)

    // Verificar estado de todas las tareas
    const statusMap = await checkAllTasksStatus(generatingPrompts)

    const newOutputs: GeneratedContent[] = []
    let completedCount = 0

    // Procesar resultados
    for (const prompt of generatingPrompts) {
      const status = statusMap.get(prompt.id)
      if (!status) continue

      if (status.status === 'success' && status.url) {
        // Tarea completada
        updatePromptStatus(id, prompt.id, 'done', undefined, status.url)

        // Crear output
        const output = createOutputFromTask(prompt, {
          taskId: prompt.externalJobId!,
          resultUrls: [status.url],
        })

        if (output) {
          addOutput(id, output)
          newOutputs.push(output)
        }

        completedCount++
        console.log(`[API] Prompt ${prompt.id} completado: ${status.url}`)
      } else if (status.status === 'fail') {
        // Tarea fallida
        updatePromptStatus(id, prompt.id, 'failed', undefined, undefined, status.error || 'Task failed')
        console.log(`[API] Prompt ${prompt.id} fallido`)
      }
      // Si está pending o running, no hacemos nada (sigue en generating)
    }

    console.log(`[API] Verificación completada: ${completedCount} nuevos outputs`)

    return NextResponse.json({
      success: true,
      data: {
        checked: generatingPrompts.length,
        completed: completedCount,
        newOutputs,
      },
      message: `${completedCount} tareas completadas de ${generatingPrompts.length} verificadas`,
    })
  } catch (error) {
    console.error('[API] Error verificando estado:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error verificando estado',
      },
      { status: 500 }
    )
  }
}
