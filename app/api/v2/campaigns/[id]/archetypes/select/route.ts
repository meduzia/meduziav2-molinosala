/**
 * API v2 - Seleccionar Arquetipos
 *
 * POST /api/v2/campaigns/[id]/archetypes/select
 *
 * Actualiza qué arquetipos están seleccionados para avanzar
 */

import { NextRequest, NextResponse } from 'next/server'
import type { ApiResponse, Archetype } from '@/lib/types/campaign-types'
import { getCampaignState, updateArchetypeSelection, getSelectedArchetypes } from '@/lib/stores/campaign-store'

interface SelectArchetypesBody {
  selectedIds: string[]
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<Archetype[]>>> {
  try {
    const { id } = await params
    const body: SelectArchetypesBody = await request.json()

    const state = getCampaignState(id)
    if (!state) {
      return NextResponse.json({ success: false, error: 'Campaña no encontrada' }, { status: 404 })
    }

    if (!body.selectedIds || !Array.isArray(body.selectedIds)) {
      return NextResponse.json(
        { success: false, error: 'selectedIds debe ser un array' },
        { status: 400 }
      )
    }

    // Primero deseleccionar todos
    state.archetypes.forEach((arch) => {
      updateArchetypeSelection(id, arch.id, false)
    })

    // Seleccionar los indicados
    body.selectedIds.forEach((archId) => {
      updateArchetypeSelection(id, archId, true)
    })

    const selected = getSelectedArchetypes(id)

    console.log(`[API] Arquetipos seleccionados: ${selected.length}`)

    return NextResponse.json({
      success: true,
      data: selected,
      message: `${selected.length} arquetipos seleccionados`,
    })
  } catch (error) {
    console.error('[API] Error seleccionando arquetipos:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error seleccionando arquetipos',
      },
      { status: 500 }
    )
  }
}
