/**
 * POST /api/campaigns/[id]/recover
 *
 * Recupera una campaña archivada (soft deleted)
 * Solo funciona con eliminaciones suaves, no permanentes
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

    if (campaign.status !== 'archived') {
      return NextResponse.json(
        { error: `Campaña no está archivada (estado: ${campaign.status})` },
        { status: 400 }
      )
    }

    // Determine recovery status based on previous status
    const recoveryStatus = campaign.previousStatus || 'completed'
    const recoveredAt = new Date().toISOString()

    // Update cache
    const updatedCampaign = { ...campaign }
    delete updatedCampaign.deletedAt
    delete updatedCampaign.previousStatus

    setCampaignState(campaignId, {
      id: campaignId,
      status: recoveryStatus as any,
      flows: campaign.flows,
      input: campaign.input,
      research: campaign.research,
      angles: campaign.angles,
      prompts: campaign.prompts,
      image_prompts: campaign.image_prompts,
    })

    // Try to update DB
    try {
      await updateCampaignStatus(campaignId, recoveryStatus as any)
    } catch (dbError) {
      console.warn('Could not update DB, but cache updated:', dbError)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Campaña recuperada exitosamente',
        campaign: {
          id: campaignId,
          status: recoveryStatus,
          recoveredAt,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error recovering campaign:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al recuperar campaña',
      },
      { status: 500 }
    )
  }
}
