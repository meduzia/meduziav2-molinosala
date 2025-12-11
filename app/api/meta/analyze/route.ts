import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { analyzeMetaCampaigns } from '@/lib/meta-ads-analyzer'

interface CampaignData {
  id: string
  name: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  ctr: string
  cpc: string
  cpa: string
  roas: string
}

interface AnalysisRequest {
  days?: number
  campaignId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json().catch(() => ({}))
    const days = body.days || 7

    const supabase = createClient()

    // Obtener datos de campañas
    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - days)
    const dateFromStr = dateFrom.toISOString().split('T')[0]

    const { data: performanceData, error } = await supabase
      .from('ads_performance')
      .select('campaign_id, campaign_name, spend, impressions, clicks, conversions, revenue, cpc, ctr')
      .gte('date', dateFromStr)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Agregar datos por campaña
    const campaignsMap = new Map<string, any>()

    performanceData?.forEach((row) => {
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
    const campaigns: CampaignData[] = Array.from(campaignsMap.values()).map((c) => ({
      ...c,
      ctr: c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : '0',
      cpc: c.clicks > 0 ? (c.spend / c.clicks).toFixed(2) : '0',
      cpa: c.conversions > 0 ? (c.spend / c.conversions).toFixed(2) : '0',
      roas: c.spend > 0 ? (c.revenue / c.spend).toFixed(2) : '0',
    }))

    const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0)
    const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0)
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0)
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0)
    const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0)

    // Ejecutar análisis local experto
    const analysis = analyzeMetaCampaigns(campaigns)

    // Formatear análisis a markdown
    const analysisMarkdown = `
### 📊 **Resumen Ejecutivo**
${analysis.executiveSummary.map((item) => `- ${item}`).join('\n')}

### 🎯 **Estado Actual del Rendimiento**
${analysis.performanceStatus}

${analysis.trends.length > 0 ? `### 📈 **Análisis de Tendencias**
${analysis.trends.map((item) => `- ${item}`).join('\n')}` : ''}

${analysis.problemsDetected.length > 0 ? `### 🔴 **Problemas Detectados**
${analysis.problemsDetected.map((item) => `- ${item}`).join('\n')}` : ''}

### ✅ **Recomendaciones Accionables**
${analysis.recommendations.map((item) => `- ${item}`).join('\n')}

### 💡 **Ideas de Nuevos Creativos**
${analysis.creativeSuggestions.map((item) => `- ${item}`).join('\n')}

### ⚡ **Checklist de Optimización Instantánea**
${analysis.actionChecklist.map((item) => `- ${item}`).join('\n')}

---
*Análisis generado por Meta Ads Expert System. Valida siempre con datos en tiempo real.*
`

    return NextResponse.json({
      success: true,
      period: `Last ${days} days`,
      dateFrom: dateFromStr,
      dateTo: new Date().toISOString().split('T')[0],
      totalCampaigns: campaigns.length,
      summary: {
        totalSpend,
        totalImpressions,
        totalClicks,
        totalConversions,
        totalRevenue,
        roas: totalRevenue / totalSpend,
      },
      campaigns,
      analysis: analysisMarkdown,
    })
  } catch (error) {
    console.error('Error in Meta Ads analysis:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
