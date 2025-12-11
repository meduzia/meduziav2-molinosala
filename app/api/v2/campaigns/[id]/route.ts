/**
 * API v2 - Campaña Individual
 *
 * GET /api/v2/campaigns/[id] - Obtener campaña
 * DELETE /api/v2/campaigns/[id] - Eliminar campaña
 */

import { NextRequest, NextResponse } from 'next/server'
import type { CampaignState, ApiResponse } from '@/lib/types/campaign-types'
import { getCampaignStateAsync, deleteCampaign } from '@/lib/stores/campaign-store'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<CampaignState>>> {
  try {
    const { id } = await params
    // Cargar desde memoria o DB si no está en memoria
    const state = await getCampaignStateAsync(id)

    if (!state) {
      return NextResponse.json({ success: false, error: 'Campaña no encontrada' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: state,
    })
  } catch (error) {
    console.error('[API] Error obteniendo campaña:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { id } = await params
    const deleted = deleteCampaign(id)

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Campaña no encontrada' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Campaña eliminada',
    })
  } catch (error) {
    console.error('[API] Error eliminando campaña:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}
