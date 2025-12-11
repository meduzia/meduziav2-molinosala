/**
 * POST /api/insights/analyze
 *
 * Genera insights completos de datos de Meta usando AI
 *
 * Query params:
 * - from: fecha inicio (YYYY-MM-DD)
 * - to: fecha fin (YYYY-MM-DD)
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateInsights } from '@/lib/insights-agent'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    let dateFrom = searchParams.get('from')
    let dateTo = searchParams.get('to')

    // Valores por defecto: últimos 7 días
    if (!dateFrom || !dateTo) {
      const today = new Date()
      dateTo = today.toISOString().split('T')[0]
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
      dateFrom = sevenDaysAgo.toISOString().split('T')[0]
    }

    console.log(`[Insights] Analyzing data from ${dateFrom} to ${dateTo}`)

    // Generar insights
    const insights = await generateInsights(dateFrom, dateTo)

    if (!insights || insights.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'No data available for the selected period',
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        message: `Generated ${insights.length} insights`,
        dateRange: { from: dateFrom, to: dateTo },
        insights,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[Insights] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json(
    {
      status: 'Insights API is running',
      endpoint: 'POST /api/insights/analyze?from=YYYY-MM-DD&to=YYYY-MM-DD',
      description: 'Generate AI insights from Meta Ads data',
    },
    { status: 200 }
  )
}
