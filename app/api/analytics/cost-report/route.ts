/**
 * GET /api/analytics/cost-report
 *
 * Genera un reporte de costos basado en las campañas creadas
 * Incluye: costo total, promedio, por opciones, proyecciones
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { calculateCampaignCost, getCostSummary } from '@/lib/cost-calculator'

export async function GET(request: NextRequest) {
  try {
    // Get auth user
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const userId = user?.id || 'test-user-demo'

    // Get all campaigns from cache (global state)
    const campaignCache = (global as any).__campaignCache || {}
    const userCampaigns = Object.values(campaignCache).filter((campaign: any) => campaign.id) // All campaigns in demo mode

    // Calculate statistics
    let totalCost = 0
    const costsByAgent: Record<string, number[]> = {
      research: [],
      angles: [],
      scriptwriting: [],
      imageGeneration: [],
      variations: [],
    }

    // For each campaign, estimate its cost
    for (const campaign of userCampaigns) {
      const executeOptions = {
        executeResearch: true,
        executeAngles: true,
        executeScriptwriting: campaign.prompts ? true : false,
        executeImageGeneration: campaign.image_prompts ? true : false,
        executeVariations: false,
      }

      const costBreakdown = calculateCampaignCost(executeOptions)
      const costSummary = getCostSummary(costBreakdown)

      totalCost += costSummary.summary.totalCost

      // Track individual agent costs
      if (costSummary.agents.research > 0) costsByAgent.research.push(costSummary.agents.research)
      if (costSummary.agents.angles > 0) costsByAgent.angles.push(costSummary.agents.angles)
      if (costSummary.agents.scriptwriting > 0)
        costsByAgent.scriptwriting.push(costSummary.agents.scriptwriting)
      if (costSummary.agents.imageGeneration > 0)
        costsByAgent.imageGeneration.push(costSummary.agents.imageGeneration)
      if (costSummary.agents.variations > 0) costsByAgent.variations.push(costSummary.agents.variations)
    }

    // Calculate averages
    const campaignCount = userCampaigns.length
    const averageCostPerCampaign = campaignCount > 0 ? totalCost / campaignCount : 0

    // Generate projections
    const projections = {
      per_10_campaigns: (averageCostPerCampaign * 10).toFixed(4),
      per_100_campaigns: (averageCostPerCampaign * 100).toFixed(4),
      per_1000_campaigns: (averageCostPerCampaign * 1000).toFixed(4),
      monthly_estimate_100: (averageCostPerCampaign * 100).toFixed(4), // Assuming ~100 campaigns/month
      monthly_estimate_500: (averageCostPerCampaign * 500).toFixed(4),
      monthly_estimate_1000: (averageCostPerCampaign * 1000).toFixed(4),
    }

    return NextResponse.json(
      {
        success: true,
        report: {
          period: 'all_time',
          summary: {
            totalCampaigns: campaignCount,
            totalCost: parseFloat(totalCost.toFixed(4)),
            averageCostPerCampaign: parseFloat(averageCostPerCampaign.toFixed(4)),
          },
          agentBreakdown: {
            research: {
              count: costsByAgent.research.length,
              totalCost: parseFloat(
                costsByAgent.research.reduce((a, b) => a + b, 0).toFixed(4)
              ),
              averageCost: parseFloat(
                (
                  costsByAgent.research.reduce((a, b) => a + b, 0) / (costsByAgent.research.length || 1)
                ).toFixed(4)
              ),
            },
            angles: {
              count: costsByAgent.angles.length,
              totalCost: parseFloat(
                costsByAgent.angles.reduce((a, b) => a + b, 0).toFixed(4)
              ),
              averageCost: parseFloat(
                (
                  costsByAgent.angles.reduce((a, b) => a + b, 0) / (costsByAgent.angles.length || 1)
                ).toFixed(4)
              ),
            },
            scriptwriting: {
              count: costsByAgent.scriptwriting.length,
              totalCost: parseFloat(
                costsByAgent.scriptwriting.reduce((a, b) => a + b, 0).toFixed(4)
              ),
              averageCost: parseFloat(
                (
                  costsByAgent.scriptwriting.reduce((a, b) => a + b, 0) /
                  (costsByAgent.scriptwriting.length || 1)
                ).toFixed(4)
              ),
            },
            imageGeneration: {
              count: costsByAgent.imageGeneration.length,
              totalCost: parseFloat(
                costsByAgent.imageGeneration.reduce((a, b) => a + b, 0).toFixed(4)
              ),
              averageCost: parseFloat(
                (
                  costsByAgent.imageGeneration.reduce((a, b) => a + b, 0) /
                  (costsByAgent.imageGeneration.length || 1)
                ).toFixed(4)
              ),
            },
            variations: {
              count: costsByAgent.variations.length,
              totalCost: parseFloat(
                costsByAgent.variations.reduce((a, b) => a + b, 0).toFixed(4)
              ),
              averageCost: parseFloat(
                (
                  costsByAgent.variations.reduce((a, b) => a + b, 0) / (costsByAgent.variations.length || 1)
                ).toFixed(4)
              ),
            },
          },
          projections,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error generating cost report:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al generar reporte de costos',
      },
      { status: 500 }
    )
  }
}
