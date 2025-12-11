/**
 * Meta Ads Expert Analyzer - Local Analysis Engine
 * Proporciona análisis profundo sin necesidad de API externa
 */

interface Campaign {
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

interface AnalysisSummary {
  executiveSummary: string[]
  performanceStatus: string
  trends: string[]
  problemsDetected: string[]
  recommendations: string[]
  creativeSuggestions: string[]
  actionChecklist: string[]
}

export function analyzeMetaCampaigns(campaigns: Campaign[]): AnalysisSummary {
  if (campaigns.length === 0) {
    return {
      executiveSummary: ['No campaign data available for analysis'],
      performanceStatus: 'No data',
      trends: [],
      problemsDetected: [],
      recommendations: [],
      creativeSuggestions: [],
      actionChecklist: [],
    }
  }

  // Calcular métricas agregadas
  const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0)
  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0)
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0)
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0)
  const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0)
  const avgRoas = totalRevenue / totalSpend

  // Ordenar campañas por ROAS
  const campaignsByRoas = [...campaigns].sort((a, b) => parseFloat(b.roas) - parseFloat(a.roas))
  const bestCampaign = campaignsByRoas[0]
  const worstCampaign = campaignsByRoas[campaignsByRoas.length - 1]

  // Campañas con conversiones vs sin conversiones
  const campaignsWithConversions = campaigns.filter((c) => c.conversions > 0)
  const campaignsWithoutConversions = campaigns.filter((c) => c.conversions === 0)

  // Análisis de CTR
  const avgCtr = (totalClicks / totalImpressions) * 100
  const highCtrCampaigns = campaigns.filter((c) => parseFloat(c.ctr) > avgCtr * 1.2)
  const lowCtrCampaigns = campaigns.filter((c) => parseFloat(c.ctr) < avgCtr * 0.8)

  // Análisis de CPC
  const avgCpc = totalSpend / totalClicks
  const efficientCpc = campaigns.filter((c) => parseFloat(c.cpc) < avgCpc * 0.9)
  const expensiveCpc = campaigns.filter((c) => parseFloat(c.cpc) > avgCpc * 1.2)

  // Análisis de CPA
  const campaignsWithCpa = campaignsWithConversions.map((c) => ({
    ...c,
    cpaParse: parseFloat(c.cpa),
  }))
  const avgCpa =
    campaignsWithCpa.length > 0
      ? campaignsWithCpa.reduce((sum, c) => sum + c.cpaParse, 0) / campaignsWithCpa.length
      : 0

  const efficientCpaCampaigns = campaignsWithCpa.filter((c) => c.cpaParse < avgCpa * 0.8)
  const expensiveCpaCampaigns = campaignsWithCpa.filter((c) => c.cpaParse > avgCpa * 1.3)

  // Problemas detectados
  const problems: string[] = []

  if (campaignsWithoutConversions.length > 0) {
    problems.push(
      `🔴 **Campañas sin conversiones**: ${campaignsWithoutConversions.length} de ${campaigns.length} campañas no generan conversiones. Revisa targeting, funnel y landing pages.`
    )
  }

  if (lowCtrCampaigns.length > 0) {
    const avgLowCtr = (
      lowCtrCampaigns.reduce((sum, c) => sum + parseFloat(c.ctr), 0) / lowCtrCampaigns.length
    ).toFixed(2)
    problems.push(
      `⚠️ **CTR bajo**: ${lowCtrCampaigns.length} campañas con CTR ${avgLowCtr}% (promedio: ${avgCtr.toFixed(2)}%). Posible fatiga creativa o mala segmentación.`
    )
  }

  if (avgRoas < 1.5) {
    problems.push(
      `⚠️ **ROAS débil**: Tu ROAS actual es ${avgRoas.toFixed(2)}x. Esto está por debajo del benchmark de 2-3x para e-commerce.`
    )
  }

  if (expensiveCpaCampaigns.length > 0) {
    problems.push(
      `💰 **CPA elevado**: ${expensiveCpaCampaigns.length} campañas tienen CPA alto. Considera pausar o reoptimizar.`
    )
  }

  // Recommendations
  const recommendations: string[] = []

  // Recomendación 1: Escalar campañas exitosas
  if (bestCampaign) {
    const bestRoas = parseFloat(bestCampaign.roas)
    if (bestRoas > 3) {
      recommendations.push(
        `📈 **ESCALAR**: La campaña "${bestCampaign.name}" tiene ROAS ${bestRoas.toFixed(2)}x. Aumenta presupuesto 20-30% y replica su estructura.`
      )
    }
  }

  // Recomendación 2: Pausar campañas débiles
  if (worstCampaign) {
    const worstRoas = parseFloat(worstCampaign.roas)
    if (worstRoas < 1 && worstCampaign.spend > totalSpend * 0.1) {
      recommendations.push(
        `⏸️ **PAUSAR o REOPTIMIZAR**: "${worstCampaign.name}" con ROAS ${worstRoas.toFixed(2)}x y gasto significativo. Considera pausar o cambiar creativos.`
      )
    }
  }

  // Recomendación 3: Duplicar creativos ganadores
  if (highCtrCampaigns.length > 0) {
    recommendations.push(
      `🎬 **DUPLICAR CREATIVOS**: Las campañas con alto CTR tienen fatiga baja. Crea variantes nuevas basadas en sus elementos ganadores.`
    )
  }

  // Recomendación 4: Testear nuevas audiencias
  if (avgRoas < 2) {
    recommendations.push(
      `🎯 **TESTEAR AUDIENCIAS**: Tu ROAS es bajo. Testea lookalike audiences basadas en conversores y excluye públicos saturados.`
    )
  }

  // Recomendación 5: Optimizar CPA
  if (expensiveCpaCampaigns.length > 0) {
    recommendations.push(
      `🔧 **OPTIMIZAR CPA**: Reduce CPC mediante ajuste de pujas, mejora segmentación o crea mejor landing page.`
    )
  }

  // Recomendación 6: Análisis creativo
  if (lowCtrCampaigns.length > 0) {
    recommendations.push(
      `✨ **CREATIVOS**: El bajo CTR sugiere fatiga creativa. Prueba nuevos hooks, copywriting emocional o cambio de formato visual.`
    )
  }

  // Executive Summary
  const executiveSummary: string[] = []

  executiveSummary.push(`📊 **ROAS Promedio**: ${avgRoas.toFixed(2)}x ${avgRoas >= 2 ? '✅ Saludable' : '⚠️ Requiere mejora'}`)

  if (bestCampaign) {
    executiveSummary.push(
      `🏆 **Campaña Ganadora**: "${bestCampaign.name}" (${bestCampaign.roas}x ROAS, $${bestCampaign.spend.toFixed(2)} gasto)`
    )
  }

  if (campaignsWithConversions.length === campaigns.length) {
    executiveSummary.push(`✅ **Conversiones**: Todas las campañas generan conversiones`)
  } else {
    executiveSummary.push(
      `⚠️ **Conversiones**: ${campaignsWithConversions.length}/${campaigns.length} campañas generan conversiones`
    )
  }

  executiveSummary.push(`📈 **Tendencia**: ${problems.length === 0 ? 'Estable y optimizada' : 'Requiere atención en ' + problems.length + ' áreas'}`)

  // Trends
  const trends: string[] = []

  if (highCtrCampaigns.length > 0) {
    trends.push(`📈 **CTR Alto**: ${highCtrCampaigns.length} campañas con CTR superior al promedio. Buena relevancia creativa.`)
  }

  if (efficientCpc.length > 0) {
    trends.push(
      `💰 **CPC Eficiente**: ${efficientCpc.length} campañas con CPC optimizado. Buen control de pujas y segmentación.`
    )
  }

  if (efficientCpaCampaigns.length > 0) {
    trends.push(
      `🎯 **CPA Óptimo**: ${efficientCpaCampaigns.length} campañas con CPA eficiente. Targeting muy acertado en estas.`
    )
  }

  // Creative Suggestions
  const creativeSuggestions: string[] = []

  creativeSuggestions.push(
    `**Hook 1 - Urgencia + Escasez**: "Último día con 30% OFF - Stock limitado" con video de producto en acción (3-5 seg) + CTA directo.`
  )

  creativeSuggestions.push(
    `**Hook 2 - Transformación**: Antes/después mostrando cambio con tu producto. Copy emocional: "La ropa que te hace sentir confiado".`
  )

  if (lowCtrCampaigns.length > 0) {
    creativeSuggestions.push(
      `**Hook 3 - Prueba Social**: Testimonios + números de ventas: "10,000+ clientes satisfechos". Genera confianza en audiencias nuevas.`
    )
  }

  creativeSuggestions.push(
    `**Hook 4 - Problema/Solución**: "¿Cansado de ropa incómoda?" → "Descubre nuestras prendas premium que duran años".`
  )

  creativeSuggestions.push(
    `**Hook 5 - Oferta Exclusiva**: "Solo para Instagram: Envío gratis + Gift con tu compra". Crea FOMO.`
  )

  // Action Checklist
  const actionChecklist: string[] = []

  if (bestCampaign && parseFloat(bestCampaign.roas) > 2.5) {
    actionChecklist.push(`✅ Aumentar presupuesto de "${bestCampaign.name}" en 25%`)
  }

  if (campaignsWithoutConversions.length > 0) {
    actionChecklist.push(`🔍 Auditar landing page y funnel de campañas sin conversiones`)
  }

  if (lowCtrCampaigns.length > 0) {
    actionChecklist.push(`🎬 Crear 3 nuevos creativos con diferentes hooks para campañas bajo CTR`)
  }

  actionChecklist.push(`📊 Revisar y afinar targeting de audiencias por geografía`)
  actionChecklist.push(`💾 Crear backup de campañas ganadoras para scaling`)
  actionChecklist.push(`🔄 Implementar frecuencia cap para evitar fatiga`)
  actionChecklist.push(`📈 Establecer KPI mínimo: ROAS 2x y CPA < $15`)

  const performanceStatus =
    avgRoas >= 3
      ? '🟢 Excelente - Mantener y escalar'
      : avgRoas >= 2
        ? '🟡 Bueno - Optimizar y diversificar'
        : '🔴 Requiere atención - Revisar y reoptimizar'

  return {
    executiveSummary,
    performanceStatus,
    trends,
    problemsDetected: problems,
    recommendations,
    creativeSuggestions,
    actionChecklist,
  }
}
