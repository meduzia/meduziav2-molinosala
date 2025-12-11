/**
 * API v2 - Client Feedback
 *
 * POST /api/v2/campaigns/[id]/feedback - Actualizar feedback del cliente (like/dislike)
 */

import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse } from '@/lib/types/campaign-types'
import {
  getCampaignStateAsync,
  updateClientFeedbackAsync,
  updateMultipleClientFeedbackAsync,
} from '@/lib/stores/campaign-store'

interface FeedbackUpdate {
  outputId: string
  feedback: 'approved' | 'rejected' | 'pending'
  comment?: string
}

/**
 * POST - Actualizar feedback del cliente
 * Body: { outputId, feedback, comment } o { updates: [{ outputId, feedback, comment }] }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ updated: number }>>> {
  try {
    const { id } = await params
    const body = await request.json()

    // Usar versión async que carga de DB si no está en memoria
    const state = await getCampaignStateAsync(id)
    if (!state) {
      return NextResponse.json(
        { success: false, error: 'Campaña no encontrada' },
        { status: 404 }
      )
    }

    // Check if it's a single update or batch update
    if (body.updates && Array.isArray(body.updates)) {
      // Batch update
      const updates: FeedbackUpdate[] = body.updates

      // Validate updates
      for (const update of updates) {
        if (!update.outputId || !['approved', 'rejected', 'pending'].includes(update.feedback)) {
          return NextResponse.json(
            { success: false, error: 'Formato de updates inválido' },
            { status: 400 }
          )
        }
      }

      const count = await updateMultipleClientFeedbackAsync(id, updates)

      return NextResponse.json({
        success: true,
        data: { updated: count },
        message: `${count} feedback(s) actualizado(s)`,
      })
    } else {
      // Single update
      const { outputId, feedback, comment } = body

      if (!outputId) {
        return NextResponse.json(
          { success: false, error: 'Se requiere outputId' },
          { status: 400 }
        )
      }

      if (!['approved', 'rejected', 'pending'].includes(feedback)) {
        return NextResponse.json(
          { success: false, error: 'Feedback debe ser: approved, rejected o pending' },
          { status: 400 }
        )
      }

      const success = await updateClientFeedbackAsync(id, outputId, feedback, comment)

      if (!success) {
        return NextResponse.json(
          { success: false, error: 'Output no encontrado' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: { updated: 1 },
        message: `Feedback actualizado a "${feedback}"`,
      })
    }
  } catch (error) {
    console.error('[API] Error actualizando feedback:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error actualizando feedback',
      },
      { status: 500 }
    )
  }
}
