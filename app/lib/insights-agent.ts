/**
 * Insights Agent - Genera insights de datos de Meta Ads
 */

import { createClient } from './supabase'

interface AdsPerformanceData {
  date: string
  campaign_id: string
  campaign_name: string
  ad_set_id: string
  ad_set_name: string
  ad_id: string
  ad_name: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  ctr: number
  cpc: number
  cpm: number
  cpa: number
  roas: number
  platform: string
}

interface InsightOutput {
  type: string
  title: string
  summary: string
  data: any
  recommendations: string[]
}

export async function generateInsights(
  dateFrom: string,
  dateTo: string
): Promise<InsightOutput[]> {
  const supabase = createClient()

  const { data: adsData, error } = await supabase
    .from('ads_performance')
    .select('*')
    .gte('date', dateFrom)
    .lte('date', dateTo)
    .order('date', { ascending: false })

  if (error || !adsData || adsData.length === 0) {
    console.error('Error fetching ads data:', error)
    return []
  }

  const insights: InsightOutput[] = []

  // 1. Top creativos ganadores
  const adMetrics = aggregateByAd(adsData as AdsPerformanceData[])
  const topAds = adMetrics.sort((a, b) => b.avg_roas - a.avg_roas).slice(0, 5)

  insights.push({
    type: 'creative_winners',
    title: 'Top 5 Creativos Ganadores',
    summary: `Los mejores creativos por ROAS en el período ${dateFrom} a ${dateTo}`,
    data: topAds.map(ad => ({
      name: ad.ad_name,
      campaign: ad.campaign_name,
      roas: ad.avg_roas.toFixed(2),
      spend: `$${ad.total_spend.toFixed(2)}`,
      conversions: ad.total_conversions,
      cpa: `$${ad.avg_cpa.toFixed(2)}`,
    })),
    recommendations: [
      'Escalar presupuesto en los top 3',
      'Duplicar creativos ganadores en otras campañas',
      'Analizar elementos comunes (copy, visuals, CTA)',
    ],
  })

  // 2. Análisis de campañas
  const campaignMetrics = aggregateByCampaign(adsData as AdsPerformanceData[])
  const campaignsByROAS = campaignMetrics.sort((a, b) => b.avg_roas - a.avg_roas)

  insights.push({
    type: 'budget_optimization',
    title: 'Performance por Campaña',
    summary: 'Cómo se distribuye tu presupuesto y cuál rinde más',
    data: campaignsByROAS.map(c => ({
      name: c.campaign_name,
      spend: `$${c.total_spend.toFixed(2)}`,
      roas: c.avg_roas.toFixed(2),
      conversions: c.total_conversions,
      ads_count: c.ad_count,
    })),
    recommendations: campaignsByROAS.slice(0, 1).map(c => `Aumentar presupuesto en ${c.campaign_name} (ROAS: ${c.avg_roas.toFixed(2)}x)`),
  })

  // 3. Creativos que deberían pausarse
  const worstAds = adMetrics.sort((a, b) => a.avg_roas - b.avg_roas).slice(0, 3)
  const lowPerformers = worstAds.filter(ad => ad.total_spend > 50) // Solo si tienen gasto significativo

  if (lowPerformers.length > 0) {
    insights.push({
      type: 'alerts',
      title: 'Creativos con Bajo Desempeño',
      summary: 'Anuncios que deberían revisarse o pausarse',
      data: lowPerformers.map(ad => ({
        name: ad.ad_name,
        roas: ad.avg_roas.toFixed(2),
        spend: `$${ad.total_spend.toFixed(2)}`,
        cpa: `$${ad.avg_cpa.toFixed(2)}`,
      })),
      recommendations: [
        'Pausar creativos con ROAS < 1.0',
        'Revisar copy y visuals',
        'Probar con otra audiencia antes de matar',
      ],
    })
  }

  // 4. Resumen general de KPIs
  const totalData = calculateTotals(adsData as AdsPerformanceData[])

  insights.push({
    type: 'summary',
    title: 'Resumen General de KPIs',
    summary: 'Métricas consolidadas del período',
    data: {
      total_spend: `$${totalData.total_spend.toFixed(2)}`,
      total_revenue: `$${totalData.total_revenue.toFixed(2)}`,
      total_conversions: totalData.total_conversions,
      avg_roas: totalData.avg_roas.toFixed(2),
      avg_cpa: `$${totalData.avg_cpa.toFixed(2)}`,
      avg_ctr: totalData.avg_ctr.toFixed(3),
      avg_cpm: `$${totalData.avg_cpm.toFixed(2)}`,
      total_impressions: totalData.total_impressions,
      total_clicks: totalData.total_clicks,
    },
    recommendations: [
      `Objetivo: alcanzar ROAS ${(totalData.avg_roas * 1.15).toFixed(2)}x en próximos 30 días`,
      `Reducir CPA a $${(totalData.avg_cpa * 0.9).toFixed(2)}`,
    ],
  })

  return insights
}

