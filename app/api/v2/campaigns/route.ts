/**
 * API v2 - Campañas
 *
 * POST /api/v2/campaigns - Crear nueva campaña
 * GET /api/v2/campaigns - Listar campañas
 */

import { NextRequest, NextResponse } from 'next/server'
import type { Campaign, CreateCampaignInput, ApiResponse, ReferenceImage } from '@/lib/types/campaign-types'
import { createCampaign, listCampaignsAsync, getCampaignStats } from '@/lib/stores/campaign-store'

// Extended campaign type with output count for listing
interface CampaignWithOutputs extends Campaign {
  outputsCount?: number
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Campaign>>> {
  try {
    const body: CreateCampaignInput & { referenceImages?: ReferenceImage[] } = await request.json()

    // Validación básica
    if (!body.name?.trim()) {
      return NextResponse.json({ success: false, error: 'El nombre es requerido' }, { status: 400 })
    }

    if (!body.brief?.trim()) {
      return NextResponse.json({ success: false, error: 'El brief es requerido' }, { status: 400 })
    }

    // Crear campaña
    const now = new Date().toISOString()
    const campaignId = `campaign_${Date.now()}`

    // Update reference images with correct campaignId
    const referenceImages: ReferenceImage[] = (body.referenceImages || []).map(img => ({
      ...img,
      campaignId,
    }))

    const campaign: Campaign = {
      id: campaignId,
      name: body.name.trim(),
      description: '',
      brief: body.brief.trim(),
      coreMessage: body.coreMessage?.trim() || '', // Mensaje principal para comunicar en imágenes
      objective: '',
      category: 'general',
      platforms: [],
      referenceImages,
      createdAt: now,
      updatedAt: now,
      status: 'draft',
    }

    const state = createCampaign(campaign, referenceImages)

    console.log(`[API] Campaña creada: ${campaign.id} - ${campaign.name} con ${referenceImages.length} imágenes de referencia`)

    return NextResponse.json({
      success: true,
      data: state.campaign,
      message: 'Campaña creada exitosamente',
    })
  } catch (error) {
    console.error('[API] Error creando campaña:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}

export async function GET(): Promise<NextResponse<ApiResponse<CampaignWithOutputs[]>>> {
  try {
    // Cargar campañas desde memoria + DB
    const campaigns = await listCampaignsAsync()

    // Add output counts to each campaign (only count approved for client)
    const campaignsWithOutputs: CampaignWithOutputs[] = campaigns.map((campaign: Campaign) => {
      const stats = getCampaignStats(campaign.id)
      return {
        ...campaign,
        // For Gallery listing, we use approvedForClientCount (content visible to client)
        outputsCount: stats?.approvedForClientCount || 0,
      }
    })

    return NextResponse.json({
      success: true,
      data: campaignsWithOutputs,
    })
  } catch (error) {
    console.error('[API] Error listando campañas:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error interno del servidor',
      },
      { status: 500 }
    )
  }
}
