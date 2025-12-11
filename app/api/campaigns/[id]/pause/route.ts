/**
 * POST /api/campaigns/[id]/pause
 *
 * Pausa una campaña en progreso para detener gastos
 * Las campañas pausadas no generan más contenido
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateCampaignStatus } from '@/lib/campaigns-db'
import { setCampaignState } from '@/lib/campaign-state-cache'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID requerido' },
        { status: 400 }
      )
    }

    // Get campaign from cache
    const campaignCache = (global as any).__campaignCache || {}
    const campaign = campaignCache[campaignId]

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaña no encontrada' },
        { status: 404 }
      )
    }

    if (campaign.status === 'paused') {
      return NextResponse.json(
        { error: 'Campaña ya está pausada' },
        { status: 400 }
      )
    }

    if (campaign.status === 'archived') {
      return NextResponse.json(
        { error: 'No se puede pausar una campaña archivada' },
        { status: 400 }
      )
    }

    const pausedAt = new Date().toISOString()

    // Update cache
    setCampaignState(campaignId, {
      id: campaignId,
      status: 'paused',
      flows: campaign.flows,
      input: campaign.input,
      research: campaign.research,
      angles: campaign.angles,
      prompts: campaign.prompts,
      image_prompts: campaign.image_prompts,
    })

    // Try to update DB
    try {
      await updateCampaignStatus(campaignId, 'paused')
    } catch (dbError) {
      console.warn('Could not update DB, but cache updated:', dbError)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Campaña pausada exitosamente',
        campaign: {
          id: campaignId,
          status: 'paused',
          pausedAt,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error pausing campaign:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al pausar campaña',
      },
      { status: 500 }
    )
  }
}
