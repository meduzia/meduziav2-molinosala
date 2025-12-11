import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')

    const supabase = createClient()

    // Calcular fecha desde
    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - days)
    const dateFromStr = dateFrom.toISOString().split('T')[0]

    // Obtener datos agrupados por campaña
    const { data, error } = await supabase
      .from('ads_performance')
      .select('campaign_id, campaign_name, spend, impressions, clicks, conversions, revenue, cpc, ctr')
      .gte('date', dateFromStr)
      .order('campaign_name')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Agrupar por campaña
    const campaignsMap = new Map<string, any>()

    data?.forEach((row) => {
      if (!campaignsMap.has(row.campaign_id)) {
        campaignsMap.set(row.campaign_id, {
          id: row.campaign_id,
          name: row.campaign_name,
          spend: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          revenue: 0,
          days: 0,
        })
      }

      const campaign = campaignsMap.get(row.campaign_id)!
      campaign.spend += parseFloat(row.spend || '0')
      campaign.impressions += parseInt(row.impressions || '0')
      campaign.clicks += parseInt(row.clicks || '0')
      campaign.conversions += parseFloat(row.conversions || '0')
      campaign.revenue += parseFloat(row.revenue || '0')
    })

    // Calcular métricas
    const campaigns = Array.from(campaignsMap.values()).map((c) => ({
      ...c,
      ctr: c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : '0',
      cpc: c.clicks > 0 ? (c.spend / c.clicks).toFixed(2) : '0',
      cpa: c.conversions > 0 ? (c.spend / c.conversions).toFixed(2) : '0',
      roas: c.spend > 0 ? (c.revenue / c.spend).toFixed(2) : '0',
    }))

    return NextResponse.json({
      period: `Last ${days} days`,
      dateFrom: dateFromStr,
      dateTo: new Date().toISOString().split('T')[0],
      totalCampaigns: campaigns.length,
      campaigns: campaigns.sort((a, b) => b.spend - a.spend),
    })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
