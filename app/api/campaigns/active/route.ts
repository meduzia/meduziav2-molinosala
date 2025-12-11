/**
 * GET /api/campaigns/active
 *
 * List all in-progress campaigns for the authenticated user
 * Shows campaigns currently being executed by agents
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { getActiveCampaigns } from '@/lib/campaigns-db'

export async function GET(request: NextRequest) {
  try {
    // Get auth user (optional for demo mode)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Use test user ID if not authenticated (for development/testing)
    const userId = user?.id || 'test-user-demo'

    // Fetch active campaigns from database
    const dbCampaigns = await getActiveCampaigns(userId)

    // Also check in-memory cache for campaigns created in this session
    // This bridges the gap until database is properly synced
    const campaignCache = (global as any).__campaignCache || {}
    const cachedCampaigns = Object.values(campaignCache)
      .filter((campaign: any) => campaign.status === 'in_progress' || campaign.status === 'paused')
      .map((campaign: any) => ({
        id: campaign.id,
        brief_text: campaign.input?.brief_text || 'Sin descripción',
        status: campaign.status,
        createdAt: new Date(campaign.updatedAt).toISOString(),
        updatedAt: new Date(campaign.updatedAt).toISOString(),
        type: campaign.input?.type || 'producto',
      }))

    // Merge DB campaigns and cached campaigns, removing duplicates
    const campaignMap = new Map()

    dbCampaigns.forEach((c) => {
      campaignMap.set(c.id, c)
    })

    cachedCampaigns.forEach((c) => {
      if (!campaignMap.has(c.id)) {
        campaignMap.set(c.id, c)
      }
    })

    const activeCampaigns = Array.from(campaignMap.values())

    return NextResponse.json(
      {
        success: true,
        campaigns: activeCampaigns,
        count: activeCampaigns.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error listing active campaigns:', error)

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Error al listar campañas activas',
      },
      { status: 500 }
    )
  }
}
