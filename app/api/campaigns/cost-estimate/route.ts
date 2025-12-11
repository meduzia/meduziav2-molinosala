/**
 * GET /api/campaigns/cost-estimate
 *
 * Calcula el costo estimado de una campaña basado en las opciones de ejecución
 *
 * Query params:
 * - research: boolean (default: true)
 * - angles: boolean (default: true)
 * - scriptwriting: boolean (default: false)
 * - imageGeneration: boolean (default: true)
 * - variations: boolean (default: false)
 */

import { NextRequest, NextResponse } from 'next/server'
import { calculateCampaignCost, formatCostBreakdown, getCostSummary } from '@/lib/cost-calculator'

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url)

    const executeOptions = {
      executeResearch: searchParams.get('research') !== 'false',
      executeAngles: searchParams.get('angles') !== 'false',
      executeScriptwriting: searchParams.get('scriptwriting') === 'true',
      executeImageGeneration: searchParams.get('imageGeneration') !== 'false',
      executeVariations: searchParams.get('variations') === 'true',
    }

    // Calculate cost breakdown
    const costBreakdown = calculateCampaignCost(executeOptions)
    const costSummary = getCostSummary(costBreakdown)
    const formattedBreakdown = formatCostBreakdown(costBreakdown)

    return NextResponse.json(
      {
        success: true,
        estimatedCost: costSummary,
        breakdown: costBreakdown,
        formatted: formattedBreakdown,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error calculating campaign cost:', error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Error al calcular costo',
      },
      { status: 500 }
    )
  }
}
