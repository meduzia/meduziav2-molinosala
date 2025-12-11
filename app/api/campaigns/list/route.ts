/**
 * GET /api/campaigns/list
 *
 * List all campaigns for the authenticated user
 * Supports pagination with limit and offset
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { listCampaigns, countCampaigns } from '@/lib/campaigns-db'

export async function GET(request: NextRequest) {
  try {
    // Get auth user (optional for demo mode)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Use test user ID if not authenticated (for development/testing)
    const userId = user?.id || 'test-user-demo'

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Fetch campaigns and count with error handling
    let campaigns = []
    let total = 0

    try {
      campaigns = await listCampaigns(userId, limit, offset)
    } catch (dbError) {
      console.warn('Could not fetch campaigns from DB, returning empty array:', dbError)
      campaigns = []
    }

    try {
      total = await countCampaigns(userId)
    } catch (dbError) {
      console.warn('Could not count campaigns from DB:', dbError)
      total = campaigns.length
    }

    // Also check in-memory cache for campaigns created in this session
    // This bridges the gap until database is properly synced
    const campaignCache = (global as any).__campaignCache || {}
    const cachedCampaigns = Object.values(campaignCache)
      .map((campaign: any) => ({
        id: campaign.id,
        brief_text: campaign.input?.brief_text || 'Sin descripción',
        status: campaign.status,
        createdAt: new Date(campaign.updatedAt).toISOString(),
        updatedAt: new Date(campaign.updatedAt).toISOString(),
        type: campaign.input?.type || 'producto',
        summary: {
          research: campaign.research
            ? {
                painPoints: campaign.research.pain_points?.length || 0,
                benefits: campaign.research.benefits?.length || 0,
              }
            : undefined,
          angles: campaign.angles
            ? {
                total: campaign.angles.creative_angles?.length || 0,
              }
            : undefined,
          prompts: campaign.prompts
            ? {
                total: campaign.prompts.length || 0,
              }
            : undefined,
        },
      }))

    // Merge DB campaigns and cached campaigns, removing duplicates
    const campaignMap = new Map()

    campaigns.forEach((c) => {
      campaignMap.set(c.id, c)
    })

    cachedCampaigns.forEach((c) => {
      if (!campaignMap.has(c.id)) {
        campaignMap.set(c.id, c)
      }
    })

    const allCampaigns = Array.from(campaignMap.values()).slice(offset, offset + limit)
    const allTotal = campaignMap.size

    return NextResponse.json(
      {
        success: true,
        campaigns: allCampaigns,
        pagination: {
          total: allTotal,
          limit,
          offset,
          pages: Math.ceil(allTotal / limit) || 0,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error listing campaigns:', error)

    // Return success with empty array as fallback
    return NextResponse.json(
      {
        success: true,
        campaigns: [],
        pagination: {
          total: 0,
          limit: 20,
          offset: 0,
          pages: 0,
        },
      },
      { status: 200 }
    )
  }
}