function aggregateByAd(data: AdsPerformanceData[]) {
  const byAd: { [key: string]: AdsPerformanceData[] } = {}

  for (const row of data) {
    if (!byAd[row.ad_id]) byAd[row.ad_id] = []
    byAd[row.ad_id].push(row)
  }

  return Object.entries(byAd).map(([adId, rows]) => ({
    ad_id: adId,
    ad_name: rows[0].ad_name,
    campaign_name: rows[0].campaign_name,
    total_spend: rows.reduce((sum, r) => sum + r.spend, 0),
    total_conversions: rows.reduce((sum, r) => sum + r.conversions, 0),
    total_revenue: rows.reduce((sum, r) => sum + r.revenue, 0),
    avg_ctr: rows.reduce((sum, r) => sum + r.ctr, 0) / rows.length,
    avg_cpc: rows.reduce((sum, r) => sum + r.cpc, 0) / rows.length,
    avg_cpm: rows.reduce((sum, r) => sum + r.cpm, 0) / rows.length,
    avg_cpa: rows.reduce((sum, r) => sum + r.cpa, 0) / rows.length,
    avg_roas: rows.reduce((sum, r) => sum + r.roas, 0) / rows.length,
  }))
}

function aggregateByCampaign(data: AdsPerformanceData[]) {
  const byCampaign: { [key: string]: AdsPerformanceData[] } = {}

  for (const row of data) {
    if (!byCampaign[row.campaign_id]) byCampaign[row.campaign_id] = []
    byCampaign[row.campaign_id].push(row)
  }

  return Object.entries(byCampaign).map(([campaignId, rows]) => ({
    campaign_id: campaignId,
    campaign_name: rows[0].campaign_name,
    total_spend: rows.reduce((sum, r) => sum + r.spend, 0),
    total_conversions: rows.reduce((sum, r) => sum + r.conversions, 0),
    total_revenue: rows.reduce((sum, r) => sum + r.revenue, 0),
    avg_roas: rows.reduce((sum, r) => sum + r.roas, 0) / rows.length,
    avg_cpa: rows.reduce((sum, r) => sum + r.cpa, 0) / rows.length,
    ad_count: [...new Set(rows.map(r => r.ad_id))].length,
  }))
}

function calculateTotals(data: AdsPerformanceData[]) {
  return {
    total_spend: data.reduce((sum, r) => sum + r.spend, 0),
    total_revenue: data.reduce((sum, r) => sum + r.revenue, 0),
    total_conversions: data.reduce((sum, r) => sum + r.conversions, 0),
    total_impressions: data.reduce((sum, r) => sum + r.impressions, 0),
    total_clicks: data.reduce((sum, r) => sum + r.clicks, 0),
    avg_roas: data.reduce((sum, r) => sum + r.roas, 0) / data.length,
    avg_cpa: data.reduce((sum, r) => sum + r.cpa, 0) / data.length,
    avg_ctr: data.reduce((sum, r) => sum + r.ctr, 0) / data.length,
    avg_cpm: data.reduce((sum, r) => sum + r.cpm, 0) / data.length,
  }
}
