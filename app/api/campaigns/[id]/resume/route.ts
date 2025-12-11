/**
 * POST /api/campaigns/[id]/resume
 *
 * Reanuda una campaña pausada
 * Permite continuar generando contenido
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

    if (campaign.status !== 'paused') {
      return NextResponse.json(
        { error: `Campaña no está pausada (estado: ${campaign.status})` },
        { status: 400 }
      )
    }

    const resumedAt = new Date().toISOString()

    // Update cache to in_progress
    setCampaignState(campaignId, {
      id: campaignId,
      status: 'in_progress',
      flows: campaign.flows,
      input: campaign.input,
      research: campaign.research,
      angles: campaign.angles,
      prompts: campaign.prompts,
      image_prompts: campaign.image_prompts,
    })

    // Try to update DB
    try {
      await updateCampaignStatus(campaignId, 'in_progress')
    } catch (dbError) {
      console.warn('Could not update DB, but cache updated:', dbError)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Campaña reanudada exitosamente',
        campaign: {
          id: campaignId,
          status: 'in_progress',
          resumedAt,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error resuming campaign:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al reanudar campaña',
      },
      { status: 500 }
    )
  }
}
